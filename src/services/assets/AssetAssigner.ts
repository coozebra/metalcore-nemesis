import { inject, injectable } from 'inversify';

import { NotFoundError } from '../../errors/application';
import { AssetRepository } from '../../repositories/AssetRepository';

@injectable()
export class AssetAssigner {
  @inject(AssetRepository) private assetRepository: AssetRepository;

  async apply(collectionId: string, userId: string, tokenId: number): Promise<void> {
    try {
      await this.assetRepository.findByCollectionIdAndTokenId(collectionId, tokenId);

      // tokenId was already assigned. Ignore
      return;
    } catch (err) {
      if (!(err instanceof NotFoundError)) {
        throw err;
      }
    }

    await this.assetRepository.setTokenId(collectionId, userId, tokenId);
  }
}
