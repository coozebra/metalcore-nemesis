import sinon from 'sinon';
import axios from 'axios';
import { expect } from 'chai';
import request from 'supertest';

import { setupGame, setupStudio, setupUser } from '../../controls';
import { getTestContainer } from '../../helpers/getTestContainer';
import { GameDocument } from '../../../src/models/Game';
import Server from '../../../src/lib/Server';
import { UserDocument } from '../../../src/models/User';

import { getUserAccountInfoFixture, invalidAuthTicket, invalidInputParams } from '../../fixtures/playFabFixtures';

describe('UsersController', () => {
  const server = getTestContainer().get(Server).app;

  describe('POST /studios/users', () => {
    let game: GameDocument;
    let user: UserDocument;

    beforeEach(async () => {
      game = await setupStudio().then(setupGame);
      user = await setupUser(game);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('requires authorization', async () => {
      const body = {
        data: {
          accountId: user.accountId,
        },
      };

      sinon.stub(axios, 'post').rejects({ response: { status: 400, data: invalidAuthTicket } });

      const res = await request(server).post('/studios/users').set('Authorization', '').send(body);

      expect(res.status).to.eql(401);
    });

    describe('to an existing game', () => {
      let game: GameDocument;

      beforeEach(async () => {
        game = await setupStudio().then(setupGame);
      });

      describe('when the correct params are provided', () => {
        beforeEach(() => {
          sinon.stub(axios, 'post').resolves({ status: 200, data: getUserAccountInfoFixture });
        });

        it('creates the user', async () => {
          const body = {
            data: {
              accountId: 'BLLLSN03L18D213R',
            },
          };

          const res = await request(server)
            .post('/studios/users')
            .set('Authorization', `Bearer ${game.key}`)
            .send(body);

          res.body.data.id = '';

          expect(res.status).to.eql(201);
          expect(res.body).to.deep.eq({
            data: {
              id: '',
              accountId: 'BLLLSN03L18D213R',
              studioId: game.studioId.toString(),
              balances: { fab: '0', mgt: '0' },
            },
          });
        });
      });

      describe('when the user is already created', () => {
        let user: UserDocument;

        beforeEach(async () => {
          sinon.stub(axios, 'post').resolves({ status: 200, data: getUserAccountInfoFixture });

          user = await setupUser(game);

          await user.save();
        });

        it('returns an error response', async () => {
          const res = await request(server)
            .post('/studios/users')
            .set('Authorization', `Bearer ${game.key}`)
            .send({
              data: {
                accountId: user.accountId,
              },
            });

          expect(res.status).to.eql(409);
          expect(res.body).to.eql({ errors: [{ title: 'Conflict', detail: 'User already exists' }] });
        });
      });

      describe('when the accountId is not valid', () => {
        beforeEach(async () => {
          sinon.stub(axios, 'post').rejects({ response: { status: 400, data: invalidInputParams } });
        });

        it('returns an error response', async () => {
          const res = await request(server)
            .post('/studios/users')
            .set('Authorization', `Bearer ${game.key}`)
            .send({
              data: {
                accountId: '123',
              },
            });

          expect(res.status).to.eql(400);
          expect(res.body).to.eql({ errors: [{ title: 'InvalidParams', detail: 'Invalid Params' }] });
        });
      });
    });
  });

  describe('GET /studios/users', () => {
    let game: GameDocument;
    let user: UserDocument;

    beforeEach(async () => {
      game = await setupStudio().then(setupGame);
      user = await setupUser(game);
    });

    it('requires authorization', async () => {
      const res = await request(server).get('/studios/users').set('Authorization', '').query({ accountId: '234' });

      expect(res.status).to.eql(401);
    });

    describe('when the accountId is provided', () => {
      it('returns the user', async () => {
        const res = await request(server)
          .get('/studios/users')
          .set('Authorization', `Bearer ${game.key}`)
          .query({ accountId: user.accountId });

        res.body.data.id = '';

        expect(res.status).to.eql(200);
        expect(res.body).to.deep.eq({
          data: {
            id: '',
            accountId: user.accountId,
            studioId: game.studioId.toString(),
            balances: { fab: '0', mgt: '0' },
          },
        });
      });
    });

    describe('when accountId does not exist', () => {
      it('returns an error response', async () => {
        const res = await request(server)
          .get('/studios/users')
          .set('Authorization', `Bearer ${game.key}`)
          .query({ accountId: 'SRBSRG85A13C389C' });

        expect(res.status).to.eql(404);
        expect(res.body).to.eql({ errors: [{ title: 'NotFound', detail: 'User not found' }] });
      });
    });
  });
});
