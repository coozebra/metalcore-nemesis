import Joi from 'joi';
import { expect } from 'chai';
import { BigNumber, Contract, Wallet } from 'ethers';

import { setupAsset, setupCollection, setupGame, setupStudio, setupUser } from '../../controls';
import { getTestContainer } from '../../helpers/getTestContainer';
import { testSchema } from '../../helpers/testSchema';

import { AssetDocument } from '../../../src/models/Asset';
import { UserDocument } from '../../../src/models/User';
import { GameDocument } from '../../../src/models/Game';

import { GamePortalContractFactory } from '../../../src/services/factories/GamePortalContractFactory';
import { AssetWithdrawer } from '../../../src/services/assets/AssetWithdrawer';
import { CollectionDocument } from '../../../src/models/Collection';

describe('AssetWithdrawer', () => {
  let assetWithdrawer: AssetWithdrawer;

  let game: GameDocument;
  let asset: AssetDocument;
  let user: UserDocument;
  let collection: CollectionDocument;

  const mockGamePortalContract = {
    nonces: () => Promise.resolve(BigNumber.from(1)),
    signer: Wallet.createRandom(),
  };

  const mockGamePortalFactory = {
    call: () => Promise.resolve(mockGamePortalContract) as unknown as Promise<Contract>,
  } as unknown as GamePortalContractFactory;

  const chainId = 1;

  beforeEach(async () => {
    const container = getTestContainer();

    const studio = await setupStudio();
    game = await setupGame(studio);
    collection = await setupCollection(game);
    user = await setupUser(game, { walletAddress: '0x9dc3f4bd75ba204430b86c1aa670493f3e31f44e' });
    asset = await setupAsset(user, collection, { tokenId: 1 });

    container.bind(GamePortalContractFactory).toConstantValue(mockGamePortalFactory);

    assetWithdrawer = container.get(AssetWithdrawer);
  });

  describe('with correct parameters', () => {
    it('returns the signature', async () => {
      const signature = await assetWithdrawer.apply(asset.id, user.accountId, chainId);

      const schema = Joi.object({
        message: Joi.object({
          contractAddress: Joi.string().length(42),
          walletAddress: Joi.string().length(42),
          chainId: Joi.number().required(),
          tokenId: Joi.number().required(),
          nonce: Joi.number().required(),
          signatureType: Joi.string().required(),
        }),
        signature: Joi.string().length(132),
      });

      expect(testSchema(signature, schema)).to.eql(true);
    });
  });

  describe('with incorrect parameters', () => {
    describe('when accountId does not exist', () => {
      it('returns an error', async () => {
        await expect(assetWithdrawer.apply(asset.id, user.id, chainId)).to.be.rejectedWith('User not found');
      });
    });

    describe('when assetId does not exist', () => {
      it('returns an error', async () => {
        await expect(assetWithdrawer.apply(user.id, user.accountId, chainId)).to.be.rejectedWith('Asset not found');
      });
    });

    describe('when user does not have a walletAddress', () => {
      beforeEach(async () => {
        user = await setupUser(game);
        asset = await setupAsset(user, collection, { tokenId: 2 });
      });

      it('returns an error', async () => {
        await expect(assetWithdrawer.apply(asset.id, user.accountId, chainId)).to.be.rejectedWith(
          'User has no linked wallet address'
        );
      });
    });

    describe('when user is not owner of the asset', () => {
      let user2: UserDocument;

      beforeEach(async () => {
        user2 = await setupUser(game);
      });

      it('returns an error', async () => {
        await expect(assetWithdrawer.apply(asset.id, user2.accountId, chainId)).to.be.rejectedWith(
          'User is not the owner of the asset'
        );
      });
    });
  });
});
