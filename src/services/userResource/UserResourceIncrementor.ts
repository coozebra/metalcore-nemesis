import { ClientSession } from 'mongoose';
import { inject, injectable } from 'inversify';

import { UserResourceRepository } from '../../repositories/UserResourceRepository';
import { TransactionRepository } from '../../repositories/TransactionRepository';
import { MongoTransaction } from '../../repositories/MongoTransaction';
import { ResourceTxFactory } from '../factories/ResourceTxFactory';
import { Balances, UserResource } from '../../types';
import { Logger } from '../../types/ILogger';

@injectable()
export class UserResourceIncrementor {
  @inject('Logger') logger!: Logger;

  @inject(UserResourceRepository) private userResourceRepository: UserResourceRepository;
  @inject(TransactionRepository) private transactionRepository: TransactionRepository;
  @inject(MongoTransaction) private mongoTransaction: MongoTransaction;
  @inject(ResourceTxFactory) resourceTxFactory: ResourceTxFactory;

  async apply(collectionId: string, userId: string, gameId: string, balances: Balances): Promise<UserResource> {
    const transaction = await this.resourceTxFactory.call(collectionId, userId, gameId, balances);

    await this.mongoTransaction.runInTransaction((session: ClientSession) =>
      Promise.all([
        this.userResourceRepository.incrementBalance(
          {
            collectionId,
            userId,
            gameId,
            balances: balances,
          },
          session
        ),
        this.transactionRepository.create(transaction, session),
      ])
    );

    return this.userResourceRepository.findOne(collectionId, userId, gameId);
  }
}
