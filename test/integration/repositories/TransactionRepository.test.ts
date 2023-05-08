import { expect } from 'chai';

import { TransactionType, TransactionState, Transaction, ResourceTxMetadata } from '../../../src/types';
import { TransactionRepository } from '../../../src/repositories/TransactionRepository';
import { getTestContainer } from '../../helpers/getTestContainer';
import TransactionModel from '../../../src/models/Transaction';

describe('TransactionRepository', () => {
  const repository = getTestContainer().get(TransactionRepository);

  describe('#create', () => {
    let tx: Transaction<ResourceTxMetadata>;
    let initialCount: number;

    beforeEach(async () => {
      initialCount = await TransactionModel.countDocuments();
      tx = await repository.create({
        type: TransactionType.MintResource,
        state: TransactionState.pending,
        groupId: '1',
        metadata: {
          collectionId: 'string',
          userId: 'string',
          gameId: 'string',
          balances: {
            1: 123,
          },
        },
      });
    });

    it('stores a transaction', async () => {
      expect(await TransactionModel.countDocuments()).to.be.greaterThan(initialCount);
    });

    it('returns the created transaction', () => {
      expect(tx).to.deep.equal({
        id: tx.id,
        transactionHash: undefined,
        type: 'MintResource',
        state: 'pending',
        groupId: '1',
        updatedAt: tx.updatedAt,
        metadata: {
          collectionId: 'string',
          userId: 'string',
          gameId: 'string',
          balances: {
            1: 123,
          },
        },
      });
    });
  });
});
