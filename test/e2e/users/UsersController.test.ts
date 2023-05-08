import Joi from 'joi';
import axios from 'axios';
import sinon from 'sinon';
import { expect } from 'chai';
import { cloneDeep } from 'lodash';
import request, { Response } from 'supertest';

import Server from '../../../src/lib/Server';
import { GameDocument } from '../../../src/models/Game';
import { testSchema } from '../../helpers/testSchema';
import { getTestContainer } from '../../helpers/getTestContainer';
import { setupGame, setupStudio, setupUser } from '../../controls';
import { UserDocument } from '../../../src/models/User';
import { DisplayNameFetcher } from '../../../src/services/playfab/DisplayNameFetcher';

import {
  userCreatedFixture,
  emailAlreadyExistsFixture,
  userNotFoundFixture,
  nonExpiredTicketAuth,
  loginFixture,
} from '../../fixtures/playFabFixtures';

interface RegisterData {
  email?: string;
  password?: string;
  displayName?: string;
}

describe('UsersController', () => {
  const LOGIN_ROUTE = '/users/login';
  const REGISTER_ROUTE = '/users/register';
  const SHOW_ROUTE = '/users';

  const container = getTestContainer();
  const server = container.get(Server).app;

  describe(`GET ${SHOW_ROUTE}`, () => {
    let game: GameDocument;
    let user: UserDocument;

    beforeEach(async () => {
      game = await setupStudio().then(setupGame);
      user = await setupUser(game);
    });

    describe('when user is not authenticated', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server).get(SHOW_ROUTE).set('Authorization', '');
      });

      it('returns http Unauthorized response status', () => {
        expect(res.status).to.eql(401);
      });

      it('returns an error message', () => {
        expect(res.body).to.eql({ errors: [{ detail: 'Authorization Error' }] });
      });
    });

    describe('when user is authenticated', () => {
      let res: request.Response;

      const mockedDisplayName = 'CornFlower';

      const mockedDisplayNameFetcher = {
        apply: () => mockedDisplayName,
      };

      beforeEach(async () => {
        const clone = cloneDeep(nonExpiredTicketAuth);
        clone.data.UserInfo.PlayFabId = user.accountId;

        sinon.stub(axios, 'post').resolves({
          status: 200,
          data: clone,
        });

        container.rebind(DisplayNameFetcher).toConstantValue(mockedDisplayNameFetcher as unknown as DisplayNameFetcher);

        const server = container.get(Server).app;

        res = await request(server).get(SHOW_ROUTE).set('Authorization', `Bearer ${user.id}`);
      });

      afterEach(() => {
        sinon.restore();
      });

      it('returns http OK response status', () => {
        expect(res.status).to.eql(200);
      });

      it('returns the user', () => {
        expect(res.body).to.deep.eq({
          data: {
            id: res.body.data.id,
            displayName: 'CornFlower',
            accountId: user.accountId,
            balances: { fab: '0', mgt: '0' },
          },
        });
      });
    });
  });

  describe(`POST ${LOGIN_ROUTE}`, () => {
    let game: GameDocument;

    beforeEach(async () => {
      game = await setupStudio().then(setupGame);
      await setupUser(game, { accountId: loginFixture.data.PlayFabId });
    });

    afterEach(() => {
      sinon.restore();
    });

    describe('EMAIL login', () => {
      describe('when the correct params are provided', () => {
        let res: Response;

        beforeEach(async () => {
          sinon.stub(axios, 'post').resolves({ status: 200, data: loginFixture });

          res = await request(server)
            .post(LOGIN_ROUTE)
            .send({
              data: {
                email: 'carlos@gmail.com',
                password: 'password',
              },
            });
        });

        it('returns OK status', async () => {
          expect(res.status).to.eql(200);
        });

        it('returns proper response body', () => {
          const schema = Joi.object({
            id: Joi.string().length(24),
            accountId: Joi.string().length(16),
            sessionTicket: Joi.string().length(101),
            jwt: Joi.string().length(313),
          });

          expect(testSchema(res.body.data, schema)).to.equal(true);
        });
      });

      describe('when the account does not exist', () => {
        let res: Response;

        beforeEach(async () => {
          sinon.stub(axios, 'post').rejects({ response: { status: 401, data: userNotFoundFixture } });

          res = await request(server)
            .post(LOGIN_ROUTE)
            .send({
              data: {
                email: 'email@provider.com',
                password: 'password',
              },
            });
        });

        it('returns unauthorized status', () => {
          expect(res.status).to.eql(401);
        });

        it('returns error response', async () => {
          expect(res.body).to.deep.equal({
            errors: [{ title: 'AccountNotFound', detail: 'User not found' }],
          });
        });
      });
    });

    describe('USERNAME login', () => {
      describe('when the correct params are provided', () => {
        let res: Response;

        beforeEach(async () => {
          sinon.stub(axios, 'post').resolves({ status: 200, data: loginFixture });

          res = await request(server)
            .post(LOGIN_ROUTE)
            .send({
              data: {
                username: 'username',
                password: 'password',
              },
            });
        });

        it('returns OK status', async () => {
          expect(res.status).to.eql(200);
        });

        it('returns proper response body, without a jwt', async () => {
          const schema = Joi.object({
            id: Joi.string().length(24),
            accountId: Joi.string().length(16),
            sessionTicket: Joi.string().length(101),
            jwt: '',
          });

          expect(testSchema(res.body.data, schema)).to.equal(true);
        });
      });

      describe('when the account does not exist', () => {
        let res: Response;

        beforeEach(async () => {
          sinon.stub(axios, 'post').rejects({ response: { status: 401, data: userNotFoundFixture } });

          res = await request(server)
            .post(LOGIN_ROUTE)
            .send({
              data: {
                username: 'username',
                password: 'password',
              },
            });
        });

        it('returns unauthorized status', () => {
          expect(res.status).to.eql(401);
        });

        it('returns an error', async () => {
          expect(res.body).to.eql({
            errors: [{ title: 'AccountNotFound', detail: 'User not found' }],
          });
        });
      });
    });

    describe('when username and email are not provided', () => {
      const body = {
        data: {
          password: 'password',
        },
      };

      it('returns an error', async () => {
        const res = await request(server).post(LOGIN_ROUTE).send(body);

        expect(res.status).to.eql(400);
        expect(res.body).to.eql({
          errors: [{ attribute: 'value', detail: '"value" must contain at least one of [email, username]' }],
        });
      });
    });
  });

  describe(`POST ${REGISTER_ROUTE}`, () => {
    const createUserInfo = {
      data: {
        email: 'email@provider.com',
        password: 's0m3#asH',
        displayName: 'TheBestPlayer',
      },
    };

    beforeEach(async () => {
      await setupStudio().then((studio) => setupGame(studio, { name: 'MetalCore' }));
    });

    describe('creating a new account', () => {
      beforeEach(async () => {
        sinon.stub(axios, 'post').resolves({ status: 200, data: userCreatedFixture });
      });

      afterEach(() => {
        sinon.restore();
      });

      it('returns CREATED status', async () => {
        const res = await request(server).post(REGISTER_ROUTE).send(createUserInfo);

        expect(res.status).to.eql(201);
      });

      it('returns the created account', async () => {
        const { body } = await request(server).post(REGISTER_ROUTE).send(createUserInfo);

        body.data.id = '';
        body.data.studioId = '';

        expect(body).to.deep.equal({
          data: {
            id: '',
            studioId: '',
            accountId: 'XXXXXXXXXXXXXXXX',
            balances: {
              fab: '0',
              mgt: '0',
            },
            sessionTicket:
              'XXXXXXXXXXXXXXXX--XXXXXXXXXXXXXXXX-XXXXX-XXXXXXXXXXXXXXX-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX=',
          },
        });
      });
    });

    describe('when email already exists', () => {
      beforeEach(async () => {
        sinon.stub(axios, 'post').rejects({ response: { status: 400, data: emailAlreadyExistsFixture } });
      });

      afterEach(() => {
        sinon.restore();
      });

      const createUserInfo = {
        email: 'x@y.com',
        password: 's0m3#asH',
        displayName: 'TheBestPlayer',
      };

      it('returns BadRequest status', async () => {
        const res = await request(server).post(REGISTER_ROUTE).send({ data: createUserInfo });

        expect(res.status).to.eql(400);
      });

      it('returns the error response', async () => {
        const res = await request(server).post(REGISTER_ROUTE).send({ data: createUserInfo });

        expect(res.body).to.eql({
          errors: [
            {
              title: 'EmailAddressNotAvailable',
              detail: 'Email address not available',
            },
          ],
        });
      });
    });

    describe('validating request', () => {
      function sendRequest(data: RegisterData) {
        return request(server)
          .post(REGISTER_ROUTE)
          .send({
            data: {
              email: data.email || 'x@y.com',
              password: data.password || 's0m3#asH',
              displayName: data.displayName || 'TheBestPlayer',
            },
          });
      }

      it('validates email', async () => {
        const { status, body } = await sendRequest({ email: 'notAnEmail' });

        expect(status).to.equal(400);
        expect(body).to.deep.equal({
          errors: [
            {
              attribute: 'email',
              detail: '"email" must be a valid email',
            },
          ],
        });
      });

      it('validates password', async () => {
        const { status, body } = await sendRequest({ password: 'short' });

        expect(status).to.equal(400);
        expect(body).to.deep.equal({
          errors: [
            {
              attribute: 'password',
              detail: '"password" length must be at least 8 characters long',
            },
          ],
        });
      });

      it('validates displayName', async () => {
        const { status, body } = await sendRequest({ displayName: 'wu' });

        expect(status).to.equal(400);
        expect(body).to.deep.equal({
          errors: [
            {
              attribute: 'displayName',
              detail: '"displayName" length must be at least 3 characters long',
            },
          ],
        });
      });

      it('returns many errors', async () => {
        const { status, body } = await request(server).post(REGISTER_ROUTE).send({ data: {} });

        expect(status).to.equal(400);
        expect(body).to.deep.equal({
          errors: [
            {
              attribute: 'email',
              detail: '"email" is required',
            },
            {
              attribute: 'displayName',
              detail: '"displayName" is required',
            },
            {
              attribute: 'password',
              detail: '"password" is required',
            },
          ],
        });
      });
    });
  });
});
