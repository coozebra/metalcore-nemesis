import 'reflect-metadata';
import { expect } from 'chai';
import mongoose from 'mongoose';

import { UserResourceRepository } from '../../../src/repositories/UserResourceRepository';
import UserResourceModel from '../../../src/models/UserResource';
import { negativeIncrementError } from '../../../src/errors/errors';
import { getTestContainer } from '../../helpers/getTestContainer';

describe('UserResourceRepository', () => {
  let userResourceRepository: UserResourceRepository;

  const userId = mongoose.Types.ObjectId().toString();
  const collectionId = mongoose.Types.ObjectId().toString();
  const gameId = mongoose.Types.ObjectId().toString();

  beforeEach(async () => {
    const container = getTestContainer();

    container.bind(UserResourceRepository).to(UserResourceRepository);
    userResourceRepository = container.get(UserResourceRepository);
  });

  describe('findOne', () => {
    it('should find user resource', async () => {
      await UserResourceModel.create({ userId, collectionId, gameId, balances: { a: 1 } });

      const userResource = await userResourceRepository.findOne(collectionId, userId, gameId);

      expect(userResource).eql({ userId, collectionId, gameId, balances: { a: 1 } });
    });
  });

  describe('incrementBalance', () => {
    it('should increment initial balance', async () => {
      await userResourceRepository.incrementBalance({ collectionId, userId, gameId, balances: { a: 1, b: 2 } });

      const userResource = await userResourceRepository.findOne(collectionId, userId, gameId);

      expect(userResource).eql({ collectionId, userId, gameId, balances: { a: 1, b: 2 } });
    });

    it('should increment balance', async () => {
      await UserResourceModel.create({ collectionId, userId, gameId, balances: { a: 1, b: 2 } });

      await userResourceRepository.incrementBalance({ collectionId, userId, gameId, balances: { a: 1, b: 2 } });

      const userResource = await userResourceRepository.findOne(collectionId, userId, gameId);

      expect(userResource).eql({ collectionId, userId, gameId, balances: { a: 2, b: 4 } });
    });

    it('should throw if provided balance are negative', async () => {
      expect(
        userResourceRepository.incrementBalance({ collectionId, userId, gameId, balances: { a: -1, b: 2 } })
      ).rejectedWith(negativeIncrementError);
    });
  });

  describe('incrementBalanceWithDeposit', () => {
    it('should increment balance with deposit', async () => {
      await userResourceRepository.incrementBalanceWithDeposit(
        {
          collectionId,
          userId,
          gameId,
          balances: { a: 1, b: 2 },
        },
        { amount: 10, txId: '0x4', blockNumber: 23, tokenId: 52 }
      );

      let userResource = await userResourceRepository.findOne(collectionId, userId, gameId);

      expect(userResource).eql({ collectionId, userId, gameId, balances: { a: 1, b: 2 } });

      await userResourceRepository.incrementBalanceWithDeposit(
        {
          collectionId,
          userId,
          gameId,
          balances: { a: 1, b: 2 },
        },
        { amount: 10, txId: '0x5', blockNumber: 23, tokenId: 52 }
      );

      userResource = await userResourceRepository.findOne(collectionId, userId, gameId);

      expect(userResource).eql({ collectionId, userId, gameId, balances: { a: 2, b: 4 } });
    });

    it('should throw if provided balance with deposit are negative', async () => {
      expect(
        userResourceRepository.incrementBalanceWithDeposit(
          {
            collectionId,
            userId,
            gameId,
            balances: { a: -1, b: 2 },
          },
          { amount: 10, txId: '0x5', blockNumber: 23, tokenId: 52 }
        )
      ).rejectedWith(negativeIncrementError);
    });

    it('should not increment balance with the same deposit', async () => {
      async function deposit() {
        return userResourceRepository.incrementBalanceWithDeposit(
          {
            collectionId,
            userId,
            gameId,
            balances: { a: 1, b: 2 },
          },
          { amount: 10, txId: '0x4', blockNumber: 23, tokenId: 52 }
        );
      }

      await deposit();

      let userResource = await userResourceRepository.findOne(collectionId, userId, gameId);

      expect(userResource).eql({ collectionId, userId, gameId, balances: { a: 1, b: 2 } });

      await deposit();

      userResource = await userResourceRepository.findOne(collectionId, userId, gameId);

      expect(userResource).eql({ collectionId, userId, gameId, balances: { a: 1, b: 2 } });
    });
  });

  describe('decrementBalance', () => {
    it('should throw if provided balance for decrement are negative', async () => {
      expect(
        userResourceRepository.decrementBalance({
          collectionId,
          userId,
          gameId,
          balances: { a: -1, b: 2 },
        })
      ).rejectedWith(negativeIncrementError);
    });

    it('should decrement balance', async () => {
      await UserResourceModel.create({ userId, collectionId, gameId, balances: { a: 5, b: 8 } });

      const result = await userResourceRepository.decrementBalance({
        collectionId,
        userId,
        gameId,
        balances: { a: 1, b: 2 },
      });

      expect(result).is.true;

      const userResource = await userResourceRepository.findOne(collectionId, userId, gameId);

      expect(userResource).eql({ collectionId, userId, gameId, balances: { a: 4, b: 6 } });
    });

    it('should not decrement balance if there is no document', async () => {
      const result = await userResourceRepository.decrementBalance({
        collectionId,
        userId,
        gameId,
        balances: { a: 1, b: 2 },
      });

      expect(result).is.false;
    });

    it('should not decrement balance if it produces negative values', async () => {
      await UserResourceModel.create({ userId, collectionId, gameId, balances: { a: 5, b: 1 } });

      const result = await userResourceRepository.decrementBalance({
        collectionId,
        userId,
        gameId,
        balances: { a: 1, b: 2 },
      });

      expect(result).is.false;

      const { ...userResource } = await userResourceRepository.findOne(collectionId, userId, gameId);

      expect(userResource).eql({ collectionId, userId, gameId, balances: { a: 5, b: 1 } });
    });
  });

  it('should test increment and decrement concurrently', async () => {
    await UserResourceModel.create({ userId, collectionId, gameId, balances: { a: 10000, b: 10000 } });

    await Promise.all(
      [...new Array(100)].map(async (_, i) => {
        await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 10)));
        return Promise.all([
          userResourceRepository.decrementBalance({
            collectionId,
            userId,
            gameId,
            balances: { a: i, b: i },
          }),
          userResourceRepository.incrementBalance({
            collectionId,
            userId,
            gameId,
            balances: { a: i, b: i },
          }),
        ]);
      })
    );

    const { ...userResource } = await userResourceRepository.findOne(collectionId, userId, gameId);

    expect(userResource).eql({ collectionId, userId, gameId, balances: { a: 10000, b: 10000 } });
  });
});
