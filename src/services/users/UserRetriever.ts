import { inject, injectable } from 'inversify';

import { User } from '../../types';
import { GameRepository } from '../../repositories/GameRepository';
import { UserRepository } from '../../repositories/UserRepository';

@injectable()
export class UsersRetriever {
  @inject(GameRepository) private gameRepository: GameRepository;
  @inject(UserRepository) private userRepository: UserRepository;

  async apply(gameId: string, walletAddress: string): Promise<User[]> {
    const game = await this.gameRepository.findById(gameId);

    const user = await this.userRepository.findByStudioIdAndWalletAddress(game.studioId, walletAddress);

    return user;
  }
}
