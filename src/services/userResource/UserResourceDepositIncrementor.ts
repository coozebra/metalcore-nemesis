import { inject, injectable } from 'inversify';

import { UserResourceRepository } from '../../repositories/UserResourceRepository';
import { CollectionRepository } from '../../repositories/CollectionRepository';
import { ResourceRepository } from '../../repositories/ResourceRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { Logger } from '../../types/ILogger';

@injectable()
export class UserResourceDepositIncrementor {
  @inject('Logger') logger!: Logger;
  @inject(UserResourceRepository) userResourceRepository!: UserResourceRepository;
  @inject(UserRepository) userRepository!: UserRepository;
  @inject(CollectionRepository) collectionRepository!: CollectionRepository;
  @inject(ResourceRepository) resourceRepository!: ResourceRepository;

  async apply(
    collectionId: string,
    tokenId: number,
    amount: number,
    walletAddress: string,
    txId: string,
    blockNumber: number
  ): Promise<void> {
    const [collection, user] = await Promise.all([
      this.collectionRepository.findById(collectionId),
      this.userRepository.findByWalletAddress(walletAddress),
    ]);

    const resource = await this.resourceRepository.findByCollectionIdAndTokenId(collection.id, tokenId);

    return this.userResourceRepository.incrementBalanceWithDeposit(
      {
        userId: user.id,
        gameId: collection.gameId,
        collectionId: collection.id,
        balances: { [resource.id]: amount },
      },
      { txId, tokenId, amount, blockNumber }
    );
  }
}
