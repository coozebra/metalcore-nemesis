import { expect } from 'chai';

import { UserFactory } from '../../src/services/factories/UserFactory';
import { getTestContainer } from '../helpers/getTestContainer';
import { StudioDocument } from '../../src/models/Studio';
import { setupStudio, setupGame } from '../controls';

describe('UserFactory', () => {
  const factory = getTestContainer().get(UserFactory);

  describe('#call', () => {
    describe('with valid user and game data', () => {
      let gameKey: string;
      let studio: StudioDocument;

      beforeEach(async () => {
        studio = await setupStudio();
        const game = await setupGame(studio);

        gameKey = game.key;
      });

      it('returns an user object', async () => {
        const user = await factory.call('abc123', gameKey);

        expect(user).to.deep.equal({
          accountId: 'abc123',
          balances: {
            fab: '0',
            mgt: '0',
          },
          studioId: studio.id,
          wallet: undefined,
          walletAddress: undefined,
        });
      });
    });

    describe('with invalid game data', () => {
      it('it throws an error', async () => {
        await expect(factory.call('abc123', '')).to.be.rejectedWith('Game not found');
      });
    });
  });
});
