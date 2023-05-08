import { inject, injectable } from 'inversify';

import { UserRepository } from '../../repositories/UserRepository';
import { subtractionOverflowError } from '../../errors/errors';
import User, { UserDocument } from '../../models/User';
import { Logger } from '../../types/ILogger';

@injectable()
export class BalanceDecrementor {
  @inject('Logger') logger!: Logger;

  @inject(UserRepository)
  private userRepository: UserRepository;

  async apply(accountId: string, key: string, value: string): Promise<UserDocument> {
    const keyName = `balances.${key}`;
    const currentBalance = await this.getCurrentBalance(accountId, key);
    const decrement = BigInt(value);

    const newBalance = currentBalance - decrement;

    if (currentBalance < decrement) throw subtractionOverflowError;

    const user = await User.findOneAndUpdate({ accountId }, { [keyName]: newBalance.toString() }, { new: true });

    return user;
  }

  private async getCurrentBalance(accountId: string, key: string): Promise<bigint> {
    const user = await this.userRepository.findByAccountId(accountId);

    // If user has no balance, it'll assume it is zero
    const balance = user.balances[key] ?? 0;
    return BigInt(balance);
  }
}
