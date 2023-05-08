import Chance from 'chance';
import { randomBytes } from 'crypto';

import { StudioDocument } from '../../src/models/Studio';
import Game, { GameDocument } from '../../src/models/Game';

export async function setupGame(studio: StudioDocument, gameInfo?: Partial<GameDocument>): Promise<GameDocument> {
  const chance = new Chance();

  const game = await new Game({
    name: gameInfo?.name || chance.sentence({ words: 2 }),
    studioId: studio.id,
    contractAddress: generateAddress(),
    chain: gameInfo?.chain || 'ethereum',
    currencies: { fab: generateAddress(), mgt: generateAddress() },
    ...gameInfo,
  }).save();

  return game;
}

function generateAddress() {
  const bytes = randomBytes(20).toString('hex');
  return '0x' + bytes;
}
