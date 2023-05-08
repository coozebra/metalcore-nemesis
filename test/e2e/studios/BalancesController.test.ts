import { expect } from 'chai';
import request, { Response } from 'supertest';

import { BalanceIncrementor } from '../../../src/services/balance/BalanceIncrementor';
import { setupStudio, setupGame, setupUser } from '../../controls';
import { getTestContainer } from '../../helpers/getTestContainer';
import { GameDocument } from '../../../src/models/Game';
import { UserDocument } from '../../../src/models/User';
import Server from '../../../src/lib/Server';

describe('BalancesController', () => {
  const server = getTestContainer().get(Server).app;
  const balanceIncrementor = getTestContainer().get(BalanceIncrementor);

  const INCREMENT_ROUTE = '/studios/users/balances/increment';
  const DECREMENT_ROUTE = '/studios/users/balances/decrement';

  describe(`PATCH ${INCREMENT_ROUTE}`, () => {
    const req = (authKey: string, accountId?: string, key?: string) =>
      request(server)
        .patch(INCREMENT_ROUTE)
        .set('Authorization', `Bearer ${authKey}`)
        .send({
          data: {
            accountId: accountId || 'nonExistingID',
            key: key || 'fab',
            value: '1000000000000000000000',
          },
        });

    it('requires authorization', async () => {
      const res = await request(server).patch(INCREMENT_ROUTE).send({ data: 'string' });
      expect(res.status).to.equal(401);
    });

    describe('when authorized', () => {
      let game: GameDocument;

      beforeEach(async () => {
        game = await setupStudio().then(setupGame);
      });

      describe('and user does not exist', () => {
        let res: Response;

        beforeEach(async () => {
          res = await req(game.key);
        });

        it('returns error', async () => {
          expect(res.body).to.deep.equal({
            error: {
              detail: 'User not found',
            },
          });
        });

        it('returns bad request status', () => {
          expect(res.status).to.equal(400);
        });
      });

      describe('and the user exists', () => {
        let user: UserDocument;

        beforeEach(async () => {
          user = await setupUser(game);
        });

        describe('with valid balance update request', () => {
          it('returns the updated balance', async () => {
            const res = await req(game.key, user.accountId);

            expect(res.status).to.equal(200);
            expect(res.body.data.balances).to.deep.equal({
              fab: '1000000000000000000000',
              mgt: '0',
            });
          });

          it('adds to existing balance', async () => {
            await req(game.key, user.accountId);
            const res = await req(game.key, user.accountId);

            expect(res.status).to.equal(200);
            expect(res.body.data.balances).to.deep.equal({
              fab: '2000000000000000000000',
              mgt: '0',
            });
          });
        });

        describe('when currency is not accepted', () => {
          let res: Response;

          before(async () => {
            res = await req(game.key, user.accountId, 'invalid');
          });

          it('returns bad request status', () => {
            expect(res.status).to.equal(400);
          });

          it('returns error', async () => {
            expect(res.body).to.deep.equal({
              error: {
                detail: 'Invalid token symbol',
              },
            });
          });
        });
      });
    });
  });

  describe(`PATCH ${DECREMENT_ROUTE}`, () => {
    const req = (authKey: string, accountId?: string, key?: string) =>
      request(server)
        .patch(DECREMENT_ROUTE)
        .set('Authorization', `Bearer ${authKey}`)
        .send({
          data: {
            accountId: accountId || 'nonExistingID',
            key: key || 'fab',
            value: '1000000000000000000000',
          },
        });

    it('requires authorization', async () => {
      const res = await request(server).get(DECREMENT_ROUTE);
      expect(res.status).to.equal(401);
    });

    describe('when authorized', () => {
      let game: GameDocument;

      beforeEach(async () => {
        game = await setupStudio().then(setupGame);
      });

      describe('when user does not exist', () => {
        let res: Response;

        beforeEach(async () => {
          res = await req(game.key);
        });

        it('returns bad request status', () => {
          expect(res.status).to.equal(400);
        });

        it('returns error', async () => {
          expect(res.body).to.deep.equal({
            error: {
              detail: 'User not found',
            },
          });
        });
      });

      describe('when the user exists', () => {
        let user: UserDocument;

        beforeEach(async () => {
          user = await setupUser(game);
        });

        describe('with valid balance update request', () => {
          let res: Response;

          beforeEach(async () => {
            await balanceIncrementor.apply(user.accountId, 'fab', '1000000000000000000000');

            res = await req(game.key, user.accountId);
          });

          it('returns OK status', () => {
            expect(res.status).to.equal(200);
          });

          it('returns the updated balance', () => {
            expect(res.body).to.deep.equal({
              data: {
                userId: user.id,
                accountId: user.accountId,
                balances: { fab: '0', mgt: '0' },
              },
            });
          });
        });

        describe('when requesting to reduce more than the current balance', () => {
          let res: Response;

          before(async () => {
            res = await req(game.key, user.accountId);
          });

          it('returns bad request status', () => {
            expect(res.status).to.equal(400);
          });

          it('returns error', () => {
            expect(res.body).to.deep.equal({
              error: {
                detail: 'Subtraction overflow',
              },
            });
          });
        });

        describe('when currency is not accepted', () => {
          let res: Response;

          before(async () => {
            res = await req(game.key, user.accountId, 'invalid');
          });

          it('returns bad request status', () => {
            expect(res.status).to.equal(400);
          });

          it('returns error', async () => {
            expect(res.body).to.deep.equal({
              error: {
                detail: 'Invalid token symbol',
              },
            });
          });
        });
      });
    });
  });
});
