import { inject, injectable } from 'inversify';

import { Asset } from '../../types';
import { Logger } from '../../types/ILogger';
import { UserRepository } from '../../repositories/UserRepository';
import { CollectionOwnershipVerifier } from '../CollectionOwnershipVerifier';
import { CreateAssetDTO } from '../../dto/assets/CreateAssetDTO';

@injectable()
export class AssetFactory {
  @inject('Logger') logger!: Logger;
  @inject(UserRepository) private userRepository: UserRepository;
  @inject(CollectionOwnershipVerifier) collectionOwnershipVerifier: CollectionOwnershipVerifier;

  async call(params: Asset & CreateAssetDTO): Promise<Asset> {
    const { collectionId, type, externalId, attributes, accountId, game, state } = params;

    const [user] = await Promise.all([
      this.userRepository.findByAccountId(accountId),
      this.collectionOwnershipVerifier.apply(collectionId, game),
    ]);

    return {
      type: type,
      userId: user.id,
      externalId: externalId,
      collectionId: collectionId,
      state,
      attributes: attributes,
    };
  }
}
