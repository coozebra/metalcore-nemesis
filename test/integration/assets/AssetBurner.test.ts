import { expect } from 'chai';

import { TransactionRepository } from '../../../src/repositories/TransactionRepository';
import { setupAsset, setupCollection, setupGame, setupStudio, setupUser } from '../../controls';
import { AssetBurner } from '../../../src/services/assets/AssetBurner';
import { getTestContainer } from '../../helpers/getTestContainer';
import { GameDocument } from '../../../src/models/Game';

import Transaction from '../../../src/models/Transaction';
import Asset, { AssetDocument } from '../../../src/models/Asset';

describe('AssetBurner', () => {
  const container = getTestContainer();
  const assetBurner = container.get(AssetBurner);

  let asset: AssetDocument;
  let game: GameDocument;

  const attributes = {
    name: 'test',
  };

  beforeEach(async () => {
    const studio = await setupStudio();
    game = await setupGame(studio);
    const collection = await setupCollection(game);
    const user = await setupUser(game);
    asset = await setupAsset(user, collection, { tokenId: 1, attributes });
  });

  describe('with correct params', () => {
    it('inserts the transaction into the DB and updates the asset', async () => {
      await assetBurner.apply(asset.id, game.id);

      const count = await Transaction.countDocuments();
      const updatedAsset = await Asset.findOne({ _id: asset.id }, { __v: 0 });

      expect(count).to.deep.equal(1);
      expect(updatedAsset?.toObject()).to.deep.equal({
        _id: asset._id,
        type: 'Mech',
        userId: asset.userId,
        externalId: '123',
        collectionId: asset.collectionId,
        state: 'burning',
        tokenId: 1,
        attributes,
      });
    });
  });

  describe('with incorrect params', () => {
    describe('when asset does not exist', () => {
      it('throws an error', async () => {
        await expect(assetBurner.apply(game.id, game.id)).to.be.rejectedWith('Asset not found');
      });
    });

    describe('when requester do not own the game', () => {
      it('throws an error', async () => {
        await expect(assetBurner.apply(asset.id, asset.id)).to.be.rejectedWith('Collection ownership refused');
      });
    });
  });

  describe('when one operation fails', () => {
    it('does not store or update anything', async () => {
      const mockContainer = getTestContainer();

      mockContainer.bind(TransactionRepository).toConstantValue({
        create: () => {
          throw new Error();
        },
      } as unknown as TransactionRepository);

      const mockedAssetBurner = mockContainer.get(AssetBurner);

      try {
        await mockedAssetBurner.apply(asset.id, game.id);
      } catch {
        const count = await Transaction.countDocuments();
        const updatedAsset = await Asset.findOne({ _id: asset.id });

        expect(count).to.deep.equal(0);
        expect(updatedAsset?.toObject()).to.deep.equal(asset.toObject());
      }
    });
  });
});
