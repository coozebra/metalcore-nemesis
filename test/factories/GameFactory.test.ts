import { expect } from 'chai';
import mongoose from 'mongoose';

import { GameFactory } from '../../src/services/factories/GameFactory';
import { getTestContainer } from '../helpers/getTestContainer';
import { Game } from '../../src/types';

describe('GameFactory', () => {
  const gameFactory = getTestContainer().get(GameFactory);

  const gameInfo: Game = {
    name: 'NiceGame',
    studioId: new mongoose.Types.ObjectId().toString(),
    chain: 'ethereum',
    contractAddress: '0x' + '0'.repeat(40),
    currencies: {
      nice1: '0x' + '0'.repeat(40),
      nice2: '0x' + '1'.repeat(40),
    },
  };

  function callFactory(gameInfo: Game) {
    return gameFactory.call(
      gameInfo.name,
      gameInfo.studioId,
      gameInfo.chain,
      gameInfo.contractAddress,
      gameInfo.currencies
    );
  }

  describe('with correct parameters', () => {
    it('returns a game object', () => {
      const game = callFactory(gameInfo);

      expect(game).to.deep.equal({
        name: gameInfo.name,
        studioId: gameInfo.studioId,
        contractAddress: gameInfo.contractAddress,
        chain: gameInfo.chain,
        currencies: gameInfo.currencies,
      });
    });
  });

  describe('with missing params', () => {
    const defaultErrorMsg = 'Invalid or incomplete Game Info';

    describe('missing name', () => {
      it('throws error', () => {
        const badGameInfo = { ...gameInfo, name: '' };

        expect(() => callFactory(badGameInfo)).to.throw(defaultErrorMsg);
      });
    });

    describe('missing studioId', () => {
      it('throws error', () => {
        const badGameInfo = { ...gameInfo, studioId: '' };

        expect(() => callFactory(badGameInfo)).to.throw(defaultErrorMsg);
      });
    });

    describe('missing chain name', () => {
      it('throws error', () => {
        const badGameInfo = { ...gameInfo, chain: '' };

        expect(() => callFactory(badGameInfo)).to.throw(defaultErrorMsg);
      });
    });

    describe('missing token address', () => {
      it('throws error', () => {
        const badGameInfo = { ...gameInfo, currencies: { token: '' } };

        expect(() => callFactory(badGameInfo)).to.throw('Invalid contract address');
      });
    });

    describe('missing contract address', () => {
      it('throws error', () => {
        const badGameInfo = { ...gameInfo, contractAddress: '' };

        expect(() => callFactory(badGameInfo)).to.throw('Invalid contract address');
      });
    });
  });
});
