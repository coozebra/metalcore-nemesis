import chaiAsPromised from 'chai-as-promised';
import chai, { expect } from 'chai';
import 'reflect-metadata';

import { setupCollection, setupGame, setupStudio, setupUser } from '../../controls';
import { AssetRepository } from '../../../src/repositories/AssetRepository';
import { CollectionDocument } from '../../../src/models/Collection';
import { getTestContainer } from '../../helpers/getTestContainer';
import { NotFoundError } from '../../../src/errors/application';
import { Asset, AssetStateMap } from '../../../src/types';
import { UserDocument } from '../../../src/models/User';
import { GameDocument } from '../../../src/models/Game';
import AssetModel from '../../../src/models/Asset';


chai.use(chaiAsPromised);

describe('AssetRepository', () => {
  const assetRepository = getTestContainer().get(AssetRepository);

  let user: UserDocument;
  let collection: CollectionDocument;
  let game: GameDocument;

  beforeEach(async () => {
    game = await setupStudio().then(setupGame);
    user = await setupUser(game);
    collection = await setupCollection(game);
  });

  describe('#create', () => {
    describe('when the params are valid', () => {
      let asset: Asset;
      let storedAsset: Asset;
      let initialCount: number;
      let finalCount: number;

      beforeEach(async () => {
        asset = {
          type: 'Mech',
          externalId: '123',
          collectionId: collection.id,
          userId: user.id,
          tokenId: 10,
          attributes: {
            rarity: 'Uncommon',
            combat_role: 'Scout',
            model_number: 'ZA-V1',
            model_name: 'Zephyr',
            base_health: 300,
            hull: 1250,
            armor: '10%',
            weight: 'Light',
            gameplay_role: 'Support, Fast moving target designator',
            utility_slots: 3,
            utility_loadout: ['Sensors B6', 'Sensors B9', 'Mobility F2'],
            weapon_slots: 2,
            weapons: ['Energy weapons H2'],
          },
        };

        initialCount = await AssetModel.countDocuments();
        storedAsset = await assetRepository.create(asset);
      });

      it('increments the asset doc count', async () => {
        finalCount = await AssetModel.countDocuments();

        expect(finalCount).to.be.greaterThan(initialCount);
      });

      it('returns an asset object', async () => {
        expect(storedAsset).to.deep.equal({ ...asset, id: storedAsset.id, tokenId: null, state: storedAsset.state });
      });
    });

    describe("when the user doesn't exist", () => {
      let asset: Asset;
      let storedAsset: Asset;

      beforeEach(async () => {
        asset = {
          type: 'Mech',
          externalId: '123',
          collectionId: collection.id,
          attributes: {
            rarity: 'Uncommon',
            combat_role: 'Scout',
            model_number: 'ZA-V1',
            model_name: 'Zephyr',
            base_health: 300,
            hull: 1250,
            armor: '10%',
            weight: 'Light',
            gameplay_role: 'Support, Fast moving target designator',
            utility_slots: 3,
            utility_loadout: ['Sensors B6', 'Sensors B9', 'Mobility F2'],
            weapon_slots: 2,
            weapons: ['Energy weapons H2'],
          },
        };

        storedAsset = await assetRepository.create(asset);
      });

      it('returns an asset without user.id', () => {
        expect(storedAsset).to.deep.equal({
          ...asset,
          id: storedAsset.id,
          userId: storedAsset.userId || null,
          tokenId: storedAsset.tokenId || null,
          state: storedAsset.state,
        });
      });
    });
  });

  describe('#findByCollectionIdAndTokenId', () => {
    let asset: Asset;

    beforeEach(async () => {
      asset = {
        type: 'Mech',
        externalId: '123',
        tokenId: 2,
        collectionId: collection.id,
        userId: user.id,
        attributes: {
          value: '12',
        },
      };

      await new AssetModel(asset).save();
    });

    it('can find an asset by collectionId and tokenId', async () => {
      const { id, ...storedAsset } = await assetRepository.findByCollectionIdAndTokenId(
        asset.collectionId,
        asset.tokenId
      );

      expect(storedAsset).to.be.eql({ ...asset, state: storedAsset.state });
    });

    it('throws if cannot find an asset', async () => {
      await expect(assetRepository.findByCollectionIdAndTokenId(asset.collectionId, asset.tokenId + 1)).rejectedWith(
        NotFoundError
      );
    });
  });

  describe('#updateWithTokenId', () => {
    describe('when there is an asset without tokenId', () => {
      let asset: Asset;

      beforeEach(async () => {
        asset = {
          type: 'Mech',
          externalId: '123',
          collectionId: collection.id,
          userId: user.id,
          attributes: {
            value: '12',
          },
        };

        await new AssetModel(asset).save();
      });

      it('updates an asset with tokenId', async () => {
        const tokenId = 12;
        const { id, ...storedAsset } = await assetRepository.setTokenId(asset.collectionId, user.id, tokenId);

        expect(storedAsset).to.be.eql({ ...asset, tokenId, state: storedAsset.state });
      });
    });

    describe('when there is no unassigned asset', () => {
      let asset: Asset;

      beforeEach(async () => {
        asset = {
          type: 'Mech',
          externalId: '123',
          tokenId: 2,
          collectionId: collection.id,
          userId: user.id,
          attributes: {
            value: '12',
          },
        };

        await new AssetModel(asset).save();
      });

      it('cannot find an asset to update', async () => {
        const tokenId = 12;
        await expect(assetRepository.setTokenId(asset.collectionId, user.id, tokenId)).rejectedWith(Error);
      });
    });
  });

  describe('#setUserId', () => {
    describe('when the asset has no user id', () => {
      let asset: Asset;

      beforeEach(async () => {
        asset = {
          type: 'Mech',
          externalId: '123',
          tokenId: 2,
          collectionId: collection.id,
          attributes: {
            value: '12',
          },
        };

        await new AssetModel(asset).save();
      });

      it('sets user id', async () => {
        const userId = user.id;

        const { id, ...storedAsset } = await assetRepository.setUserId(asset.collectionId, asset.tokenId, userId);

        expect(storedAsset).to.be.eql({ ...asset, userId, state: storedAsset.state });
      });
    });

    describe('when the asset already has a user id', () => {
      let asset: Asset;

      beforeEach(async () => {
        asset = {
          type: 'Mech',
          externalId: '123',
          tokenId: 2,
          collectionId: collection.id,
          userId: user.id,
          attributes: {
            value: '12',
          },
        };

        await new AssetModel(asset).save();
      });

      it('sets a new user id', async () => {
        const userId = user.id;

        const { id, ...storedAsset } = await assetRepository.setUserId(asset.collectionId, asset.tokenId, userId);

        expect(storedAsset).to.be.eql({ ...asset, userId, state: storedAsset.state });
      });
    });
  });

  describe('#updateAttributes', () => {
    let asset: Asset;
    let assetId: string;

    const attributes = {
      value: '12',
    };

    beforeEach(async () => {
      asset = {
        type: 'Mech',
        externalId: '123',
        tokenId: 2,
        collectionId: collection.id,
        state: AssetStateMap.minted,
        userId: user.id,
        attributes,
      };

      assetId = (await new AssetModel(asset).save()).id;
    });

    describe('when the asset does not exist', () => {
      it('throws an error', async () => {
        await expect(assetRepository.updateAttributes(asset.collectionId, attributes)).rejectedWith(NotFoundError);
      });
    });

    describe('when the attribute to be changed does NOT exist', () => {
      it('overrides the previous attributes with the new ones', async () => {
        const attributes = {
          newValue: '13',
        };

        const { id, ...updatedAsset } = await assetRepository.updateAttributes(assetId, attributes);

        expect(updatedAsset).to.deep.equal({ ...asset, attributes });
      });
    });

    describe('when the attribute to be changed exists', () => {
      it('overrides the previous attributes with the new ones', async () => {
        const attributes = {
          value: 'carlos',
        };

        const { id, ...updatedAsset } = await assetRepository.updateAttributes(assetId, attributes);

        expect(updatedAsset).to.deep.equal({ ...asset, attributes });
      });
    });

    describe('when the current attribute has the same value as the new attribute', () => {
      it('the value remains the same', async () => {
        const { id, ...updatedAsset } = await assetRepository.updateAttributes(assetId, attributes);

        expect(updatedAsset).to.deep.equal({ ...asset });
      });
    });
  });
});
