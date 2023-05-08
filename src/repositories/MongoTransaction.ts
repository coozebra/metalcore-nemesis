import { inject, injectable } from 'inversify';
import mongoose, { ClientSession } from 'mongoose';

import { Logger } from '../types/ILogger';

export type TransactionCallback = (session: ClientSession) => void;

@injectable()
export class MongoTransaction {
  @inject('Logger') private logger: Logger;

  async runInTransaction(callback: TransactionCallback) {
    const session: ClientSession = await mongoose.startSession();

    session.startTransaction();

    try {
      await callback(session);

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      this.logger.error(err);

      throw err;
    } finally {
      session.endSession();
    }
  }
}
