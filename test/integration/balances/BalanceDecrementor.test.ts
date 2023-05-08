import { expect } from 'chai';

import { BalanceDecrementor } from '../../../src/services/balance/BalanceDecrementor';
import { BalanceIncrementor } from '../../../src/services/balance/BalanceIncrementor';
import { setupGame, setupStudio, setupUser } from '../../controls';
import { getTestContainer } from '../../helpers/getTestContainer';
import { UserDocument } from '../../../src/models/User';
import { toWeiStr } from '../../helpers/utils';

describe('BalanceDecrementor', () => {
  const balanceDecrementor = getTestContainer().get(BalanceDecrementor);
  const balanceIncrementor = getTestContainer().get(BalanceIncrementor);

  let userDoc: UserDocument;

  beforeEach(async () => {
    userDoc = await setupStudio().then(setupGame).then(setupUser);
  });

  describe('when user exists and has balance', () => {
    beforeEach(async () => {
      await balanceIncrementor.apply(userDoc.accountId, 'fab', toWeiStr(1000));
    });

    describe('balance > decrement', () => {
      it('removes the amount from user balance', async () => {
        const user = await balanceDecrementor.apply(userDoc.accountId, 'fab', toWeiStr(500));

        expect(user.get(`balances.fab`)).to.equal(toWeiStr(500));
      });
    });

    describe('balance < decrement', () => {
      it('throws error', async () => {
        await expect(balanceDecrementor.apply(userDoc.accountId, 'fab', toWeiStr(1001))).to.be.rejectedWith(
          'Subtraction overflow'
        );
      });
    });
  });

  describe('subtracting balance from a non-existing user', () => {
    it('throws error', async () => {
      await expect(balanceDecrementor.apply('wrongUser', 'fab', '1')).to.be.rejectedWith('User not found');
    });
  });
});
