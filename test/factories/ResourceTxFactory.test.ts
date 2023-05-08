import { expect } from 'chai';

import { setupStudio, setupGame, setupUser, setupCollection, setupResource } from '../controls';
import { ResourceTxFactory } from '../../src/services/factories/ResourceTxFactory';
import { CollectionDocument } from '../../src/models/Collection';
import { getTestContainer } from '../helpers/getTestContainer';
import { ResourceDocument } from '../../src/models/Resource';
import { GameDocument } from '../../src/models/Game';
import { UserDocument } from '../../src/models/User';

describe('ResourceTxFactory', () => {
  const factory = getTestContainer().get(ResourceTxFactory);

  let game: GameDocument;
  let user: UserDocument;
  let resource: ResourceDocument;
  let collection: CollectionDocument;

  describe('#call', () => {
    beforeEach(async () => {
      game = await setupStudio().then(setupGame);
      user = await setupUser(game);
      collection = await setupCollection(game);
      resource = await setupResource(collection);
    });

    describe('with valid transaction data', () => {
      it('returns an user object', async () => {
        const transaction = await factory.call(collection.id, user.id, game.id, { [resource.id]: 2 });

        expect(transaction).to.deep.equal({
          state: 'pending',
          type: 'MintResource',
          groupId: collection.id,
          metadata: {
            userId: user.id,
            collectionId: collection.id,
            gameId: game.id,
            balances: { [resource.id]: 2 },
          },
        });
      });
    });

    describe('with invalid transaction data', () => {
      describe('incorrect userId', () => {
        it('it throws an error', async () => {
          await expect(factory.call(collection.id, resource.id, game.id, { [resource.id]: 2 })).to.be.rejectedWith(
            'User not found'
          );
        });
      });

      describe('incorrect collectionId', () => {
        it('it throws an error', async () => {
          await expect(factory.call(user.id, user.id, game.id, { [resource.id]: 2 })).to.be.rejectedWith(
            'Collection not found'
          );
        });
      });

      describe('if ownership is refused', () => {
        it('it throws an error', async () => {
          await expect(factory.call(collection.id, user.id, user.id, { [resource.id]: 2 })).to.be.rejectedWith(
            'Collection ownership refused'
          );
        });
      });

      describe('incorrect resourceId', () => {
        it('it throws an error', async () => {
          await expect(factory.call(collection.id, user.id, game.id, { [game.id]: 2 })).to.be.rejectedWith(
            'Resource not found'
          );
        });
      });
    });
  });
});
