import { inject, injectable } from 'inversify';
import { Logger } from 'winston';

import { AssetRepository } from '../../repositories/AssetRepository';
import { AssetStateMap } from '../../types';

@injectable()
export class AssetBurntStateSetter {
  @inject('Logger') private logger!: Logger;
  @inject(AssetRepository) private assetRepository: AssetRepository;

  async apply(collectionId: string, tokenId: number): Promise<void> {
    const asset = await this.assetRepository.findByCollectionIdAndTokenId(collectionId, tokenId);

    await this.assetRepository.updateState(asset.id, AssetStateMap.burnt);
  }
}
