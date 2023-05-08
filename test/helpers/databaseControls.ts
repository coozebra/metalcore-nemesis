import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose, { Model } from 'mongoose';

import initMongoDB from '../../src/factories/MongoDBConnectionFactory';

let mongod: MongoMemoryReplSet;

export async function setupDatabase(memory = true): Promise<void> {
  const { default: settings } = await require('../../src/config/settings');

  if (memory) {
    mongod = await MongoMemoryReplSet.create({ replSet: { count: 2 } });
    await new initMongoDB().apply({
      ...settings,
      mongodb: {
        url: mongod.getUri(),
        tlsCAFile: settings.mongodb.tlsCAFile,
      },
    });
  } else {
    await new initMongoDB().apply(settings);
  }
}

export async function teardownDatabase(memory = true): Promise<void> {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();

  if (memory) {
    await mongod.stop();
  }
}

export async function cleanCollection(model: typeof Model): Promise<void> {
  await model.deleteMany({});
}
