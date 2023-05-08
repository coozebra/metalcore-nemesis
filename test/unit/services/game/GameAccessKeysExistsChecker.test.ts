import { expect } from 'chai';

import { GameAccessKeysExistsChecker } from '../../../../src/services/GameAccessKeysExistsChecker';
import { getTestContainer } from '../../../helpers/getTestContainer';
import AccessKeyModel from '../../../../src/models/AccessKey';
import { GameDocument } from '../../../../src/models/Game';
import { setupGame, setupStudio } from '../../../controls';

describe('GameAccessKeysExistsChecker', () => {
  const gameAccessKeysExistsChecker = getTestContainer().get(GameAccessKeysExistsChecker);

  let game: GameDocument;

  beforeEach(async () => {
    game = await setupStudio().then(setupGame);
  });

  describe('#apply', () => {
    describe('when no game key is not found', () => {
      it('returns false', async () => {
        const result = await gameAccessKeysExistsChecker.apply(game.id);

        expect(result).to.be.false;
      });
    });

    describe('when keys are found', () => {
      beforeEach(async () => {
        await AccessKeyModel.create({ gameId: game.id, key: '12345FBCKLJHG', active: true });
      });

      it('returns true', async () => {
        const result = await gameAccessKeysExistsChecker.apply(game.id);

        expect(result).to.be.true;
      });
    });
  });
});
