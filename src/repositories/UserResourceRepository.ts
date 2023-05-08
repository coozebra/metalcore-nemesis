import { MongoError } from 'mongodb';
import { ClientSession } from 'mongoose';
import { injectable } from 'inversify';

import { UserResource, UserResourceDeposit } from '../types';
import UserResourceModel, { UserResourceDocument } from '../models/UserResource';
import { negativeDecrementError, negativeIncrementError } from '../errors/errors';

@injectable()
export class UserResourceRepository {
  async findOne(collectionId: string, userId: string, gameId: string): Promise<UserResource> {
    const userResource = await UserResourceModel.findOne({
      collectionId,
      userId,
      gameId,
    });

    if (!userResource) {
      return {
        collectionId,
        userId,
        gameId,
        balances: {},
      };
    }

    return this.toUserResourceObject(userResource);
  }

  async incrementBalance(
    { userId, gameId, balances, collectionId }: UserResource,
    session?: ClientSession
  ): Promise<void> {
    if (Object.values(balances).some((value) => value < 0)) {
      throw negativeIncrementError;
    }

    await UserResourceModel.updateOne(
      {
        userId,
        gameId,
        collectionId,
      },
      {
        $inc: Object.fromEntries(Object.entries(balances).map(([key, value]) => [`balances.${key}`, value])),
      },
      { upsert: true, session: session }
    );
  }

  async decrementBalance({ userId, gameId, balances, collectionId }: UserResource): Promise<boolean> {
    if (Object.values(balances).some((value) => value < 0)) {
      throw negativeDecrementError;
    }

    const { n } = await UserResourceModel.updateOne(
      {
        userId,
        gameId,
        collectionId,
        ...Object.fromEntries(Object.entries(balances).map(([key, value]) => [`balances.${key}`, { $gte: value }])),
      },
      {
        $inc: Object.fromEntries(Object.entries(balances).map(([key, value]) => [`balances.${key}`, -value])),
      }
    );

    return n > 0;
  }

  async incrementBalanceWithDeposit(
    { userId, gameId, balances, collectionId }: UserResource,
    deposit: UserResourceDeposit
  ): Promise<void> {
    if (Object.values(balances).some((value) => value < 0)) {
      throw negativeIncrementError;
    }

    try {
      await UserResourceModel.updateOne(
        {
          userId,
          gameId,
          collectionId,
          ['deposits.txId']: { $ne: deposit.txId },
        },
        {
          $inc: Object.fromEntries(Object.entries(balances).map(([key, value]) => [`balances.${key}`, value])),
          $push: { deposits: [deposit] },
        },
        { upsert: true }
      );
    } catch (err) {
      if (err instanceof MongoError && err.code === 11000) {
        return undefined;
      }

      throw err;
    }
  }

  private toUserResourceObject(userResource: UserResourceDocument): UserResource {
    return {
      collectionId: userResource.collectionId.toString(),
      userId: userResource.userId.toString(),
      gameId: userResource.gameId.toString(),
      balances: userResource.balances,
    };
  }
}
