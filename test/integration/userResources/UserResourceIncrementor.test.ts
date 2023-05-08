import { expect } from 'chai';

import { UserResourceIncrementor } from '../../../src/services/userResource/UserResourceIncrementor';
import { setupCollection, setupGame, setupResource, setupStudio, setupUser } from '../../controls';
import { UserResourceRepository } from '../../../src/repositories/UserResourceRepository';
import { TransactionRepository } from '../../../src/repositories/TransactionRepository';
import { CollectionDocument } from '../../../src/models/Collection';
import { getTestContainer } from '../../helpers/getTestContainer';
import { UserResource } from '../../../src/types';
import UserResourceModel from '../../../src/models/UserResource';
import { ResourceDocument } from '../../../src/models/Resource';
import TransactionModel from '../../../src/models/Transaction';
import { UserDocument } from '../../../src/models/User';
import { GameDocument } from '../../../src/models/Game';

describe('UserResourceIncrementor', () => {
  const container = getTestContainer();
  const incrementor = container.get(UserResourceIncrementor);
  const repository = container.get(UserResourceRepository);

  let user: UserDocument;
  let game: GameDocument;
  let resource: ResourceDocument;
  let collection: CollectionDocument;

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
    describe('when quantity is greater than the increment', () => {
      let incrementedUserResource: UserResource;
      let userResourceInfo: UserResource;
      let txCount: number;

      beforeEach(async () => {
        txCount = await TransactionModel.countDocuments();

        userResourceInfo = makeUserResource(collection.id, user.id, game.id, resource.id);
        await repository.incrementBalance(userResourceInfo);

        incrementedUserResource = await incrementor.apply(
          collection.id,
          userResourceInfo.userId,
          userResourceInfo.gameId,
          userResourceInfo.balances
        );
      });

      it('returns the incremented userResource', async () => {
        expect(incrementedUserResource).to.deep.equal({
          balances: {
            [resource.id]: 4,
          },
          userId: userResourceInfo.userId,
          gameId: userResourceInfo.gameId,
          collectionId: userResourceInfo.collectionId,
        });
      });

      it('increments the userResource', () => {
        expect(incrementedUserResource.balances[resource.id]).to.be.greaterThan(userResourceInfo.balances[resource.id]);
      });

      it('creates a transaction', async () => {
        expect(await TransactionModel.countDocuments()).to.be.greaterThan(txCount);
      });
    });
  });

  describe('when the userResource does not exist', () => {
    describe('when quantity is greater than the increment', () => {
      let incrementedUserResource: UserResource;
      let userResourceInfo: UserResource;
      let txCount: number;

      beforeEach(async () => {
        txCount = await TransactionModel.countDocuments();

        userResourceInfo = makeUserResource(collection.id, user.id, game.id, resource.id);

        incrementedUserResource = await incrementor.apply(
          collection.id,
          userResourceInfo.userId,
          userResourceInfo.gameId,
          userResourceInfo.balances
        );
      });

      it('returns the incremented userResource', async () => {
        expect(incrementedUserResource).to.deep.equal({
          balances: {
            [resource.id]: 2,
          },
          userId: userResourceInfo.userId,
          gameId: userResourceInfo.gameId,
          collectionId: userResourceInfo.collectionId,
        });
      });

      it('increments the userResource', () => {
        expect(incrementedUserResource.balances[resource.id]).to.be.eql(userResourceInfo.balances[resource.id]);
      });

      it('creates a transaction', async () => {
        expect(await TransactionModel.countDocuments()).to.be.greaterThan(txCount);
      });
    });
  });

  describe('atomicity guarantee', () => {
    describe('when something fails', () => {
      it('does not store anything', async () => {
        const mockContainer = getTestContainer();

        mockContainer.bind(TransactionRepository).toConstantValue({
          create: () => {
            throw new Error();
          },
        } as unknown as TransactionRepository);

        const mockedIncrementor = mockContainer.get(UserResourceIncrementor);

        expect(
          await Promise.all([TransactionModel.countDocuments(), UserResourceModel.countDocuments()])
        ).to.deep.equal([0, 0]);
        try {
          await mockedIncrementor.apply(collection.id, user.id, game.id, { [resource.id]: 1 });
        } catch {
          expect(
            await Promise.all([TransactionModel.countDocuments(), UserResourceModel.countDocuments()])
          ).to.deep.equal([0, 0]);
        }
      });
    });
  });
});
