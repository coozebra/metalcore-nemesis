import { inject, injectable } from 'inversify';
import { Asset, Collection, User } from '../../types';
import { AssetRepository } from '../../repositories/AssetRepository';
import { MoralisAssetOwnerFetcher } from '../blockchain/MoralisAssetOwnerFetcher';

@injectable()
export class NonDepositedAssetsFetcher {
  @inject(AssetRepository) private assetRepository: AssetRepository;
  @inject(MoralisAssetOwnerFetcher) private assetOwnerFetcher: MoralisAssetOwnerFetcher;

  async apply(collection: Collection, user: User): Promise<Asset[]> {
    const nonDepositedAssetsInfo = await this.assetOwnerFetcher.apply(collection.contractAddress, user.walletAddress);

    const nonDepositedAssets = await Promise.all(
      nonDepositedAssetsInfo.map((nonDepositedAssetInfo) =>
        this.assetRepository.findByCollectionIdAndTokenId(collection.id, nonDepositedAssetInfo.tokenId)
      )
    );

    return nonDepositedAssets;
  }
}
