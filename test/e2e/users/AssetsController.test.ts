import Joi from 'joi';
import sinon from 'sinon';
import axios from 'axios';
import { expect } from 'chai';
import request from 'supertest';
import { cloneDeep } from 'lodash';
import { Container } from 'inversify';
import { Application } from 'express';
import { BigNumber, Contract, Wallet } from 'ethers';

import { setupUser, setupStudio, setupGame, setupAsset, setupCollection } from '../../controls/index';
import { expiredTicketAuth, invalidAuthTicket, nonExpiredTicketAuth } from '../../fixtures/playFabFixtures';
import { getTestContainer } from '../../helpers/getTestContainer';
import { testSchema } from '../../helpers/testSchema';

import { GamePortalContractFactory } from '../../../src/services/factories/GamePortalContractFactory';
import { SessionTicketAuthenticator } from '../../../src/services/playfab/SessionTicketAuthenticator';
import { ITicketAuthResponseSerialized } from '../../../src/types/playfab/PlayFabTypes';

import { GameDocument } from '../../../src/models/Game';
import { UserDocument } from '../../../src/models/User';

import { CollectionDocument } from '../../../src/models/Collection';
import { StudioDocument } from '../../../src/models/Studio';
import { AssetDocument } from '../../../src/models/Asset';

import Server from '../../../src/lib/Server';

function createAuthStub(user: UserDocument, container: Container) {
  const tokenVerifier = container.get(SessionTicketAuthenticator);

  const stub = sinon.stub(tokenVerifier, 'apply').resolves({
    isSessionTicketExpired: false,
    userInfo: { accountId: user.accountId },
  } as ITicketAuthResponseSerialized);

  container.rebind(SessionTicketAuthenticator).toConstantValue(stub as unknown as SessionTicketAuthenticator);
}

describe('AssetsController', () => {
  const DEPOSIT_ROUTE = '/users/assets/deposit';
  const SHOW_USER_ASSETS_ROUTE = '/users/assets';
  const WITHDRAW_ROUTE = '/users/assets/withdraw';

  const container = getTestContainer();

  const mockGamePortalContract = {
    nonces: () => Promise.resolve(BigNumber.from(1)),
    signer: Wallet.createRandom(),
  };

  const mockGamePortalFactory = {
    call: () => Promise.resolve(mockGamePortalContract) as unknown as Promise<Contract>,
  } as unknown as GamePortalContractFactory;

  describe(`GET ${DEPOSIT_ROUTE}`, () => {
    let server: Application;

    async function deposit(assetId: string, chainId: number) {
      const { status, body } = await request(server).get(DEPOSIT_ROUTE).set('Authorization', 'Bearer validToken').send({
        data: {
          assetId,
          chainId,
        },
      });

      return { status, body };
    }

    afterEach(() => {
      sinon.restore();
    });

    describe('with invalid session ticket', () => {
      describe('when validator tells ticket is expired', () => {
        beforeEach(async () => {
          sinon.stub(axios, 'post').resolves({ status: 200, data: expiredTicketAuth });

          server = container.get(Server).app;
        });

        it('returns 401', async () => {
          const { status, body } = await deposit('assetId', 1);

          expect(status).to.equal(401);
          expect(body).to.deep.equal({ errors: [{ detail: 'Authorization Error' }] });
        });
      });

      describe('when validator tells ticket is invalid', () => {
        beforeEach(async () => {
          sinon.stub(axios, 'post').rejects({ response: { status: 400, data: invalidAuthTicket } });
        });

        it('returns 401', async () => {
          const { status, body } = await deposit('assetId', 1);

          expect(status).to.equal(401);
          expect(body).to.deep.equal({ errors: [{ title: 'InvalidSessionTicket', detail: 'InvalidSessionTicket' }] });
        });
      });
    });

    describe('with a valid session ticket', () => {
      let game: GameDocument;
      let user: UserDocument;
      let collection: CollectionDocument;
      let asset: AssetDocument;

      beforeEach(async () => {
        const container = getTestContainer();

        game = await setupStudio().then(setupGame);
        user = await setupUser(game, { walletAddress: '0x9dc3f4bd75ba204430b86c1aa670493f3e31f44e' });
        collection = await setupCollection(game);
        asset = await setupAsset(user, collection, { tokenId: 1, attributes: {} });

        createAuthStub(user, container);

        container.bind(GamePortalContractFactory).toConstantValue(mockGamePortalFactory);

        server = container.get(Server).app;
      });

      describe('when the asset exists', () => {
        it('returns a signature', async () => {
          const { status, body } = await deposit(asset.id, 1);

          const schema = Joi.object({
            data: Joi.object({
              message: Joi.object({
                contractAddress: Joi.string().length(42),
                walletAddress: Joi.string().length(42),
                chainId: Joi.number().required(),
                tokenId: Joi.number().required(),
                nonce: Joi.number().required(),
                signatureType: Joi.string().required(),
              }),
              signature: Joi.string().length(132),
            }).required(),
          });

          expect(testSchema(body, schema)).to.eql(true);
          expect(status).to.equal(200);
        });
      });

      describe('when the asset does NOT exist', () => {
        it('returns an error', async () => {
          const { status, body } = await deposit(asset.collectionId, 1);

          expect(body).to.deep.equal({ errors: [{ title: 'NotFound', detail: 'Asset not found' }] });
          expect(status).to.equal(404);
        });
      });

      describe('when the assetId is not valid', () => {
        it('returns an error', async () => {
          const { status, body } = await deposit('123', 1);

          expect(body).to.deep.equal({ errors: [{ title: 'InvalidInput', detail: 'Invalid assetId' }] });
          expect(status).to.equal(400);
        });
      });

      describe('when the user does not have a walletAddress', () => {
        beforeEach(async () => {
          user = await setupUser(game);

          createAuthStub(user, container);

          server = container.get(Server).app;
        });

        it('returns an error', async () => {
          const { status, body } = await deposit(asset.id, 1);

          expect(body).to.deep.equal({ errors: [{ title: 'Conflict', detail: 'User has no linked wallet address' }] });
          expect(status).to.equal(409);
        });
      });
    });
  });

  describe(`GET ${SHOW_USER_ASSETS_ROUTE}`, () => {
    let user: UserDocument;
    let game: GameDocument;
    let collection: CollectionDocument;
    let studio: StudioDocument;

    const makeRoute = (gameId: string) => SHOW_USER_ASSETS_ROUTE + `/${gameId}`;

    const server = container.get(Server).app;

    beforeEach(async () => {
      studio = await setupStudio();
      game = await setupGame(studio);
      collection = await setupCollection(game);
      user = await setupUser(game);
    });

    describe('when the user is not authenticated', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server).get(makeRoute(game.id)).set('Authorization', '');
      });

      it('returns http Unauthorized response status', () => {
        expect(res.status).to.eql(401);
      });

      it('returns an error message', () => {
        expect(res.body).to.eql({ errors: [{ detail: 'Authorization Error' }] });
      });
    });

    describe('when the user is authenticated', () => {
      beforeEach(async () => {
        const clone = cloneDeep(nonExpiredTicketAuth);
        clone.data.UserInfo.PlayFabId = user.accountId;

        sinon.stub(axios, 'post').resolves({
          status: 200,
          data: clone,
        });
      });

      afterEach(() => {
        sinon.restore();
      });

      describe('and the provided game id is invalid', () => {
        let res: request.Response;
        const invalidGameId = 'invalid-key';

        beforeEach(async () => {
          res = await request(server).get(makeRoute(invalidGameId)).set('Authorization', `Bearer ${user.id}`);
        });

        it('returns http Bad Request response status', () => {
          expect(res.status).to.eql(400);
        });

        it('returns a failure object', () => {
          expect(res.body).to.eql({
            errors: [{ title: 'InvalidInput', detail: 'Invalid gameId' }],
          });
        });
      });

      describe('and the game does not exist', () => {
        let res: request.Response;

        beforeEach(async () => {
          const nonExistingGameId = '62e4237a76500684f248421f';
          res = await request(server).get(makeRoute(nonExistingGameId)).set('Authorization', `Bearer ${user.id}`);
        });

        it('returns http Not Found response status', () => {
          expect(res.status).to.eql(404);
        });

        it('returns a NotFound error', () => {
          expect(res.body).to.eql({
            errors: [{ title: 'NotFound', detail: 'Game not found' }],
          });
        });
      });

      describe('and the user do not have deposited assets', () => {
        let res: request.Response;

        beforeEach(async () => {
          res = await request(server).get(makeRoute(game.id)).set('Authorization', `Bearer ${user.id}`);
        });

        it('returns http OK response status', () => {
          expect(res.status).to.eql(200);
        });

        it('returns an empty array', () => {
          expect(res.body).eql({ data: [] });
        });
      });

      describe('and the user have deposited assets', () => {
        let res: request.Response;

        const mockAttributes = {
          rarity: 'Uncommon',
          combat_role: 'Scout',
          model_number: 'ZA-V1',
          model_name: 'Zephyr',
        };

        const validAsset = {
          type: 'Mech',
          externalId: '123',
          attributes: mockAttributes,
        };

        beforeEach(async () => {
          await setupAsset(user, collection, validAsset);

          res = await request(server).get(makeRoute(game.id)).set('Authorization', `Bearer ${user.id}`);
        });

        it('returns http OK response status', () => {
          expect(res.status).to.eql(200);
        });

        it('returns assets from the specified user', () => {
          expect(res.body).to.deep.equal({
            data: [
              { ...validAsset, id: res.body.data[0].id, collectionId: collection.id, userId: user.id, tokenId: null },
            ],
          });
        });
      });
    });
  });

  describe(`GET ${WITHDRAW_ROUTE}`, () => {
    let server: Application;

    async function withdraw(assetId: string, chainId: number) {
      const { status, body } = await request(server)
        .get(WITHDRAW_ROUTE)
        .set('Authorization', 'Bearer validToken')
        .send({
          data: {
            assetId,
            chainId,
          },
        });

      return { status, body };
    }

    describe('with a valid session ticket', () => {
      let game: GameDocument;
      let user: UserDocument;
      let collection: CollectionDocument;
      let asset: AssetDocument;

      beforeEach(async () => {
        const container = getTestContainer();

        game = await setupStudio().then(setupGame);
        user = await setupUser(game, { walletAddress: '0x9dc3f4bd75ba204430b86c1aa670493f3e31f44e' });
        collection = await setupCollection(game);
        asset = await setupAsset(user, collection, { tokenId: 1, attributes: {} });

        createAuthStub(user, container);

        container.bind(GamePortalContractFactory).toConstantValue(mockGamePortalFactory);

        server = container.get(Server).app;
      });

      describe('when the asset exists', () => {
        it('returns a signatures', async () => {
          const { status, body } = await withdraw(asset.id, 1);

          const schema = Joi.object({
            data: Joi.object({
              message: Joi.object({
                contractAddress: Joi.string().length(42),
                walletAddress: Joi.string().length(42),
                chainId: Joi.number().required(),
                tokenId: Joi.number().required(),
                nonce: Joi.number().required(),
                signatureType: Joi.string().required(),
              }),
              signature: Joi.string().length(132),
            }).required(),
          });

          expect(testSchema(body, schema)).to.eql(true);
          expect(status).to.equal(200);
        });
      });

      describe('when the asset does NOT exist', () => {
        it('returns an error', async () => {
          const { status, body } = await withdraw(asset.collectionId, 1);

          expect(body).to.deep.equal({ errors: [{ title: 'NotFound', detail: 'Asset not found' }] });
          expect(status).to.equal(404);
        });
      });

      describe('when the assetId is not valid', () => {
        it('returns an error', async () => {
          const { status, body } = await withdraw('123', 1);

          expect(body).to.deep.equal({ errors: [{ title: 'InvalidInput', detail: 'Invalid assetId' }] });
          expect(status).to.equal(400);
        });
      });

      describe('when the user does not have a walletAddress', () => {
        beforeEach(async () => {
          user = await setupUser(game);
          asset = await setupAsset(user, collection, { tokenId: 2, attributes: {} });

          createAuthStub(user, container);

          server = container.get(Server).app;
        });

        it('returns an error', async () => {
          const { status, body } = await withdraw(asset.id, 1);

          expect(body).to.deep.equal({ errors: [{ title: 'Conflict', detail: 'User has no linked wallet address' }] });
          expect(status).to.equal(409);
        });
      });

      describe('when the user does not own the asset', () => {
        let user2: UserDocument;

        beforeEach(async () => {
          user2 = await setupUser(game);

          createAuthStub(user2, container);

          server = container.get(Server).app;
        });

        it('returns an error', async () => {
          const { status, body } = await withdraw(asset.id, 1);

          expect(body).to.deep.equal({ errors: [{ title: 'Conflict', detail: 'User is not the owner of the asset' }] });
          expect(status).to.equal(409);
        });
      });
    });
  });
});
