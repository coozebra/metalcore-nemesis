import sinon from 'sinon';
import { expect } from 'chai';
import { BigNumber, ethers, providers } from 'ethers';

import Settings from '../../../src/types/Settings';
import { getTestContainer } from '../../helpers/getTestContainer';
import TransactionWorker from '../../../src/workers/TransactionWorker';
import { TransactionRepository } from '../../../src/repositories/TransactionRepository';
import { BlockchainProviderFactory } from '../../../src/services/BlockchainProviderFactory';
import { AssetMinter, UserResourceMinter } from '../../../src/services/blockchain/transactors';
import {
  TransactionState,
  TransactionType,
  AssetTxMetadata,
  UserResourceMinterMetadata,
  ResourceTxMetadata,
  Transaction,
} from '../../../src/types';

describe('TransactionWorker', () => {
  let transactionRepository: sinon.SinonStubbedInstance<TransactionRepository>;
  let userResourceMinter: sinon.SinonStubbedInstance<UserResourceMinter>;
  let assetMinter: sinon.SinonStubbedInstance<AssetMinter>;
  let blockchainProviderFactory: sinon.SinonStubbedInstance<BlockchainProviderFactory>;
  let provider: sinon.SinonStubbedInstance<providers.JsonRpcProvider>;

  let settings!: Settings;

  let transactionWorker: TransactionWorker;

  beforeEach(async () => {
    const container = getTestContainer();

    container
      .bind(UserResourceMinter)
      .toConstantValue((userResourceMinter = sinon.createStubInstance(UserResourceMinter)));
    container.bind(AssetMinter).toConstantValue((assetMinter = sinon.createStubInstance(AssetMinter)));
    container
      .bind(TransactionRepository)
      .toConstantValue((transactionRepository = sinon.createStubInstance(TransactionRepository)));
    container
      .bind(BlockchainProviderFactory)
      .toConstantValue((blockchainProviderFactory = sinon.createStubInstance(BlockchainProviderFactory)));

    settings = {
      blockchain: {
        polygon: {
          provider: 'url1',
          confirmations: 250,
        },
      },
    } as Settings;

    container.unbind('Settings');
    container.bind('Settings').toConstantValue(settings);

    blockchainProviderFactory.apply
      .withArgs(settings.blockchain.polygon.provider)
      .returns((provider = sinon.createStubInstance(providers.JsonRpcProvider)));

    transactionWorker = container.get(TransactionWorker);
  });

  it('Successfully finishes if there are no pending transactions', async () => {
    transactionRepository.findAllExceptState.withArgs(TransactionState.submitted).resolves([]);

    expect(await transactionWorker.applySync()).is.undefined;
  });

  it('Sends transaction to assetMinter', async () => {
    const transaction = {
      id: 'id1',
      state: TransactionState.pending,
      updatedAt: Date.now(),
      type: TransactionType.MintAsset,
      groupId: '12',
      metadata: {} as AssetTxMetadata,
    };

    transactionRepository.findAllExceptState.withArgs(TransactionState.submitted).resolves([transaction]);

    assetMinter.apply.withArgs([transaction]).resolves('tid1');

    transactionRepository.updateTransactionStateAndHash
      .withArgs(['id1'], TransactionState.submitting, 'tid1')
      .resolves();

    await transactionWorker.applySync();

    await expect(
      transactionRepository.updateTransactionStateAndHash.calledOnceWith(['id1'], TransactionState.submitting, 'tid1')
    ).is.true;
  });

  it('Sends transaction to userResourceMinter', async () => {
    const transaction = {
      id: 'id1',
      state: TransactionState.pending,
      updatedAt: Date.now(),
      type: TransactionType.MintResource,
      groupId: '12',
      metadata: {} as UserResourceMinterMetadata,
    };

    transactionRepository.findAllExceptState.withArgs(TransactionState.submitted).resolves([transaction]);

    userResourceMinter.apply.withArgs([transaction] as unknown as Transaction<ResourceTxMetadata>[]).resolves('tid1');

    transactionRepository.updateTransactionStateAndHash
      .withArgs(['id1'], TransactionState.submitting, 'tid1')
      .resolves();

    await transactionWorker.applySync();

    await expect(
      transactionRepository.updateTransactionStateAndHash.calledOnceWith(['id1'], TransactionState.submitting, 'tid1')
    ).is.true;
  });

  it('Sends grouped TXs to userResourceMinter', async () => {
    const transactions = [
      {
        id: 'id1',
        state: TransactionState.pending,
        updatedAt: Date.now(),
        type: TransactionType.MintResource,
        groupId: '12',
        metadata: {} as UserResourceMinterMetadata,
      },
      {
        id: 'id2',
        state: TransactionState.pending,
        updatedAt: Date.now(),
        type: TransactionType.MintResource,
        groupId: '12',
        metadata: {} as UserResourceMinterMetadata,
      },
      {
        id: 'id3',
        state: TransactionState.pending,
        updatedAt: Date.now(),
        type: TransactionType.MintResource,
        groupId: '23',
        metadata: {} as UserResourceMinterMetadata,
      },
    ];

    transactionRepository.findAllExceptState.withArgs(TransactionState.submitted).resolves(transactions);

    userResourceMinter.apply
      .withArgs([transactions[0], transactions[1]] as unknown as Transaction<ResourceTxMetadata>[])
      .resolves('tid1');

    transactionRepository.updateTransactionStateAndHash
      .withArgs(['id1', 'id2'], TransactionState.submitting, 'tid1')
      .resolves();

    await transactionWorker.applySync();

    await expect(
      transactionRepository.updateTransactionStateAndHash.calledWith(
        ['id1', 'id2'],
        TransactionState.submitting,
        'tid1'
      )
    ).is.true;
  });

  it('Waits if there is an unconfirmed TX', async () => {
    const transactions = [
      {
        id: 'id1',
        state: TransactionState.submitting,
        updatedAt: Date.now(),
        type: TransactionType.MintResource,
        groupId: '12',
        metadata: {} as UserResourceMinterMetadata,
      },
    ];

    transactionRepository.findAllExceptState.withArgs(TransactionState.submitted).resolves(transactions);

    provider.getBlockNumber.resolves(1000);

    transactionRepository.updateTransactionStateAndHash
      .withArgs(['id1'], TransactionState.submitted, 'tid1')
      .resolves();

    await transactionWorker.applySync();

    await expect(
      transactionRepository.updateTransactionStateAndHash.neverCalledWith(['id1'], TransactionState.submitted, 'tid1')
    ).is.true;
  });

  it('Confirms a TX if enough blocks passed', async () => {
    const transactions = [
      {
        id: 'id1',
        transactionHash: 'tid1',
        state: TransactionState.submitting,
        updatedAt: Date.now(),
        type: TransactionType.MintResource,
        groupId: '12',
        metadata: {} as UserResourceMinterMetadata,
      },
    ];

    transactionRepository.findAllExceptState.withArgs(TransactionState.submitted).resolves(transactions);

    provider.getBlockNumber.resolves(1000);

    provider.getTransactionReceipt.withArgs('tid1').resolves({
      status: 1,
      blockNumber: 1000 - settings.blockchain.polygon.confirmations,
      gasUsed: BigNumber.from(666),
      effectiveGasPrice: BigNumber.from(666),
      cumulativeGasUsed: BigNumber.from(666),
    } as unknown as ethers.providers.TransactionReceipt);

    transactionRepository.updateTransactionState.withArgs(['id1'], TransactionState.submitted).resolves();

    await transactionWorker.applySync();

    await expect(transactionRepository.updateTransactionState.calledOnceWith(['id1'], TransactionState.submitted)).is
      .true;
  });

  it('Re-sends a rejected TX', async () => {
    const transactions = [
      {
        id: 'id1',
        transactionHash: 'tid1',
        state: TransactionState.submitting,
        updatedAt: Date.now(),
        type: TransactionType.MintResource,
        groupId: '12',
        metadata: {} as UserResourceMinterMetadata,
      },
    ];

    transactionRepository.findAllExceptState.withArgs(TransactionState.submitted).resolves(transactions);

    provider.getBlockNumber.resolves(1000);

    provider.getTransactionReceipt.withArgs('tid1').resolves({
      status: 0,
      blockNumber: 1000 - settings.blockchain.polygon.confirmations,
    } as ethers.providers.TransactionReceipt);

    transactionRepository.updateTransactionState.withArgs(['id1'], TransactionState.submitting).resolves();

    userResourceMinter.apply
      .withArgs([transactions[0]] as unknown as Transaction<ResourceTxMetadata>[])
      .resolves('tid2');

    await transactionWorker.applySync();

    await expect(
      transactionRepository.updateTransactionStateAndHash.calledOnceWith(['id1'], TransactionState.submitting, 'tid2')
    ).is.true;
  });
});
