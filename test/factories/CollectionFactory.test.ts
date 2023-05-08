import { expect } from 'chai';

import { CollectionFactory } from '../../src/services/factories/CollectionFactory';
import { getTestContainer } from '../helpers/getTestContainer';
import { Collection } from '../../src/types';
import { setupStudio, setupGame } from '../controls';
import { GameDocument } from '../../src/models/Game';

describe('CollectionFactory', () => {
  const collectionFactory = getTestContainer().get(CollectionFactory);

  let game: GameDocument;

  beforeEach(async () => {
    game = await setupStudio().then(setupGame);
  });

  describe('#call', () => {
    const validAddress = '0x' + '0'.repeat(40);

    describe('when the params are valid', () => {
      let validCollection: Collection;

      beforeEach(() => {
        validCollection = {
          gameId: game.id,
          contractAddress: validAddress,
          name: 'New Collection',
          type: 'ERC-1155',
        };
      });

      it('returns a Collection', async () => {
        const collection = await collectionFactory.call(game.id, validAddress, 'New Collection', 'ERC-1155');

        expect(collection).to.deep.equal(validCollection);
      });
    });

    describe('when the params are invalid', () => {
      describe('when the gameId is invalid', () => {
        const invalidGameId = '628fa8f21ade4e52a32ef55d';

        it('throws an error', async () => {
          const collection = collectionFactory.call(invalidGameId, validAddress, 'New Collection', 'ERC-1155');

          await expect(collection).to.be.rejectedWith('Game not found');
        });
      });

      describe('when the contractAddress is invalid', () => {
        const invalidAddress = '0x' + '0'.repeat(39);

        it('throws an error', async () => {
          const collection = collectionFactory.call(game.id, invalidAddress, 'New Collection', 'ERC-1155');

          await expect(collection).to.be.rejectedWith('Invalid contract address');
        });
      });

      describe('when the type is neither erc-1155 nor erc-721', () => {
        it('throws an error', async () => {
          const collection = collectionFactory.call(game.id, validAddress, 'New Collection', 'random');

          await expect(collection).to.be.rejectedWith('Invalid collection type');
        });
      });
    });
  });
});
