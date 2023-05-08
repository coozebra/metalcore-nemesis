import { inject, injectable } from 'inversify';

import { CollectionRepository } from '../../repositories/CollectionRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { AssetRepository } from '../../repositories/AssetRepository';

@injectable()
export class UserAssetDepositAssigner {
  @inject(CollectionRepository) private collectionRepository: CollectionRepository;
  @inject(UserRepository) private userRepository: UserRepository;
  @inject(AssetRepository) private assetRepository: AssetRepository;

  async apply(collectionContractAddress: string, tokenId: number, walletAddress: string): Promise<void> {
    const { id: collectionId } = await this.collectionRepository.findByContractAddress(collectionContractAddress);

    const user = await this.userRepository.findByWalletAddress(walletAddress);

    await this.assetRepository.setUserId(collectionId, tokenId, user.id);
  }
}
