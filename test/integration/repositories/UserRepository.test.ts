import { expect } from 'chai';

import { UserRepository } from '../../../src/repositories/UserRepository';
import { setupGame, setupStudio, setupUser } from '../../controls';
import { getTestContainer } from '../../helpers/getTestContainer';
import { user as userFixture } from '../../fixtures/userInfo';
import { StudioDocument } from '../../../src/models/Studio';
import { UserDocument } from '../../../src/models/User';
import { User } from '../../../src/types';
import { ConflictError, NotFoundError } from '../../../src/errors/application';

describe('UserRepository', () => {
  const repository = getTestContainer().get(UserRepository);

  let studio: StudioDocument;
  let userInfo: User;

  beforeEach(async () => {
    studio = await setupStudio();
    userInfo = { ...userFixture, studioId: studio.id };
  });

  describe('#create', () => {
    describe('when the user does not exist', () => {
      let user: User;

      beforeEach(async () => {
        user = await repository.create(userInfo);
      });

      it('stores the user object', () => {
        user.id = '';

        expect(user).to.deep.eq({
          id: '',
          accountId: '123',
          studioId: studio.id,
          walletAddress: undefined,
          balances: { fab: '0', mgt: '0' },
        });
      });
    });

    describe('when the user exists', () => {
      describe('updating the walletAddress', () => {
        let user: User;

        beforeEach(async () => {
          user = await repository.create(userInfo);
        });

        it('returns user with walletAddress', async () => {
          const walletAddress = '0x' + '0'.repeat(40);

          const updatedUser = await repository.update({
            ...user,
            walletAddress,
          });

          expect(updatedUser).to.deep.equal({
            ...user,
            walletAddress,
          });
        });
      });
    });
  });

  describe('#update', () => {
    beforeEach(async () => {
      const game = await setupGame(studio);
      await setupUser(game, userInfo);
    });

    it(`updates user's walletAddress and balances `, async () => {
      const walletAddress = '0x' + '0'.repeat(40);

      const updatedUser = await repository.update({
        ...userInfo,
        walletAddress,
        balances: { fab: '100', mgt: '200' },
      });

      expect(updatedUser).to.deep.equal({
        ...userInfo,
        id: updatedUser.id,
        walletAddress,
        balances: { fab: '100', mgt: '200' },
      });
    });

    describe('when the walletAddress is already linked to another user', () => {
      const walletAddress = '0x' + '0'.repeat(40);

      beforeEach(async () => {
        const game = await setupGame(studio);
        await setupUser(game, { walletAddress });
      });

      it('throws an ConflictError', async () => {
        await expect(repository.update({ ...userInfo, walletAddress: walletAddress })).to.be.rejectedWith(
          ConflictError
        );
      });
    });
  });

  describe('#findByAccountId', () => {
    describe('when the user exists', () => {
      beforeEach(async () => {
        const game = await setupGame(studio);
        await setupUser(game, userInfo);
      });

      it('returns the user', async () => {
        const foundUser = await repository.findByAccountId(userInfo.accountId);

        expect(foundUser).to.deep.equal({ ...userInfo, id: foundUser.id, walletAddress: undefined });
      });
    });

    describe('when the user does not exist', () => {
      it('throws a NotFoundError', async () => {
        const accountId = '123';

        await expect(repository.findByAccountId(accountId)).to.be.rejectedWith(NotFoundError);
      });
    });
  });

  describe('#findById', () => {
    describe('when the user exists', () => {
      let userDoc: UserDocument;

      beforeEach(async () => {
        userDoc = await setupStudio().then(setupGame).then(setupUser);
      });

      it('returns the user object', async () => {
        const user = await repository.findById(userDoc.id);

        expect(user).to.deep.eq({
          id: user.id,
          accountId: user.accountId,
          studioId: user.studioId,
          walletAddress: undefined,
          balances: {
            fab: '0',
            mgt: '0',
          },
        });
      });
    });

    describe('when the user does not exist', () => {
      it('throws user not found error', async () => {
        const user = async () => await repository.findById('123');

        expect(user()).to.be.rejectedWith('User not found');
      });
    });
  });

  describe('findByWalletAddress', () => {
    describe('when the user exists', () => {
      describe(`and has a walletAddress linked to it's account`, () => {
        const walletAddress = '0x' + '0'.repeat(40);

        beforeEach(async () => {
          const game = await setupGame(studio);
          await setupUser(game, { ...userInfo, walletAddress });
        });

        it('returns the user', async () => {
          const foundUser = await repository.findByWalletAddress(walletAddress);

          expect(foundUser).to.deep.equal({ ...userInfo, id: foundUser.id, walletAddress: walletAddress });
        });
      });

      describe(`and doesn't have a walletAddress linked to it's account`, () => {
        beforeEach(async () => {
          const game = await setupGame(studio);
          await setupUser(game, userInfo);
        });

        it('throws a NotFoundError', async () => {
          const unlinkedWalletAddress = '0x' + '0'.repeat(40);

          await expect(repository.findByWalletAddress(unlinkedWalletAddress)).to.be.rejectedWith(NotFoundError);
        });
      });
    });

    describe('when the user does not exist', () => {
      it('throws a NotFoundError', async () => {
        const walletAddress = '0x' + '0'.repeat(40);

        await expect(repository.findByWalletAddress(walletAddress)).to.be.rejectedWith(NotFoundError);
      });
    });
  });

  describe('findByStudioIdAndWalletAddress', () => {
    describe('when the user exists', () => {
      describe(`and has a walletAddress linked to it's account`, () => {
        const walletAddress = '0x' + '0'.repeat(40);

        beforeEach(async () => {
          const game = await setupGame(studio);
          await setupUser(game, { ...userInfo, walletAddress });
        });

        it('returns the user', async () => {
          const foundUser = await repository.findByStudioIdAndWalletAddress(studio.id, walletAddress);

          expect(foundUser).to.deep.equal([{ ...userInfo, id: foundUser[0].id, walletAddress: walletAddress }]);
        });
      });

      describe(`and doesn't have a walletAddress linked to it's account`, () => {
        beforeEach(async () => {
          const game = await setupGame(studio);
          await setupUser(game, userInfo);
        });

        it('returns an empty array', async () => {
          const unlinkedWalletAddress = '0x' + '0'.repeat(40);

          const foundUser = await repository.findByStudioIdAndWalletAddress(studio.id, unlinkedWalletAddress);

          expect(foundUser).to.deep.equal([]);
        });
      });
    });

    describe('when the user does not exist', () => {
      it('throws a NotFoundError', async () => {
        const walletAddress = '0x' + '0'.repeat(40);

        const foundUser = await repository.findByStudioIdAndWalletAddress(studio.id, walletAddress);

        expect(foundUser).to.deep.equal([]);
      });
    });
  });
});
