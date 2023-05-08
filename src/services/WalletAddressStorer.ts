import { inject, injectable } from 'inversify';

import { UserRepository } from '../repositories/UserRepository';
import { ConflictError } from '../errors/application';
import { User } from '../types';

@injectable()
export class WalletAddressStorer {
  @inject(UserRepository)
  private userRepository: UserRepository;

  apply = async (accountId: string, walletAddress: string): Promise<User> => {
    const user = await this.userRepository.findByAccountId(accountId);

    const userWithWallet = { ...user, walletAddress: walletAddress };

    if (user.walletAddress) {
      throw new ConflictError('User has already linked a wallet to their account');
    }

    return this.userRepository.update(userWithWallet);
  };
}
