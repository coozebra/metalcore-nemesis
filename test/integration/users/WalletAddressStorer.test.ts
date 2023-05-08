import { expect } from 'chai';

import { WalletAddressStorer } from '../../../src/services/WalletAddressStorer';
import { UserRepository } from '../../../src/repositories/UserRepository';
import { setupUser, setupGame, setupStudio } from '../../controls';
import { getTestContainer } from '../../helpers/getTestContainer';
import { UserDocument } from '../../../src/models/User';

describe('WalletAddressStorer', () => {
  const userRepository = getTestContainer().get(UserRepository);
  const walletAddressStorer = getTestContainer().get(WalletAddressStorer);
  const walletAddress = '0x' + '0'.repeat(40);

  let user: UserDocument;

  beforeEach(async () => {
    user = await setupStudio().then(setupGame).then(setupUser);
  });

  describe('#apply', () => {
    describe('when the accountId and walletAddress are provided', () => {
      it('saves the users walletAddress', async () => {
        const accountId = user.accountId;

        await walletAddressStorer.apply(accountId, walletAddress);

        const storedUser = await userRepository.findByAccountId(accountId);

        expect(storedUser.walletAddress).to.equal(walletAddress);
      });
    });
  });
});
