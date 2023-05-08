import { inject, injectable } from 'inversify';

import { GameRepository } from '../../repositories/GameRepository';
import { User } from '../../types';

@injectable()
export class UserFactory {
  @inject(GameRepository) private gameRepository: GameRepository;

  async call(accountId: string, gameKey: string): Promise<User> {
    const game = await this.gameRepository.findByKey(gameKey);
    const tokens = Object.keys(game.currencies);

    const balances = tokens.reduce((acc, token) => {
      acc = Object.assign(acc, { [token]: '0' });
      return acc;
    }, {});

    return {
      accountId: accountId,
      studioId: game.studioId,
      walletAddress: undefined,
      balances: balances,
      wallet: undefined,
    };
  }
}
