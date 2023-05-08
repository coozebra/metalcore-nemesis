import sinon from 'sinon';
import axios from 'axios';
import Chance from 'chance';
import { expect } from 'chai';
import request from 'supertest';
import { cloneDeep } from 'lodash';
import { beforeEach } from 'mocha';
import { BigNumber, Wallet } from 'ethers';

import Server from '../../../src/lib/Server';
import UserModel from '../../../src/models/User';
import { GameDocument } from '../../../src/models/Game';
import { UserDocument } from '../../../src/models/User';
import AccessKeyModel from '../../../src/models/AccessKey';
import { StudioDocument } from '../../../src/models/Studio';
import { getTestContainer } from '../../helpers/getTestContainer';
import { nonExpiredTicketAuth } from '../../fixtures/playFabFixtures';
import { setupGame, setupStudio, setupUser, setupCollection } from '../../controls';
import { EthereumAssetContractFactory } from '../../../src/services/factories/EthereumAssetContractFactory';

describe('AccessKeyController', () => {
  let user: UserDocument;
  let user2: UserDocument;
  let game: GameDocument;
  let studio: StudioDocument;
  const makeRoute = (gameId: string) => `/users/access-keys/${gameId}`;
  const chance = new Chance();

  const mockedContract = {
    balanceOf: () => Promise.resolve(BigNumber.from(5)),
  };

  const mockedEthereumAssetContractFactory = {
    apply: () => mockedContract,
  };

  const container = getTestContainer();

  container
    .bind(EthereumAssetContractFactory)
    .toConstantValue(mockedEthereumAssetContractFactory as unknown as EthereumAssetContractFactory);

  const server = container.get(Server).app;

  beforeEach(async () => {
    studio = await setupStudio();
    game = await setupGame(studio);
    await setupCollection(game);
    user2 = await setupUser(game);

    user = await UserModel.create({
      accountId: chance.cf(),
      studioId: game.studioId,
      walletAddress: Wallet.createRandom().address,
      balances: { fab: '0', mgt: '0' },
    });
  });

  describe('GET /users/access-keys/:gameId ', () => {
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
            errors: [{ attribute: 'value', detail: '"value" must only contain hexadecimal characters' }],
          });
        });
      });

      describe('and there are no keys available for the game', () => {
        let res: request.Response;

        beforeEach(async () => {
          res = await request(server).get(makeRoute(game.id)).set('Authorization', `Bearer ${user.id}`);
        });

        it('returns http Not Found response status', () => {
          expect(res.status).to.eql(404);
        });

        it('returns a NotFound error', () => {
          expect(res.body).to.eql({
            errors: [{ title: 'NotFound', detail: 'There are no keys for this game' }],
          });
        });
      });

      describe('and the user already claimed a key', () => {
        let res: request.Response;
        const keys = ['HFKP-CUH5-JQF0-KDQO', 'HPXH-1BIL-CPN4-6APJ', '1ENC-MB92-1AOM-FM72'];

        beforeEach(async () => {
          await Promise.all(keys.map((key) => AccessKeyModel.create({ key, gameId: game.id, userId: user.id })));

          res = await request(server).get(makeRoute(game.id)).set('Authorization', `Bearer ${user.id}`);
        });

        it('returns http OK response status', () => {
          expect(res.status).to.eql(200);
        });

        it('returns the response body data containing keys', () => {
          expect(res.body.data).to.have.deep.members(keys.map((key) => ({ key: key })));
        });

        it('returns three claimed keys', () => {
          expect(res.body.data).to.have.lengthOf(3);
        });
      });

      describe('and the user did not claim a key yet', () => {
        let res: request.Response;
        const key = 'LUYU-I9NT-QOTU-8G7R';

        beforeEach(async () => {
          await AccessKeyModel.create({
            gameId: game.id,
            userId: user2.id,
            key: key,
            active: false,
          });

          res = await request(server).get(makeRoute(game.id)).set('Authorization', `Bearer ${user.id}`);
        });

        it('returns http Not Found response status', () => {
          expect(res.status).to.eql(404);
        });

        it('returns a NotFound error', () => {
          expect(res.body).to.eql({
            errors: [{ title: 'NotFound', detail: 'There is no activated access key for this game' }],
          });
        });
      });
    });
  });

  describe('PATCH /users/access-keys/ ', () => {
    const ROUTE = '/users/access-keys/';

    describe('when the user is not authenticated', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server)
          .patch(ROUTE)
          .set('Authorization', '')
          .send({ data: { gameId: game.id } });
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
          res = await request(server)
            .patch(ROUTE)
            .set('Authorization', `Bearer ${user.id}`)
            .send({ data: { gameId: invalidGameId } });
        });

        it('returns http Bad Request response status', () => {
          expect(res.status).to.eql(400);
        });

        it('returns a failure object', () => {
          expect(res.body).to.eql({
            errors: [{ attribute: 'value', detail: '"value" must only contain hexadecimal characters' }],
          });
        });
      });

      describe('and there are no keys available for the game', () => {
        let res: request.Response;

        beforeEach(async () => {
          res = await request(server)
            .patch(ROUTE)
            .set('Authorization', `Bearer ${user.id}`)
            .send({ data: { gameId: game.id } });
        });

        it('returns http Not Found response status', () => {
          expect(res.status).to.eql(404);
        });

        it('returns a NotFound error', () => {
          expect(res.body).to.eql({
            errors: [{ title: 'NotFound', detail: 'There are no keys for this game' }],
          });
        });
      });

      describe('and the user has already claimed the key', () => {
        let res: request.Response;
        const key = 'LUYU-I9NT-QOTU-8G7R';

        beforeEach(async () => {
          await AccessKeyModel.create({
            gameId: game.id,
            userId: user.id,
            key: key,
            active: true,
          });

          res = await request(server)
            .patch(ROUTE)
            .set('Authorization', `Bearer ${user.id}`)
            .send({ data: { gameId: game.id } });
        });

        it('returns http Bad Request response status', () => {
          expect(res.status).to.eql(400);
        });

        it('returns a BadRequest error', () => {
          expect(res.body).to.eql({
            errors: [{ title: 'KeyAlreadyClaimed', detail: 'Key already claimed by user' }],
          });
        });
      });

      describe("and the user doesn't own an infantry", () => {
        let res: request.Response;
        const key = 'LUYU-I9NT-QOTU-8G7R';

        const mockedContract = {
          balanceOf: () => Promise.resolve(BigNumber.from(0)),
        };

        const mockedEthereumContractFactory = {
          apply: () => mockedContract,
        };

        beforeEach(async () => {
          await AccessKeyModel.create({
            gameId: game.id,
            key: key,
            active: false,
          });

          container
            .rebind(EthereumAssetContractFactory)
            .toConstantValue(mockedEthereumContractFactory as unknown as EthereumAssetContractFactory);

          const server = container.get(Server).app;

          res = await request(server)
            .patch(ROUTE)
            .set('Authorization', `Bearer ${user.id}`)
            .send({ data: { gameId: game.id } });
        });

        it('returns http Unauthorized response status', () => {
          expect(res.status).to.eql(401);
        });

        it('returns a Unauthorized error', () => {
          expect(res.body).to.eql({
            errors: [{ title: 'Unauthorized', detail: 'Claim qualifications not met' }],
          });
        });
      });

      describe('and the keys ran out', () => {
        let res: request.Response;
        const key = 'LUYU-I9NT-QOTU-8G7R';

        beforeEach(async () => {
          await AccessKeyModel.create({
            gameId: game.id,
            userId: user2.id,
            key: key,
            active: true,
          });

          res = await request(server)
            .patch(ROUTE)
            .set('Authorization', `Bearer ${user.id}`)
            .send({ data: { gameId: game.id } });
        });

        it('returns http Not Found response status', () => {
          expect(res.status).to.eql(404);
        });

        it('returns a NotFound error', () => {
          expect(res.body).to.eql({
            errors: [{ title: 'NotFound', detail: 'Ran out of AccessKeys' }],
          });
        });
      });

      describe('and the user claim a key available key', () => {
        let res: request.Response;
        const keys = ['AW8H-12CG-TBHY-K4QP', 'BCMP-BWG2-F9V7-YIUR', 'CPA1-0087-4E38-FZU9'];

        beforeEach(async () => {
          await Promise.all(keys.map((key) => AccessKeyModel.create({ key, gameId: game.id, active: false })));

          res = await request(server)
            .patch(ROUTE)
            .set('Authorization', `Bearer ${user.id}`)
            .send({ data: { gameId: game.id } });
        });

        it('returns http OK response status', () => {
          expect(res.status).to.eql(200);
        });

        it('returns the response body data containing the claimed keys', () => {
          expect(res.body.data).to.have.deep.members(keys.map((key) => ({ key: key })));
        });

        it('returns three claimed keys', () => {
          expect(res.body.data).to.have.lengthOf(3);
        });
      });
    });
  });
});
