import { inject, injectable } from 'inversify';

import { CollectionRepository } from '../../repositories/CollectionRepository';
import { NonDepositedAssetsFetcher } from './NonDepositedAssetsFetcher';
import { AssetRepository } from '../../repositories/AssetRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { GameRepository } from '../../repositories/GameRepository';
import { Asset } from '../../types';

@injectable()
export class AssetsRetriever {
  @inject(NonDepositedAssetsFetcher) private nonDepositedAssetsFetcher: NonDepositedAssetsFetcher;
  @inject(CollectionRepository) private collectionRepository: CollectionRepository;
  @inject(AssetRepository) private assetRepository: AssetRepository;
  @inject(UserRepository) private userRepository: UserRepository;
  @inject(GameRepository) private gameRepository: GameRepository;

  apply = async (gameId: string, accountId?: string): Promise<Asset[]> => {
    await this.checkIfGameExists(gameId);

    const collections = await this.collectionRepository.findManyByGameId(gameId);

    const assets = await Promise.all(
      collections.map(async (collection) => {
        if (accountId) {
          const user = await this.userRepository.findByAccountId(accountId);

          if (user.walletAddress) {
            const nonDepositedAssets = await this.nonDepositedAssetsFetcher.apply(collection, user);

            const depositedAssets = await this.assetRepository.findByUserIdAndCollectionId(user.id, collection.id);

            return [...nonDepositedAssets, ...depositedAssets];
          }

          return this.assetRepository.findByUserIdAndCollectionId(user.id, collection.id);
        }

        return this.assetRepository.findByCollectionId(collection.id);
      })
    );

    return assets.flat();
  };

  private checkIfGameExists = async (gameId: string): Promise<void> => {
    await this.gameRepository.findById(gameId);
  };
}
