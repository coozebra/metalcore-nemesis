import Chance from 'chance';

import { GameDocument } from '../../src/models/Game';
import User, { UserDocument } from '../../src/models/User';

export async function setupUser(game: GameDocument, userInfo?: Partial<UserDocument>): Promise<UserDocument> {
  const chance = new Chance();

  const user = await new User({
    accountId: chance.cf(),
    studioId: game.studioId,
    walletAddress: undefined,
    balances: { fab: '0', mgt: '0' },
    ...userInfo,
  }).save();

  return user;
}
