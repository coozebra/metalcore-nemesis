import { expect } from 'chai';

import { CollectionOwnershipVerifier } from '../../src/services/CollectionOwnershipVerifier';
import { setupGame, setupStudio, setupCollection } from '../controls';
import { CollectionDocument } from '../../src/models/Collection';
import { getTestContainer } from '../helpers/getTestContainer';
import { GameDocument } from '../../src/models/Game';

describe('CollectionOwnershipVerifier', () => {
  const verifier = getTestContainer().get(CollectionOwnershipVerifier);

  describe('#apply', () => {
    let game: GameDocument;

    beforeEach(async () => {
      game = await setupStudio().then(setupGame);
    });

    describe('when there are no collections', () => {
      it('throw error', async () => {
        await expect(verifier.apply('', game)).to.be.rejectedWith(/ownership refused/);
      });
    });

    let collection: CollectionDocument;

    describe('when there are collections', () => {
      beforeEach(async () => {
        collection = await setupCollection(game);
      });

      describe('when collection belongs to game', () => {
        it('returns void', async () => {
          await expect(verifier.apply(collection.id, game)).to.not.be.rejected;
        });
      });

      describe('when collection does not belong to game', () => {
        let game2: GameDocument;
        let collection2: CollectionDocument;

        beforeEach(async () => {
          game2 = await setupStudio().then(setupGame);
          collection2 = await setupCollection(game2);
        });

        it('throw error', async () => {
          await expect(verifier.apply(collection2.id, game)).to.be.rejectedWith(/ownership refused/);
        });
      });

      describe('when game has many collections', () => {
        beforeEach(async () => {
          await Promise.all([setupCollection(game), setupCollection(game)]);
        });

        it('returns void', async () => {
          const coll = await setupCollection(game);
          await expect(verifier.apply(coll.id, game)).to.not.be.rejected;
        });
      });
    });
  });
});
