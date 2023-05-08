import { expect } from 'chai';

import { BalanceIncrementor } from '../../../src/services/balance/BalanceIncrementor';
import { setupGame, setupStudio, setupUser } from '../../controls';
import { getTestContainer } from '../../helpers/getTestContainer';
import { UserDocument } from '../../../src/models/User';
import { toWeiStr } from '../../helpers/utils';

describe('BalanceIncrementor', () => {
  const balanceIncrementor = getTestContainer().get(BalanceIncrementor);

  let dbUser: UserDocument;

  beforeEach(async () => {
    dbUser = await setupStudio().then(setupGame).then(setupUser);
  });

  describe('adding funds to an existing user', () => {
    it('adds the amount to users balance', async () => {
      const user = await balanceIncrementor.apply(dbUser.accountId, 'fab', toWeiStr('1000'));

      expect(user.balances.fab).to.equal(toWeiStr('1000'));
    });

    describe('when user already has funds', () => {
      it('sums up with the existing amount', async () => {
        await balanceIncrementor.apply(dbUser.accountId, 'fab', toWeiStr('1000'));
        const user = await balanceIncrementor.apply(dbUser.accountId, 'fab', toWeiStr('300'));

        expect(user.balances.fab).to.equal(toWeiStr('1300'));
      });
    });
  });

  describe('adding funds to a non-existing user', () => {
    it('throws error', async () => {
      await expect(balanceIncrementor.apply('wrongUser', 'fab', toWeiStr('1'))).to.be.rejectedWith('User not found');
    });
  });
});
