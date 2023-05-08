import { expect } from 'chai';

import { AccessKeyRepository } from '../../../src/repositories/AccessKeyRepository';
import AccessKeyModel, { AccessKeyDocument } from '../../../src/models/AccessKey';
import { setupGame, setupStudio, setupUser } from '../../controls';
import { AccessKey } from '../../../src/types';
import { GameDocument } from '../../../src/models/Game';
import { UserDocument } from '../../../src/models/User';

describe('AccessKeyRepository', () => {
  const accessKeyRepository = new AccessKeyRepository();

  let game: GameDocument;
  let user: UserDocument;

  beforeEach(async () => {
    game = await setupStudio().then(setupGame);
    user = await setupUser(game);
  });

  describe('#findByGameId', () => {
    describe('when the access key does not exist', () => {
      it('returns an empty array', async () => {
        const accessKeys = await accessKeyRepository.findByGameId(game.id);

        expect(accessKeys).deep.equal([]);
      });
    });

    describe('when the access key exists', () => {
      const key = '1234-5FBC-KLJH-GZZT';
      let accessKeys: AccessKey[];

      beforeEach(async () => {
        await AccessKeyModel.create({ gameId: game.id, userId: user.id, key: key, active: true });
        accessKeys = await accessKeyRepository.findByGameId(game.id);
      });

      it('returns the access key', () => {
        expect(accessKeys).to.deep.equal([
          {
            id: accessKeys[0].id,
            gameId: game.id,
            userId: user.id,
            key: key,
            active: true,
          },
        ]);
      });
    });
  });

  describe('#findByGameIdAndUserId', () => {
    describe('when the access key is found by gameId and userId', () => {
      const key = '7MLJ-FBCK-LJHG-7KLA';

      let foundAccessKeys: AccessKey[];

      beforeEach(async () => {
        await AccessKeyModel.create({ key: key, gameId: game.id, userId: user.id });

        foundAccessKeys = await accessKeyRepository.findByGameIdAndUserId(game.id, user.id);
      });

      it('returns an access Key', () => {
        expect(foundAccessKeys).to.deep.equal([
          {
            id: foundAccessKeys[0].id,
            key: key,
            userId: user.id,
            gameId: game.id,
            active: false,
          },
        ]);
      });
    });

    describe('when the access key is not found by gameId and userId', () => {
      it('returns an empty array', async () => {
        const notFoundAccessKeys = await accessKeyRepository.findByGameIdAndUserId(game.id, user.id);

        expect(notFoundAccessKeys).to.deep.equal([]);
      });
    });
  });

  describe('#activateKeyById', () => {
    describe('when an accessKey exists and is not active', () => {
      const key = '12345FBCKLJHG';
      let accessKey: AccessKeyDocument;

      beforeEach(async () => {
        accessKey = await AccessKeyModel.create({ key: key, gameId: game.id, active: false });
      });

      it('assigns the accessKey to have an user and mark it as active', async () => {
        const updatedAccessKey = await accessKeyRepository.activateKeyById(accessKey.id, user.id);

        expect(updatedAccessKey).to.deep.equal({
          key: key,
          id: updatedAccessKey.id,
          active: true,
          gameId: game.id,
          userId: user.id,
        });
      });
    });

    describe('when accessKeys run out', () => {
      it('returns null', async () => {
        const accessKey = await accessKeyRepository.activateKeyById(game.id, user.id);

        expect(accessKey).to.equal(null);
      });
    });
  });

  describe('#getAvailableKeys', () => {
    describe('when there are available keys', () => {
      it('returns the available keys', async () => {
        const keys = ['HFKP-CUH5-JQF0-KDQO', 'HPXH-1BIL-CPN4-6APJ', '1ENC-MB92-1AOM-FM72'];

        await AccessKeyModel.create([
          { gameId: game.id, key: keys[0], active: true },
          { gameId: game.id, key: keys[1], active: false },
          { gameId: game.id, key: keys[2], active: false },
        ]);

        const nonClaimedKeys = await accessKeyRepository.getAvailableKeys(game.id, keys.length);

        expect(nonClaimedKeys.length).to.eql(2);
      });
    });

    describe("when there aren't available keys", () => {
      it('returns an empty array', async () => {
        const keys = ['HFKP-CUH5-JQF0-KDQO', 'HPXH-1BIL-CPN4-6APJ', '1ENC-MB92-1AOM-FM72'];

        await AccessKeyModel.create([
          { gameId: game.id, key: keys[0], active: true },
          { gameId: game.id, key: keys[1], active: true },
          { gameId: game.id, key: keys[2], active: true },
        ]);

        const nonClaimedKeys = await accessKeyRepository.getAvailableKeys(game.id);

        expect(nonClaimedKeys).to.eql([]);
      });
    });
  });
});
