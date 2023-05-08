import { expect } from 'chai';

import { CollectionStorer } from '../../../src/services/CollectionStorer';
import { getTestContainer } from '../../helpers/getTestContainer';
import CollectionModel from '../../../src/models/Collection';
import { Collection } from '../../../src/types';
import { setupStudio, setupGame } from '../../controls';
import { GameDocument } from '../../../src/models/Game';

describe('CollectionStorer', () => {
  const collectionStorer = getTestContainer().get(CollectionStorer);

  let game: GameDocument;

  beforeEach(async () => {
    game = await setupStudio().then(setupGame);
  });

  describe('#apply', () => {
    let collection: Collection;

    beforeEach(() => {
      collection = {
        gameId: game.id,
        contractAddress: '0x' + '0'.repeat(40),
        name: 'Test Collection',
        type: 'erc-721',
      };
    });

    describe('when receiving valid collection reference', () => {
      let storedCollection: Collection;
      let initialCount: number;
      let finalCount: number;

      beforeEach(async () => {
        initialCount = await CollectionModel.countDocuments();

        storedCollection = await collectionStorer.apply(collection);
      });

      it('increments docs count', async () => {
        finalCount = await CollectionModel.countDocuments();
        expect(finalCount).to.be.greaterThan(initialCount);
      });

      it('returns a collection object', async () => {
        expect(storedCollection).to.deep.equal({ ...collection, id: storedCollection.id });
      });
    });
  });
});
