import { inject, injectable } from 'inversify';

import { AssetRepository } from '../../../repositories/AssetRepository';
import { Asset } from '../../../types';

@injectable()
export class AttributesUpdater {
  @inject(AssetRepository) private assetRepository: AssetRepository;

  async apply(assetId: string, attributes: Record<string, unknown>): Promise<Asset> {
    return this.assetRepository.updateAttributes(assetId, attributes);
  }
}
