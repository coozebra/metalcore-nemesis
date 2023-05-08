import sinon from 'sinon';
import chai, { expect } from 'chai';
import { Container } from 'inversify';
import chaiAsPromised from 'chai-as-promised';
import { BigNumber, Contract, ethers, providers } from 'ethers';

import Settings from '../../../src/types/Settings';
import TransactionModel from '../../../src/models/Transaction';
import { getTestContainer } from '../../helpers/getTestContainer';
import TransactionWorker from '../../../src/workers/TransactionWorker';
import { CollectionRepository } from '../../../src/repositories/CollectionRepository';
import { AssetReceiptProcessor } from '../../../src/services/blockchain/receiptProcessors';
import { BlockchainProviderFactory } from '../../../src/services/BlockchainProviderFactory';
import { GamePortalContractFactory } from '../../../src/services/factories/GamePortalContractFactory';
import { AssetTxMetadata, Collection, TransactionState, TransactionType } from '../../../src/types';

chai.use(chaiAsPromised);

describe('TransactionWorker', () => {
  let container: Container;
  let transactionWorker: TransactionWorker;

  let blockchainProviderFactory: sinon.SinonStubbedInstance<BlockchainProviderFactory>;
  let collectionRepository: sinon.SinonStubbedInstance<CollectionRepository>;
  let provider: sinon.SinonStubbedInstance<providers.JsonRpcProvider>;

  const settings = {
    blockchain: {
      polygon: {
        provider: 'url1',
        confirmations: 250,
      },
    },
  } as Settings;

  const mockParams = {
    collectionId: '8368f39a584b964c6aec961d',
    gameId: '8368f39a584b964c6aec961d',
    contractAddress: '0x' + '0'.repeat(40),
  };

  const mockGamePortalContract = {
    callStatic: {
      get mintBatchAsset() {
        return mockGamePortalContract.mintBatchAsset;
      },
    },
    mintBatchAsset: () => Promise.resolve({ hash: 'tid1' }),
    signer: {
      getAddress: () => Promise.resolve(mockParams.contractAddress),
    },
    provider: {
      getNetwork: () => Promise.resolve(1),
    },
  };

  const mockGamePortalFactory = {
    call: () => Promise.resolve(mockGamePortalContract) as unknown as Promise<Contract>,
  } as unknown as GamePortalContractFactory;

  beforeEach(async () => {
    container = getTestContainer();

    container.rebind('Settings').toConstantValue(settings);
    container.bind(GamePortalContractFactory).toConstantValue(mockGamePortalFactory);
    container
      .bind(CollectionRepository)
      .toConstantValue((collectionRepository = sinon.createStubInstance(CollectionRepository)));
    container
      .bind(BlockchainProviderFactory)
      .toConstantValue((blockchainProviderFactory = sinon.createStubInstance(BlockchainProviderFactory)));
    container
      .bind(AssetReceiptProcessor)
      .toConstantValue({ apply: () => Promise.resolve() } as unknown as AssetReceiptProcessor);

    collectionRepository.findById.returns(
      Promise.resolve({ gameId: mockParams.gameId, contractAddress: mockParams.contractAddress } as Collection)
    );

    blockchainProviderFactory.apply
      .withArgs(settings.blockchain.polygon.provider)
      .returns((provider = sinon.createStubInstance(providers.JsonRpcProvider)));

    transactionWorker = container.get(TransactionWorker);
  });

  afterEach(async () => {
    await TransactionModel.deleteMany({});
  });

  describe('for pending transactions', () => {
    it('mints an asset and updates transaction state', async () => {
      const pendingTx = {
        state: TransactionState.pending,
        type: TransactionType.MintAsset,
        groupId: '12',
        metadata: {
          collectionId: mockParams.collectionId,
        } as AssetTxMetadata,
      };

      const [{ _id }] = await TransactionModel.create([pendingTx]);

      await transactionWorker.applySync();

      const updatedTransaction = await TransactionModel.findOne({ _id });

      expect(updatedTransaction.state).is.eq(TransactionState.submitting);
      expect(updatedTransaction.transactionHash).is.eq('tid1');
    });
  });

  describe('for submitting transactions', () => {
    it('updates transaction state to submitted', async () => {
      const submittingTx = {
        state: TransactionState.submitting,
        type: TransactionType.MintAsset,
        groupId: '12',
        transactionHash: 'tid1',
        metadata: { collectionId: mockParams.collectionId } as AssetTxMetadata,
      };

      const [{ _id }] = await TransactionModel.create([submittingTx]);

      provider.getBlockNumber.resolves(1000);

      provider.getTransactionReceipt.withArgs('tid1').resolves({
        status: 1,
        blockNumber: 1000 - settings.blockchain.polygon.confirmations,
        gasUsed: BigNumber.from(666),
        effectiveGasPrice: BigNumber.from(666),
        cumulativeGasUsed: BigNumber.from(666),
      } as unknown as ethers.providers.TransactionReceipt);

      await transactionWorker.applySync();

      const updatedTransaction = await TransactionModel.findOne({ _id });

      expect(updatedTransaction.state).is.eq(TransactionState.submitted);
    });
  });
});
