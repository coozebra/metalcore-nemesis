import { expect } from 'chai';
import { beforeEach } from 'mocha';
import request from 'supertest';
import Joi from 'joi';

import { setupStudio, setupGame, setupUser, setupAsset, setupCollection } from '../../controls';
import { CollectionDocument } from '../../../src/models/Collection';
import { getTestContainer } from '../../helpers/getTestContainer';
import { StudioDocument } from '../../../src/models/Studio';
import { AssetDocument } from '../../../src/models/Asset';
import { UserDocument } from '../../../src/models/User';
import { GameDocument } from '../../../src/models/Game';
import { testSchema } from '../../helpers/testSchema';
import { AssetStateMap } from '../../../src/types';
import Server from '../../../src/lib/Server';

describe('AssetsController', () => {
  let user: UserDocument;
  let game: GameDocument;
  let collection: CollectionDocument;
  let studio: StudioDocument;

  const server = getTestContainer().get(Server).app;

  const mockAttributes = {
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
  };

  const assetRequest = (accountId: string, collectionId: string) => {
    return {
      type: 'Mech',
      accountId: accountId,
      externalId: '123',
      collectionId: collectionId,
      attributes: mockAttributes,
    };
  };

  beforeEach(async () => {
    studio = await setupStudio();
    game = await setupGame(studio);
    collection = await setupCollection(game);
    user = await setupUser(game);
  });

  describe('POST /studios/assets', () => {
    it('requires authorization', async () => {
      const res = await request(server)
        .post('/studios/assets')
        .set('Authorization', '')
        .send({ data: assetRequest(user.accountId, collection.id) });

      expect(res.status).to.eql(401);
    });

    describe('when requester owns the game', () => {
      describe('and the correct params are provided', () => {
        let body: any;
        let status: number;

        beforeEach(async () => {
          ({ status, body } = await request(server)
            .post('/studios/assets')
            .set('Authorization', `Bearer ${game.key}`)
            .send({ data: assetRequest(user.accountId, collection.id) }));
        });

        it('returns http created response status', () => {
          expect(status).to.eql(201);
        });

        it('creates and returns the asset', () => {
          const validAsset = {
            type: 'Mech',
            externalId: '123',
            collectionId: collection.id,
            userId: user.id,
            attributes: mockAttributes,
          };

          expect(body).to.deep.equal({ data: { ...validAsset, state: 'minting' } });
        });

        it('validates the schema', () => {
          const schema = Joi.object({
            data: Joi.object({
              type: Joi.string().required(),
              userId: Joi.string().required(),
              state: Joi.string().required(),
              externalId: Joi.string().required(),
              collectionId: Joi.string().required(),
              attributes: Joi.object().required(),
            }).required(),
          });

          expect(testSchema(body, schema)).to.eql(true);
        });
      });

      describe('when the user does not exist', () => {
        let res: request.Response;

        beforeEach(async () => {
          res = await request(server)
            .post('/studios/assets')
            .set('Authorization', `Bearer ${game.key}`)
            .send({ data: assetRequest('123', collection.id) });
        });

        it('returns http not found response status', () => {
          expect(res.status).to.eql(404);
        });

        it('returns an error message', () => {
          expect(res.body).to.eql({ errors: [{ title: 'NotFound', detail: 'User not found' }] });
        });
      });
    });

    describe('when the requester does not own the game', () => {
      let res: request.Response;
      let game2: GameDocument;

      beforeEach(async () => {
        game2 = await setupStudio().then(setupGame);

        res = await request(server)
          .post('/studios/assets')
          .set('Authorization', `Bearer ${game2.key}`)
          .send({ data: assetRequest(user.accountId, collection.id) });
      });

      it('returns http unauthorized', () => {
        expect(res.status).to.eql(401);
      });

      it('returns an error response', () => {
        expect(res.body).to.eql({ errors: [{ title: 'Unauthorized', detail: 'Collection ownership refused' }] });
      });
    });
  });

  describe('GET /studios/assets', () => {
    let asset: AssetDocument;

    const validAsset = {
      type: 'Mech',
      externalId: '123',
      attributes: mockAttributes,
    };

    beforeEach(async () => {
      asset = await setupAsset(user, collection);
      await setupUser(game).then((user2) => setupAsset(user2, collection));
    });

    it('requires authorization', async () => {
      const res = await request(server).post('/studios/assets').set('Authorization', '').send({ data: asset });

      expect(res.status).to.eql(401);
    });

    describe('when accountId is NOT provided', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server).get('/studios/assets').set('Authorization', `Bearer ${game.key}`);
      });

      it('returns http ok response status', () => {
        expect(res.status).to.eql(200);
      });

      it('returns the response body data with the size of all assets', () => {
        expect(res.body.data).to.have.lengthOf(2);
      });

      it('returns assets', () => {
        expect(res.body.data).to.deep.equal([
          {
            ...validAsset,
            id: res.body.data[0].id,
            collectionId: res.body.data[0].collectionId,
            userId: res.body.data[0].userId,
            tokenId: null,
          },
          {
            ...validAsset,
            id: res.body.data[1].id,
            collectionId: res.body.data[1].collectionId,
            userId: res.body.data[1].userId,
            tokenId: null,
          },
        ]);
      });
    });

    describe('when accountId is correctly provided', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server)
          .get('/studios/assets')
          .set('Authorization', `Bearer ${game.key}`)
          .query({ accountId: user.accountId });
      });

      it('returns http ok response status', () => {
        expect(res.status).to.eql(200);
      });

      it('returns the response body with a single data', () => {
        expect(res.body.data).to.have.lengthOf(1);
      });

      it('returns assets from the specified user', () => {
        expect(res.body.data[0]).to.deep.equal({
          ...validAsset,
          id: res.body.data[0].id,
          collectionId: res.body.data[0].collectionId,
          userId: res.body.data[0].userId,
          tokenId: null,
        });
      });
    });

    describe('when accountId does not exist', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server)
          .get('/studios/assets')
          .set('Authorization', `Bearer ${game.key}`)
          .query({ accountId: '234' });
      });

      it('returns http not found response status', () => {
        expect(res.status).to.eql(404);
      });

      it('returns an error response', () => {
        expect(res.body).to.eql({ errors: [{ title: 'NotFound', detail: 'User not found' }] });
      });
    });
  });

  describe('POST /studios/assets/burn', () => {
    let asset: AssetDocument;

    beforeEach(async () => {
      asset = await setupAsset(user, collection, { tokenId: 1 });
    });

    it('requires authorization', async () => {
      const res = await request(server)
        .post('/studios/assets/burn')
        .set('Authorization', '')
        .send({ data: { assetId: asset.id } });

      expect(res.status).to.eql(401);
    });

    describe('when assetId is correctly provided', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server)
          .post('/studios/assets/burn')
          .set('Authorization', `Bearer ${game.key}`)
          .send({ data: { assetId: asset.id } });
      });

      it('returns http ok response status', () => {
        expect(res.status).to.eql(200);
      });

      it('returns the asset that will be burned', () => {
        expect(res.body.data).to.deep.equal({
          id: asset.id,
          type: 'Mech',
          userId: user.id,
          externalId: '123',
          collectionId: collection.id,
          tokenId: 1,
          state: 'burning',
          attributes: mockAttributes,
        });
      });
    });

    describe('when assetId does not exist', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server)
          .post('/studios/assets/burn')
          .set('Authorization', `Bearer ${game.key}`)
          .send({ data: { assetId: user.id } });
      });

      it('returns http not found response status', () => {
        expect(res.status).to.eql(404);
      });

      it('returns an error response', () => {
        expect(res.body).to.eql({ errors: [{ detail: 'Asset not found', title: 'NotFound' }] });
      });
    });

    describe('when asset is not minted', () => {
      let res: request.Response;
      let asset2: AssetDocument;

      beforeEach(async () => {
        asset2 = await setupAsset(user, collection);

        res = await request(server)
          .post('/studios/assets/burn')
          .set('Authorization', `Bearer ${game.key}`)
          .send({ data: { assetId: asset2.id } });
      });

      it('returns http conflict response status', () => {
        expect(res.status).to.eql(409);
      });

      it('returns an error response', () => {
        expect(res.body).to.eql({ errors: [{ detail: 'Cannot burn the unminted asset', title: 'Conflict' }] });
      });
    });

    describe('when assetId is not an ObjectId', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server)
          .post('/studios/assets/burn')
          .set('Authorization', `Bearer ${game.key}`)
          .send({ data: { assetId: 'carlos' } });
      });

      it('returns http bad request response status', () => {
        expect(res.status).to.eql(400);
      });

      it('returns an error response', () => {
        expect(res.body).to.eql({
          errors: [{ attribute: 'value', detail: '"value" must only contain hexadecimal characters' }],
        });
      });
    });

    describe('when the body format is incorrect', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server)
          .post('/studios/assets/burn')
          .set('Authorization', `Bearer ${game.key}`)
          .send({ assetId: 'string' });
      });

      it('returns http bad request response status', () => {
        expect(res.status).to.eql(400);
      });

      it('returns an error response', () => {
        expect(res.body).to.eql({
          errors: [{ title: 'BadRequest', detail: 'Body format is incorrect' }],
        });
      });
    });
  });

  describe('PATCH /studios/assets/:assetId/attributes', () => {
    let asset: AssetDocument;

    const mockAttributes = {
      value: '12',
    };

    const newAttributes = {
      newValue: '13',
    };

    beforeEach(async () => {
      asset = await setupAsset(user, collection, {
        state: AssetStateMap.minted,
        attributes: mockAttributes,
        tokenId: 1,
      });
    });

    it('requires authorization', async () => {
      const res = await request(server)
        .patch(`/studios/assets/${asset.id}/attributes`)
        .set('Authorization', '')
        .send({ data: { attributes: newAttributes } });

      expect(res.status).to.eql(401);
    });

    describe('when assetId is correctly provided', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server)
          .patch(`/studios/assets/${asset.id}/attributes`)
          .set('Authorization', `Bearer ${game.key}`)
          .send({ data: { attributes: newAttributes } });
      });

      it('returns http ok response status', () => {
        expect(res.status).to.eql(200);
      });

      it('updates the attributes of the asset', () => {
        expect(res.body.data).to.deep.equal({
          id: asset.id,
          type: 'Mech',
          userId: user.id,
          externalId: '123',
          collectionId: collection.id,
          state: 'minted',
          tokenId: 1,
          attributes: newAttributes,
        });
      });
    });

    describe('when asset does not exist', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server)
          .patch(`/studios/assets/${game.id}/attributes`)
          .set('Authorization', `Bearer ${game.key}`)
          .send({ data: { attributes: { value: '13' } } });
      });

      it('returns http not found response status', () => {
        expect(res.status).to.eql(404);
      });

      it('returns an error response', () => {
        expect(res.body).to.eql({ errors: [{ detail: 'Asset not found', title: 'NotFound' }] });
      });
    });

    describe('when assetId is not an ObjectId', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server)
          .patch(`/studios/assets/carlos/attributes`)
          .set('Authorization', `Bearer ${game.key}`)
          .send({ data: { attributes: { value: '13' } } });
      });

      it('returns http bad request response status', () => {
        expect(res.status).to.eql(400);
      });

      it('returns an error response', () => {
        expect(res.body).to.eql({
          errors: [{ attribute: 'value', detail: '"value" must only contain hexadecimal characters' }],
        });
      });
    });

    describe('when the body format is incorrect', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server)
          .patch(`/studios/assets/${asset.id}/attributes`)
          .set('Authorization', `Bearer ${game.key}`)
          .send({ attributes: { value: '13' } });
      });

      it('returns http bad request response status', () => {
        expect(res.status).to.eql(400);
      });

      it('returns an error response', () => {
        expect(res.body).to.eql({
          errors: [{ title: 'BadRequest', detail: 'Body format is incorrect' }],
        });
      });
    });
  });
});
