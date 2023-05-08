import 'reflect-metadata';

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Container } from 'inversify';
import { Contract, Signer } from 'ethers';

import AssetModel from '../../../src/models/Asset';
import { getTestContainer } from '../../helpers/getTestContainer';
import AssetWithdrawWorker from '../../../src/workers/AssetWithdrawWorker';
import { AssetWithdrawer } from '../../../src/services/assets/AssetWithdrawer';
import { BlockchainProviderFactory } from '../../../src/services/BlockchainProviderFactory';
import { GamePortalContractFactory } from '../../../src/services/factories/GamePortalContractFactory';

import { setupStudio, setupGame, setupCollection, setupUser, setupAsset, setupChain } from '../../controls';

async function setupDB(gamePortalAddress: string, assetAddress: string, walletAddress: string) {
  const studio = await setupStudio();
  const game = await setupGame(studio, { contractAddress: gamePortalAddress });
  const collection = await setupCollection(game, { contractAddress: assetAddress });
  const user = await setupUser(game, { walletAddress });

  return { studio, game, collection, user };
}

describe('AssetWithdrawWorker', () => {
  let container: Container;
  let assetWithdrawWorker: AssetWithdrawWorker;
  let assetContract: Contract;
  let gamePortal: Contract;
  let alice: Signer;
  let aliceAddress: string;
  let userId: string;

  beforeEach(async () => {
    ({ gamePortal, assetContract, userWallet: alice } = await setupChain());

    container = getTestContainer();
    container
      .bind(GamePortalContractFactory)
      .toConstantValue({ call: () => Promise.resolve(gamePortal) } as unknown as GamePortalContractFactory);
    container
      .bind(BlockchainProviderFactory)
      .toConstantValue({ apply: () => gamePortal.provider } as unknown as BlockchainProviderFactory);

    assetWithdrawWorker = container.get(AssetWithdrawWorker);

    aliceAddress = await alice.getAddress();
  });

  describe('#processTransactions', () => {
    beforeEach(async () => {
      const { collection, user } = await setupDB(gamePortal.address, assetContract.address, aliceAddress);

      userId = user.id;

      const asset = await setupAsset(user, collection, { tokenId: 1 });

      const { chainId } = await gamePortal.provider.getNetwork();

      const { signature } = await container.get(AssetWithdrawer).apply(asset.id, user.accountId, chainId);

      await gamePortal.mintAsset(assetContract.address, gamePortal.address);

      await gamePortal.connect(alice).withdrawERC721(assetContract.address, asset.tokenId, signature);
    });

    describe('when params are correct', () => {
      it('sets userId to the asset', async () => {
        expect(await AssetModel.find({ userId })).to.have.lengthOf(1);

        const latestBlock = await ethers.provider.getBlock('latest');

        await assetWithdrawWorker.processTransactions(gamePortal.address, 1, latestBlock.number);

        expect(await AssetModel.find({ userId })).to.have.lengthOf(0);
      });
    });
  });
});
