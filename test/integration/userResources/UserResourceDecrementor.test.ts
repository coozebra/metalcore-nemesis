import chai, { expect } from 'chai';
import 'reflect-metadata';
import chaiAsPromised from 'chai-as-promised';

import { UserResourceDecrementor } from '../../../src/services/userResource/UserResourceDecrementor';
import { setupCollection, setupGame, setupResource, setupStudio, setupUser } from '../../controls';
import { getTestContainer } from '../../helpers/getTestContainer';
import { UserDocument } from '../../../src/models/User';
import { UserResource } from '../../../src/types';
import { UserResourceRepository } from '../../../src/repositories/UserResourceRepository';
import { GameDocument } from '../../../src/models/Game';
import { ResourceDocument } from '../../../src/models/Resource';
import { CollectionDocument } from '../../../src/models/Collection';

chai.use(chaiAsPromised);

describe('UserResourceDecrementor', () => {
  const decrementor = getTestContainer().get(UserResourceDecrementor);
  const repository = getTestContainer().get(UserResourceRepository);

  let user: UserDocument;
  let game: GameDocument;
  let resource: ResourceDocument;
  let collection: CollectionDocument;
  let userResourceObject: UserResource;

  const makeUserResource = (collectionId: string, userId: string, gameId: string, resourceId: number): UserResource => {
    return {
      collectionId: collectionId,
      userId: userId,
      gameId: gameId,
      balances: { [resourceId]: 2 },
    };
  };

  beforeEach(async () => {
    game = await setupStudio().then(setupGame);
    collection = await setupCollection(game);
    resource = await setupResource(collection);
    user = await setupUser(game);
  });

  describe('when the userResource exists', () => {
    describe('when quantity is greater than the decrement', () => {
      let userResource: UserResource;

      beforeEach(async () => {
        userResourceObject = makeUserResource(collection.id, user.id, game.id, resource.id);
        await repository.incrementBalance(userResourceObject);

        userResource = await decrementor.apply(resource.id, userResourceObject.userId, userResourceObject.gameId, 2);
      });

      it('returns the decremented userResource', async () => {
        expect(userResource).to.deep.equal({
          balances: {
            [resource.id]: 0,
          },
          userId: userResourceObject.userId,
          gameId: userResourceObject.gameId,
          collectionId: userResourceObject.collectionId,
        });
      });

      it('decrements the userResource', () => {
        expect(userResource.balances[resource.id]).to.be.lessThan(userResourceObject.balances[resource.id]);
      });
    });

    describe('when quantity is lower than the decrement', () => {
      beforeEach(async () => {
        user = await setupStudio().then(setupGame).then(setupUser);
        userResourceObject = makeUserResource(collection.id, user.id, game.id, resource.id);
        await repository.incrementBalance(userResourceObject);
      });

      it('throws error', async () => {
        const promise = decrementor.apply(resource.id, userResourceObject.userId, userResourceObject.gameId, 3);

        await expect(promise).to.be.rejectedWith('Subtraction overflow');
      });
    });
  });

  describe('when the userResource does not exist', () => {
    it('throws an error', async () => {
      const promise = decrementor.apply(resource.id, user.id, game.id, 1);

      await expect(promise).to.be.rejectedWith('Subtraction overflow');
    });
  });
});
