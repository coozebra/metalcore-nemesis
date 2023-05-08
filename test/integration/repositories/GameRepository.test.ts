import { expect } from 'chai';
import mongoose from 'mongoose';

import { GameRepository } from '../../../src/repositories/GameRepository';
import { NotFoundError } from '../../../src/errors/application';

import GameModel from '../../../src/models/Game';
import { Game } from '../../../src/types';

import { StudioDocument } from '../../../src/models/Studio';
import { setupStudio } from '../../controls/setupStudio';

describe('GameRepository', () => {
  const repository = new GameRepository();

  let studio: StudioDocument;

  beforeEach(async () => {
    studio = await setupStudio();
  });

  const game: Game = {
    name: 'NiceGame',
    studioId: '',
    chain: 'ethereum',
    contractAddress: '0x' + '0'.repeat(40),
    currencies: {
      nice1: '0x' + '0'.repeat(40),
      nice2: '0x' + '1'.repeat(40),
    },
  };

  describe('#create', () => {
    describe('when receiving valid studio reference', () => {
      let storedGame: Game;
      let initialCount: number;
      let finalCount: number;

      beforeEach(async () => {
        game.studioId = studio.id;

        initialCount = await GameModel.countDocuments();
        storedGame = await repository.create(game);
      });

      it('increments docs count', async () => {
        finalCount = await GameModel.countDocuments();
        expect(finalCount).to.be.greaterThan(initialCount);
      });

      it('returns a game object', () => {
        expect(storedGame).to.deep.equal({
          ...game,
          id: storedGame.id,
          key: storedGame.key,
        });
      });
    });

    describe('when receiving an invalid studio reference', () => {
      it('throws error', async () => {
        const gameInfo = {
          ...game,
          studioId: new mongoose.Types.ObjectId().toString(),
        };

        await expect(repository.create(gameInfo)).to.be.rejectedWith(/Studio not found/);
      });
    });
  });

  describe('#findByContractAddress', () => {
    let game: Game;
    const gpAddress = '0x165ae5775fa193997fEBb56fD812333e203C03b7';

    beforeEach(async () => {
      game = {
        key: 'NiceGameKey',
        name: 'NiceGame',
        studioId: studio.id,
        chain: 'ethereum',
        contractAddress: gpAddress,
        currencies: {
          nice1: '0x' + '0'.repeat(40),
          nice2: '0x' + '1'.repeat(40),
        },
      };

      await new GameModel(game).save();
    });

    it('can find an asset by contract address', async () => {
      const { id, ...storedGame } = await repository.findByContractAddress(gpAddress);

      expect(storedGame).to.be.eql(game);
    });

    it('fails if can not find a contract address', async () => {
      const zeroAddress = '0x' + '0'.repeat(40);

      await expect(repository.findByContractAddress(zeroAddress)).rejectedWith(NotFoundError);
    });
  });

  describe('#findById', () => {
    describe('when game exists', () => {
      it('finds a game by the gameId', async () => {
        const storedGame = await GameModel.create({ ...game, studioId: studio.id });

        const foundGame = await repository.findById(storedGame.id);

        expect(foundGame).to.deep.equal({ ...game, id: storedGame.id, key: storedGame.key, studioId: studio.id });
      });
    });

    describe('when game does not exist', () => {
      it('throws a NotFoundError', async () => {
        const nonExistingGameId = '5e9f3b5b9d1c9c0b8c0b9b97';

        await expect(repository.findById(nonExistingGameId)).rejectedWith(NotFoundError);
      });
    });
  });

  describe('#findByKey', () => {
    describe('when game exists', () => {
      it('finds a game by the gameKey', async () => {
        const storedGame = await GameModel.create({ ...game, studioId: studio.id });

        const foundGame = await repository.findByKey(storedGame.key);

        expect(foundGame).to.deep.eq({ ...game, id: storedGame.id, key: storedGame.key, studioId: studio.id });
      });
    });

    describe('when game does not exist', () => {
      it('throws a NotFoundError', async () => {
        const nonExistingGameKey = 'non-existing-game-key';

        await expect(repository.findByKey(nonExistingGameKey)).rejectedWith(NotFoundError);
      });
    });
  });
});
