import Chance from 'chance';
import { randomBytes } from 'crypto';

import { GameDocument } from '../../src/models/Game';
import CollectionModel, { CollectionDocument } from '../../src/models/Collection';

export async function setupCollection(
  game: GameDocument,
  collectionInfo?: Partial<CollectionDocument>
): Promise<CollectionDocument> {
  const chance = new Chance();

  const collection = await new CollectionModel({
    gameId: game.id,
    contractAddress: generateAddress(),
    name: chance.word(),
    type: 'ERC-721',
    ...collectionInfo,
  }).save();

  return collection;
}

function generateAddress() {
  const bytes = randomBytes(20).toString('hex');
  return '0x' + bytes;
}
