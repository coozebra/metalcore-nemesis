import { injectable } from 'inversify';

import { UserResponse } from '../../types/IUserResponse';
import { User } from '../../types';

@injectable()
export class UserSerializer {
  apply(user: User, displayName: string): UserResponse {
    return {
      id: user.id,
      displayName: displayName,
      accountId: user.accountId,
      walletAddress: user.walletAddress,
      balances: user.balances,
    };
  }
}
