import { inject, injectable } from 'inversify';

import { ConflictError, NotFoundError } from '../errors/application';
import UserModel, { UserDocument } from '../models/User';
import { Logger } from '../types/ILogger';
import Settings from '../types/Settings';
import { User } from '../types';

@injectable()
export class UserRepository {
  @inject('Logger') logger!: Logger;
  @inject('Settings') settings: Settings;

  async update(userInfo: User): Promise<User> {
    const updateQuery: {
      walletAddress?: string;
      balances: typeof userInfo.balances;
    } = {
      balances: userInfo.balances,
    };

    if (userInfo.walletAddress) {
      updateQuery.walletAddress = userInfo.walletAddress;
    }

    try {
      const user = await UserModel.findOneAndUpdate({ accountId: userInfo.accountId }, updateQuery, { new: true });

      return this.toUserObject(user);
    } catch (err: any) {
      if (err.message.includes('E11000') && err.message.includes('walletAddress')) {
        throw new ConflictError('Wallet address already linked to an existing account');
      }

      throw err;
    }
  }

  async create(userInfo: User): Promise<User> {
    const user = await UserModel.findOne({ accountId: userInfo.accountId });

    if (user) throw new ConflictError('User already exists');

    const newUser = await UserModel.create({
      accountId: userInfo.accountId,
      studioId: userInfo.studioId,
      balances: userInfo.balances,
    });

    return this.toUserObject(newUser);
  }

  async findByAccountId(accountId: string): Promise<User> {
    const user = await UserModel.findOne({ accountId });

    if (!user) throw new NotFoundError('User not found');

    return this.toUserObject(user);
  }

  async findById(id: string): Promise<User> {
    const user = await UserModel.findOne({ _id: id });

    if (!user) throw new NotFoundError('User not found');

    return this.toUserObject(user);
  }

  async findByWalletAddress(walletAddress: string): Promise<User> {
    const user = await UserModel.findOne({ walletAddress });

    if (!user) throw new NotFoundError('User not found');

    return this.toUserObject(user);
  }

  async findByStudioIdAndWalletAddress(studioId: string, walletAddress: string): Promise<User[]> {
    const users = await UserModel.find({ walletAddress, studioId });

    if (!users) return [];

    return users.map(this.toUserObject);
  }

  private toUserObject(user: UserDocument): User {
    return {
      id: user.id,
      studioId: user.studioId.toString(),
      accountId: user.accountId,
      walletAddress: user.walletAddress,
      balances: user.balances,
    };
  }
}
