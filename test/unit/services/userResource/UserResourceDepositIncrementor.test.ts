import 'reflect-metadata';
import sinon from 'sinon';
import { expect } from 'chai';

import { getTestContainer } from '../../../helpers/getTestContainer';
import { UserResourceDepositIncrementor } from '../../../../src/services/userResource/UserResourceDepositIncrementor';
import { UserResourceRepository } from '../../../../src/repositories/UserResourceRepository';
import { UserRepository } from '../../../../src/repositories/UserRepository';
import { CollectionRepository } from '../../../../src/repositories/CollectionRepository';
import { ResourceRepository } from '../../../../src/repositories/ResourceRepository';

describe('UserResourceDepositIncrementor', () => {
  let userResourceDepositIncrementor: UserResourceDepositIncrementor;

  let userResourceRepository: sinon.SinonStubbedInstance<UserResourceRepository>;
  let userRepository: sinon.SinonStubbedInstance<UserRepository>;
  let collectionRepository: sinon.SinonStubbedInstance<CollectionRepository>;
  let resourceRepository: sinon.SinonStubbedInstance<ResourceRepository>;

  const collectionId = '1234';
  const walletAddress = '0xABCD';
  const tokenId = 32;
  const amount = 1000;
  const txId = 'tx1';
  const blockNumber = 132;

  beforeEach(async () => {
    const container = getTestContainer();

    container
      .bind(UserResourceRepository)
      .toConstantValue((userResourceRepository = sinon.createStubInstance(UserResourceRepository)));
    container.bind(UserRepository).toConstantValue((userRepository = sinon.createStubInstance(UserRepository)));
    container
      .bind(CollectionRepository)
      .toConstantValue((collectionRepository = sinon.createStubInstance(CollectionRepository)));
    container
      .bind(ResourceRepository)
      .toConstantValue((resourceRepository = sinon.createStubInstance(ResourceRepository)));

    userResourceDepositIncrementor = container.get(UserResourceDepositIncrementor);
  });

  it('Should successfully resolve all IDs and pass it to incrementor', async () => {
    collectionRepository.findById.withArgs(collectionId).resolves({
      id: 'c1',
      gameId: 'g1',
      contractAddress: '0x1',
      name: 'n1',
      type: 't1',
    });
    userRepository.findByWalletAddress.withArgs(walletAddress).resolves({
      id: 'u1',
      walletAddress: 'w1',
      accountId: 'a1',
      studioId: 's1',
      balances: {},
    });
    resourceRepository.findByCollectionIdAndTokenId.resolves({
      id: 'r1',
      tokenId: 10,
      collectionId: 'c1',
      attributes: {},
    });

    await userResourceDepositIncrementor.apply(collectionId, tokenId, amount, walletAddress, txId, blockNumber);

    await expect(
      userResourceRepository.incrementBalanceWithDeposit.calledOnceWith(
        {
          userId: 'u1',
          gameId: 'g1',
          balances: { r1: amount },
          collectionId: 'c1',
        },
        {
          txId,
          amount,
          tokenId,
          blockNumber,
        }
      )
    ).is.true;
  });
});
