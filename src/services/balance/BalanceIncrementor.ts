import { injectable, inject } from 'inversify';

import { UserRepository } from '../../repositories/UserRepository';
import { Logger } from '../../types/ILogger';
import { User } from '../../types';

@injectable()
export class BalanceIncrementor {
  @inject('Logger') logger!: Logger;

  @inject(UserRepository)
  private userRepository: UserRepository;

  async apply(accountId: string, key: string, value: string): Promise<User> {
    const currentBalance = await this.getCurrentBalance(accountId, key);
    const increment = BigInt(value);

    const newBalance = currentBalance + increment;

    const user = await this.userRepository.findByAccountId(accountId);

    const userWithBalance = {
      ...user,
      balances: {
        ...user.balances,
        [key]: newBalance.toString(),
      },
    };

    return this.userRepository.update(userWithBalance);
  }

  private async getCurrentBalance(accountId: string, key: string): Promise<bigint> {
    const user = await this.userRepository.findByAccountId(accountId);

    return BigInt(user.balances[key]);
  }
}
