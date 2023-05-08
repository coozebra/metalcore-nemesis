import request from 'supertest';
import { expect } from 'chai';

import { setupCollection, setupGame, setupResource, setupStudio, setupUser } from '../../controls';
import { setupUserResource } from '../../controls/setupUserResource';
import { CollectionDocument } from '../../../src/models/Collection';
import { getTestContainer } from '../../helpers/getTestContainer';
import { ResourceDocument } from '../../../src/models/Resource';
import { GameDocument } from '../../../src/models/Game';
import { UserDocument } from '../../../src/models/User';
import Server from '../../../src/lib/Server';

describe('UserResourcesController', () => {
  const server = getTestContainer().get(Server).app;

  let game: GameDocument;
  let user: UserDocument;
  let resource: ResourceDocument;
  let collection: CollectionDocument;

  describe('POST /studios/users/resources/increment', () => {
    const ROUTE = '/studios/users/resources/increment';

    it('requires authorization', async () => {
      const res = await request(server).post(ROUTE).set('Authorization', '').send({ data: 'string' });

      expect(res.status).to.eql(401);
    });

    beforeEach(async () => {
      game = await setupStudio().then(setupGame);
      user = await setupUser(game);
      collection = await setupCollection(game);
      resource = await setupResource(collection);
    });

    describe('when userResource does not exist', () => {
      it('creates a new userResource', async () => {
        const res = await request(server)
          .post(ROUTE)
          .set('Authorization', `Bearer ${game.key}`)
          .send({ data: { userId: user.id, collectionId: collection.id, balances: { [resource.id]: 2 } } });

        expect(res.status).to.eql(200);
        expect(res.body).to.deep.eq({
          data: {
            userId: user.id,
            gameId: game.id,
            collectionId: collection.id,
            balances: { [resource.id]: 2 },
          },
        });
      });
    });

    describe('when userResource exists', () => {
      beforeEach(async () => {
        await setupUserResource(user, resource, collection, game);
      });

      describe('when the correct params are provided', () => {
        it('increments the userResource', async () => {
          const res = await request(server)
            .post(ROUTE)
            .set('Authorization', `Bearer ${game.key}`)
            .send({ data: { userId: user.id, collectionId: collection.id, balances: { [resource.id]: 2 } } });

          expect(res.status).to.eql(200);
          expect(res.body).to.deep.eq({
            data: {
              userId: user.id,
              gameId: game.id,
              collectionId: collection.id,
              balances: { [resource.id]: 4 },
            },
          });
        });
      });

      describe('when incorrect params are provided', () => {
        describe('with wrong userId', () => {
          it('throws an error', async () => {
            const res = await request(server)
              .post(ROUTE)
              .set('Authorization', `Bearer ${game.key}`)
              .send({ data: { userId: resource.id, collectionId: collection.id, balances: { [resource.id]: 2 } } });

            expect(res.status).to.eql(404);
            expect(res.body).to.deep.eq({ errors: [{ title: 'NotFound', detail: 'User not found' }] });
          });
        });

        describe('with wrong collectionId', () => {
          it('throws an error', async () => {
            const res = await request(server)
              .post(ROUTE)
              .set('Authorization', `Bearer ${game.key}`)
              .send({ data: { userId: user.id, collectionId: user.id, balances: { [resource.id]: 2 } } });

            expect(res.status).to.eql(404);
            expect(res.body).to.deep.eq({ errors: [{ title: 'NotFound', detail: 'Collection not found' }] });
          });
        });
      });
    });
  });
});
