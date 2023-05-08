import { inject, injectable } from 'inversify';

import { CollectionRepository } from '../../repositories/CollectionRepository';
import { AssetRepository } from '../../repositories/AssetRepository';

@injectable()
export class UserAssetWithdrawAssigner {
  @inject(CollectionRepository) private collectionRepository: CollectionRepository;
  @inject(AssetRepository) private assetRepository: AssetRepository;

  async apply(collectionContractAddress: string, tokenId: number): Promise<void> {
    const { id: collectionId } = await this.collectionRepository.findByContractAddress(collectionContractAddress);

    await this.assetRepository.setUserId(collectionId, tokenId, null);
  }
}
