import request from 'supertest';
import { expect } from 'chai';
import axios from 'axios';
import sinon from 'sinon';

import { getTestContainer } from '../../helpers/getTestContainer';
import Settings from '../../../src/types/Settings';
import Server from '../../../src/lib/Server';

import { setupGame, setupStudio, setupUser } from '../../controls';

import UserModel, { UserDocument } from '../../../src/models/User';
import { GameDocument } from '../../../src/models/Game';

import { invalidInputParams, getUserAccountInfoFixture } from '../../fixtures/playFabFixtures';

describe('UsersController', () => {
  const SHOW_ROUTE = '/server/games';
  const makeRoute = (gameid: string) => SHOW_ROUTE + `/${gameid}/users`;

  const container = getTestContainer();
  const server = container.get(Server).app;

  describe(`GET ${SHOW_ROUTE}/{gameId}/users`, () => {
    let game: GameDocument;
    let user: UserDocument;
    const walletAddress = '0x0000000000000000000000000000000000000000';

    beforeEach(async () => {
      game = await setupStudio().then(setupGame);
      user = await setupUser(game, { walletAddress });
    });

    describe('when the user is not authenticated', () => {
      let res: request.Response;

      beforeEach(async () => {
        res = await request(server).get(makeRoute(walletAddress));
      });

      it('returns http Unauthorized response status', () => {
        expect(res.status).to.eql(401);
      });

      it('returns an error message', () => {
        expect(res.body).to.eql({ errors: [{ title: 'Unauthorized', detail: 'Authorization Error' }] });
      });
    });

    describe('when the user is authenticated', () => {
      const settings = {
        serverAuthenticationKey: 'test',
      } as Settings;

      container.rebind('Settings').toConstantValue(settings);

      const server = container.get(Server).app;

      describe('and the gameId is invalid', () => {
        let res: request.Response;

        beforeEach(async () => {
          const invalidGameId = 'invalidGameId';

          res = await request(server)
            .get(makeRoute(invalidGameId))
            .set('Authorization', `Bearer ${settings.serverAuthenticationKey}`);
        });

        it('returns http BadRequest response status', () => {
          expect(res.status).to.eql(400);
        });

        it('returns an InvalidInput message', () => {
          expect(res.body).to.eql({ errors: [{ title: 'InvalidInput', detail: 'Invalid gameId' }] });
        });
      });

      describe('and no query params are provided', () => {
        let res: request.Response;

        beforeEach(async () => {
          res = await request(server)
            .get(makeRoute(game.id))
            .set('Authorization', `Bearer ${settings.serverAuthenticationKey}`);
        });

        it('returns http BadRequest response status', () => {
          expect(res.status).to.eql(400);
        });

        it('returns an BadRequest message', () => {
          expect(res.body).to.eql({ errors: [{ title: 'BadRequest', detail: 'Invalid query params' }] });
        });
      });

      describe(`and the game doesn't exist`, () => {
        let res: request.Response;

        beforeEach(async () => {
          const nonExistingGameId = '62e4237a76500684f248421f';

          res = await request(server)
            .get(makeRoute(nonExistingGameId))
            .query({ walletAddress })
            .set('Authorization', `Bearer ${settings.serverAuthenticationKey}`);
        });

        it('returns http NotFound response status', () => {
          expect(res.status).to.eql(404);
        });

        it('returns an NotFound message', () => {
          expect(res.body).to.eql({ errors: [{ title: 'NotFound', detail: 'Game not found' }] });
        });
      });

      describe('and the user does not have a walletAddress linked to his own account ', () => {
        let res: request.Response;

        beforeEach(async () => {
          const unlinkedWalletAddress = '0x0000000000000000000000000000000000000001';

          res = await request(server)
            .get(makeRoute(game.id))
            .set('Authorization', `Bearer ${settings.serverAuthenticationKey}`)
            .query({ walletAddress: unlinkedWalletAddress });
        });

        it('returns http OK response status', () => {
          expect(res.status).to.eql(200);
        });

        it('returns an empty array', () => {
          expect(res.body).to.eql({ data: [] });
        });
      });

      describe(`and walletAddress is linked to user's account but doesn't have displayname`, () => {
        let res: request.Response;

        beforeEach(async () => {
          sinon.stub(axios, 'post').rejects({ response: { status: 400, data: invalidInputParams } });

          const walletAddress = '0x0000000000000000000000000000000000000000';

          res = await request(server)
            .get(makeRoute(game.id))
            .set('Authorization', `Bearer ${settings.serverAuthenticationKey}`)
            .query({ walletAddress });
        });

        afterEach(() => {
          sinon.restore();
        });

        it('returns http OK response status', () => {
          expect(res.status).to.eql(200);
        });

        it('returns the user without the displayName', () => {
          expect(res.body).to.deep.eq({
            data: [
              {
                id: user.id,
                accountId: user.accountId,
                walletAddress: walletAddress,
                balances: { fab: '0', mgt: '0' },
              },
            ],
          });
        });
      });

      describe(`and walletAddress is linked to user's account and has displayname`, () => {
        let res: request.Response;

        beforeEach(async () => {
          sinon.stub(axios, 'post').resolves({ status: 200, data: getUserAccountInfoFixture });

          await UserModel.updateOne({ _id: user._id }, { $set: { walletAddress: walletAddress } });

          res = await request(server)
            .get(makeRoute(game.id))
            .set('Authorization', `Bearer ${settings.serverAuthenticationKey}`)
            .query({ walletAddress });
        });

        afterEach(() => {
          sinon.restore();
        });

        it('returns http OK response status', () => {
          expect(res.status).to.eql(200);
        });

        it('returns the user', () => {
          expect(res.body).to.deep.eq({
            data: [
              {
                id: user.id,
                displayName: 'CornFlower',
                accountId: user.accountId,
                walletAddress: walletAddress,
                balances: { fab: '0', mgt: '0' },
              },
            ],
          });
        });
      });
    });
  });
});
