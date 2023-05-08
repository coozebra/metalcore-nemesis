import 'reflect-metadata';

import { expect } from 'chai';
import hre from 'hardhat';
import { Container } from 'inversify';
import { Contract } from 'ethers';

import AssetModel from '../../../src/models/Asset';
import { TransactionType } from '../../../src/types';
import TransactionModel from '../../../src/models/Transaction';
import { getTestContainer } from '../../helpers/getTestContainer';
import TransactionWorker from '../../../src/workers/TransactionWorker';
import { AssetBurner } from '../../../src/services/assets/AssetBurner';
import { AssetCreator } from '../../../src/services/assets/AssetCreator';
import { BlockchainProviderFactory } from '../../../src/services/BlockchainProviderFactory';
import { GamePortalContractFactory } from '../../../src/services/factories/GamePortalContractFactory';

import { setupStudio, setupGame, setupCollection, setupUser, setupAsset } from '../../controls';
import { setupChain } from '../../controls/setupChain';

async function setupDB(gamePortalAddress: string, assetAddress: string) {
  const studio = await setupStudio();
  const game = await setupGame(studio, { contractAddress: gamePortalAddress });
  const collection = await setupCollection(game, { contractAddress: assetAddress });
  const user = await setupUser(game);

  return { studio, game, collection, user };
}

describe('TransactionWorker', () => {
  let container: Container;
  let transactionWorker: TransactionWorker;
  let assetContract: Contract;
  let gamePortal: Contract;

  beforeEach(async () => {
    ({ gamePortal, assetContract } = await setupChain());

    container = getTestContainer();
    container
      .bind(GamePortalContractFactory)
      .toConstantValue({ call: () => Promise.resolve(gamePortal) } as unknown as GamePortalContractFactory);
    container
      .bind(BlockchainProviderFactory)
      .toConstantValue({ apply: () => gamePortal.provider } as unknown as BlockchainProviderFactory);

    transactionWorker = container.get(TransactionWorker);
  });

  describe('MintAsset Transactor', () => {
    beforeEach(async () => {
      async function createNAssets(n: number) {
        const { game, collection, user } = await setupDB(gamePortal.address, assetContract.address);

        for (let i = 0; i < n; i++) {
          await container.get(AssetCreator).apply({
            game,
            type: 'Asset',
            accountId: user.accountId,
            externalId: '123',
            collectionId: collection.id,
            attributes: {},
          });
        }
      }

      await createNAssets(2);
    });

    describe('pending -> minting', () => {
      it('adds transactionHash to Transactions and changes their states', async () => {
        await transactionWorker.applySync();

        const txs = await TransactionModel.find();

        txs.forEach((tx) => {
          expect(tx.transactionHash).to.have.lengthOf(66);
          expect(tx.state).to.equal('submitting');
        });
      });

      it('changes the state of the assets to "minting"', async () => {
        await transactionWorker.applySync();

        const assets = await AssetModel.find();

        assets.forEach((asset) => {
          expect(asset.state).to.equal('minting');
        });
      });
    });

    describe('minting -> minted', () => {
      beforeEach(async () => {
        await transactionWorker.applySync();

        await hre.network.provider.send('hardhat_mine', ['0xff']);

        await transactionWorker.applySync();
      });

      it('changes Transaction states', async () => {
        const txs = await TransactionModel.find();

        txs.forEach((tx) => {
          expect(tx.state).to.equal('submitted');
        });
      });

      it('attributes tokenId and state to Assets', async () => {
        const assets = await AssetModel.find().sort({ tokenId: 1 });

        assets.forEach((asset, idx) => {
          expect(asset.state).to.equal('minted');
          expect(asset.tokenId).to.equal(idx + 1);
        });
      });
    });
  });

  describe('BurnAsset Transactor', () => {
    beforeEach(async () => {
      const { game, collection, user } = await setupDB(gamePortal.address, assetContract.address);

      const asset = await setupAsset(user, collection, { tokenId: 1 });

      await gamePortal.mintAsset(assetContract.address, gamePortal.address);

      await container.get(AssetBurner).apply(asset?.id, game.id);
    });

    describe('pending -> burning', () => {
      it('adds transactionHash to Transactions and changes their states', async () => {
        await transactionWorker.applySync();

        const txs = await TransactionModel.find({ type: TransactionType.BurnAsset });

        txs.forEach((tx) => {
          expect(tx.transactionHash).to.have.lengthOf(66);
          expect(tx.state).to.equal('submitting');
        });
      });

      it('changes the state of the assets to "burning"', async () => {
        await transactionWorker.applySync();

        const assets = await AssetModel.find();

        assets.forEach((asset) => {
          expect(asset.state).to.equal('burning');
        });
      });
    });

    describe('burning -> burnt', () => {
      beforeEach(async () => {
        await transactionWorker.applySync();

        await hre.network.provider.send('hardhat_mine', ['0xff']);

        await transactionWorker.applySync();
      });

      it('changes Transaction states', async () => {
        const txs = await TransactionModel.find();

        txs.forEach((tx) => {
          expect(tx.state).to.equal('submitted');
        });
      });

      it('changes the state of the asset to "burnt"', async () => {
        const assets = await AssetModel.find();

        assets.forEach((asset) => {
          expect(asset.state).to.equal('burnt');
        });
      });
    });
  });
});
