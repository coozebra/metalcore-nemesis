import { expect } from 'chai';
import request, { Response } from 'supertest';

import { setupStudio, setupGame, setupCollection, setupResource } from '../../controls';
import { CollectionDocument } from '../../../src/models/Collection';
import { getTestContainer } from '../../helpers/getTestContainer';
import { GameDocument } from '../../../src/models/Game';
import Server from '../../../src/lib/Server';

describe('ResourcesController', () => {
  const ROUTE = '/studios/resources';

  let collection: CollectionDocument;
  let game: GameDocument;

  const server = getTestContainer().get(Server).app;

  const makeResourceRequest = (collectionId: string) => {
    return {
      collectionId,
      attributes: {
        name: 'Zephyr',
      },
    };
  };

  beforeEach(async () => {
    game = await setupStudio().then(setupGame);
    collection = await setupCollection(game);
  });

  describe('POST /', () => {
    it('requires authorization', async () => {
      const res = await request(server).post(ROUTE).set('Authorization', '').send({ data: {} });

      expect(res.status).to.eql(401);
    });

    describe('when requester owns the game', () => {
      describe('and the correct params are provided', () => {
        let res: Response;

        beforeEach(async () => {
          res = await request(server)
            .post(ROUTE)
            .set('Authorization', `Bearer ${game.key}`)
            .send({ data: makeResourceRequest(collection.id) });
        });

        it('returns created status', () => {
          expect(res.status).to.eql(201);
        });

        it('returns the created resource', () => {
          res.body.data.id = '';

          expect(res.body).to.deep.equal({
            data: {
              id: '',
              collectionId: collection.id,
              tokenId: null,
              attributes: {
                name: 'Zephyr',
              },
            },
          });
        });
      });

      describe('and collection id is wrong', () => {
        let res: Response;

        beforeEach(async () => {
          res = await request(server)
            .post(ROUTE)
            .set('Authorization', `Bearer ${game.key}`)
            .send({ data: makeResourceRequest(game.id) });
        });

        it('returns error status', () => {
          expect(res.status).to.eql(401);
        });

        it('returns the error response', () => {
          expect(res.body).to.deep.equal({
            errors: [
              {
                title: 'Unauthorized',
                detail: 'Collection ownership refused',
              },
            ],
          });
        });
      });
    });

    describe('when the requester does not own the game', () => {
      let res: Response;

      beforeEach(async () => {
        const game2 = await setupStudio().then(setupGame);

        res = await request(server)
          .post(ROUTE)
          .set('Authorization', `Bearer ${game2.key}`)
          .send({ data: makeResourceRequest(collection.id) });
      });

      it('returns error status', () => {
        expect(res.status).to.eql(401);
      });

      it('returns the error response', () => {
        expect(res.body).to.deep.equal({
          errors: [
            {
              title: 'Unauthorized',
              detail: 'Collection ownership refused',
            },
          ],
        });
      });
    });
  });

  describe('GET /', () => {
    beforeEach(async () => {
      await Promise.all([
        setupResource(collection),
        setupResource(collection),
        setupResource(collection),
        setupResource(collection),
      ]);
    });

    it('requires authorization', async () => {
      const res = await request(server).get(ROUTE).set('Authorization', '').send({ data: {} });

      expect(res.status).to.eql(401);
    });

    describe('when querying by collectionId', () => {
      describe('when collection exists', () => {
        let res: Response;

        beforeEach(async () => {
          res = await request(server).get(ROUTE).set('Authorization', `Bearer ${game.key}`).query({
            collectionId: collection.id,
          });
        });

        it('returns OK status', () => {
          expect(res.status).to.equal(200);
        });

        it('returns all resources of that collection', () => {
          expect(res.body.data).to.have.lengthOf(4);
        });
      });

      describe('when collection does not exist', () => {
        let res: Response;

        beforeEach(async () => {
          res = await request(server).get(ROUTE).set('Authorization', `Bearer ${game.key}`).query({
            collectionId: game.id,
          });
        });

        it('returns no content status', () => {
          expect(res.status).to.equal(204);
        });
      });
    });

    describe('when no collectionId is passed', () => {
      let res: Response;

      beforeEach(async () => {
        res = await request(server).get(ROUTE).set('Authorization', `Bearer ${game.key}`);
      });

      it('returns no content status', () => {
        expect(res.status).to.equal(204);
      });
    });
  });
});
