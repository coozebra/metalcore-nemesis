import { expect } from 'chai';
import request, { Response } from 'supertest';

import { getTestContainer } from '../../helpers/getTestContainer';
import settings from '../../../src/config/settings';
import { Game } from '../../../src/types';
import Server from '../../../src/lib/Server';
import { setupStudio } from '../../controls';

function makeGameInfo(studioId: string) {
  const fakeAddress = '0x' + '0'.repeat(40);

  const gameInfo: Game = {
    name: 'FunGame',
    studioId: studioId,
    chain: 'ethereum',
    contractAddress: fakeAddress,
    currencies: {
      fun: fakeAddress,
    },
  };

  return gameInfo;
}

describe('GamesController', () => {
  const server = getTestContainer().get(Server).app;

  describe('POST /studios/games', () => {
    const ROUTE = '/studios/games';

    const req = (gameInfo: Game) =>
      request(server).post(ROUTE).set('Authorization', `Bearer ${settings.authenticationKey}`).send({ data: gameInfo });

    it('requires authorization', async () => {
      const res = await request(server).patch(ROUTE).send({ data: 'string' });
      expect(res.status).to.equal(401);
    });

    describe('creating a new game', () => {
      describe('when studio exists', () => {
        let studioId: string;
        let gameInfo: Game;
        let res: Response;

        beforeEach(async () => {
          studioId = (await setupStudio()).id;
          gameInfo = makeGameInfo(studioId);
        });

        describe('with valid information', () => {
          beforeEach(async () => {
            res = await req(gameInfo);
          });

          it('generates a random key', () => {
            expect(res.body.data.key).to.have.lengthOf(64);
          });

          it('returns the created game', () => {
            res.body.data.id = '';
            res.body.data.key = '';

            const modifiedResponse = { ...res, body: { data: { ...res.body.data, id: '', key: '' } } };

            expect(modifiedResponse.status).to.equal(201);
            expect(modifiedResponse.body).to.deep.equal({
              data: {
                id: '',
                key: '',
                ...gameInfo,
              },
            });
          });
        });

        describe('with invalid game information', () => {
          it('returns an error', async () => {
            const res = await req({ ...gameInfo, name: '' });
            expect(res.status).to.equal(400);
            expect(res.body).to.deep.equal({ error: { details: 'Invalid or incomplete Game Info' } });
          });
        });
      });

      describe('when studio does not exist', () => {
        it('returns error', async () => {
          const nonExistingId = '627d4831e6e057c1cc459bc9';
          const res = await req(makeGameInfo(nonExistingId));

          expect(res.status).to.equal(400);
          expect(res.body).to.deep.equal({
            error: { details: 'Studio not found' },
          });
        });
      });
    });
  });
});
