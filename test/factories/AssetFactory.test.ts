import { expect } from 'chai';

import { setupStudio, setupGame, setupCollection, setupUser } from '../controls';
import { AssetFactory } from '../../src/services/factories/AssetFactory';
import { CollectionDocument } from '../../src/models/Collection';
import { getTestContainer } from '../helpers/getTestContainer';
import { GameDocument } from '../../src/models/Game';
import { UserDocument } from '../../src/models/User';
import { AssetStateMap } from '../../src/types';

describe('AssetFactory', () => {
  const assetFactory = getTestContainer().get(AssetFactory);

  let game: GameDocument;
  let user: UserDocument;
  let collection: CollectionDocument;

  beforeEach(async () => {
    game = await setupStudio().then(setupGame);
    collection = await setupCollection(game);
    user = await setupUser(game);
  });

  const makeAsset = (game: GameDocument, collectionId?: string) => ({
    type: 'foo',
    accountId: user.accountId,
    externalId: '123',
    collectionId: collectionId || collection.id,
    attributes: {
      fast: 'yes',
      strong: 'also',
    },
    game,
  });

  describe('#call', () => {
    describe('with valid game ownership', () => {
      it('returns an Asset', async () => {
        const asset = await assetFactory.call(makeAsset(game));

        expect(asset).to.deep.equal({
          type: 'foo',
          userId: user.id,
          externalId: '123',
          state: undefined,
          collectionId: collection.id,
          attributes: {
            fast: 'yes',
            strong: 'also',
          },
        });
      });

      describe('with extended type', () => {
        it('returns asset with state', async () => {
          const asset = await assetFactory.call({ ...makeAsset(game), state: AssetStateMap.minting });

          expect(asset).to.deep.equal({
            type: 'foo',
            userId: user.id,
            externalId: '123',
            state: 'minting',
            collectionId: collection.id,
            attributes: {
              fast: 'yes',
              strong: 'also',
            },
          });
        });
      });
    });

    describe('with other game ownership', () => {
      it('throws ownership error', async () => {
        const game2 = await setupStudio().then(setupGame);

        await expect(assetFactory.call(makeAsset(game2))).to.be.rejectedWith(/Collection ownership refused/);
      });
    });

    describe('with wrong collection id', () => {
      it('throws ownership error', async () => {
        await expect(assetFactory.call(makeAsset(game, '123456'))).to.be.rejectedWith(/Collection ownership refused/);
      });
    });
  });
});
