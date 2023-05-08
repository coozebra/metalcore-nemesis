import { expect } from 'chai';
import { Container } from 'inversify';
import { Contract } from 'ethers';

import { setupAsset, setupCollection, setupGame, setupStudio, setupUser } from '../../controls';
import { getTestContainer } from '../../helpers/getTestContainer';
import { setupChain } from '../../controls/setupChain';

import { AssetDocument } from '../../../src/models/Asset';
import { UserDocument } from '../../../src/models/User';
import { GameDocument } from '../../../src/models/Game';

import { GamePortalContractFactory } from '../../../src/services/factories/GamePortalContractFactory';

import { BlockchainProviderFactory } from '../../../src/services/BlockchainProviderFactory';
import { AssetDepositer } from '../../../src/services/assets/AssetDepositer';
import { AssetWithdrawer } from '../../../src/services/assets/AssetWithdrawer';

describe('DepositAndWithdraw', () => {
  let assetDepositer: AssetDepositer;
  let assetWithdrawer: AssetWithdrawer;

  let container: Container;

  let game: GameDocument;
  let asset: AssetDocument;
  let user: UserDocument;

  let assetContract: Contract;
  let gamePortal: Contract;
  let userWallet: any;
  let chainId: number;

  beforeEach(async () => {
    ({ gamePortal, assetContract, userWallet } = await setupChain());

    const studio = await setupStudio();
    game = await setupGame(studio, { contractAddress: gamePortal.address });
    const collection = await setupCollection(game, { contractAddress: assetContract.address });
    user = await setupUser(game, { walletAddress: userWallet.address });
    asset = await setupAsset(user, collection, { tokenId: 1 });

    chainId = (await gamePortal.provider.getNetwork()).chainId;

    container = getTestContainer();

    container
      .bind(GamePortalContractFactory)
      .toConstantValue({ call: () => Promise.resolve(gamePortal) } as unknown as GamePortalContractFactory);
    container
      .bind(BlockchainProviderFactory)
      .toConstantValue({ apply: () => gamePortal.provider } as unknown as BlockchainProviderFactory);

    assetDepositer = container.get(AssetDepositer);
    assetWithdrawer = container.get(AssetWithdrawer);
  });

  describe('when depositing an asset', () => {
    it('returns a successful transaction hash', async () => {
      const { signature } = await assetDepositer.apply(asset.id, user.accountId, chainId);

      await gamePortal.mintAsset(assetContract.address, userWallet.address);
      await assetContract.connect(userWallet).approve(gamePortal.address, asset.tokenId);

      const tx = await gamePortal.connect(userWallet).depositERC721(assetContract.address, asset.tokenId, signature);

      expect(tx.hash).to.have.length(66);
    });
  });

  describe('when withdrawing an asset for the asset owner', () => {
    it('returns a successful transaction hash', async () => {
      const { signature } = await assetWithdrawer.apply(asset.id, user.accountId, chainId);

      await gamePortal.mintAsset(assetContract.address, gamePortal.address);

      const tx = await gamePortal.connect(userWallet).withdrawERC721(assetContract.address, asset.tokenId, signature);

      expect(tx.hash).to.have.length(66);
    });
  });
});
