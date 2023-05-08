import Settings from '../types/Settings';
import mongoose from 'mongoose';
import { injectable } from 'inversify';

@injectable()
class MongoDBConnectionFactory {
  async apply(settings: Settings): Promise<void> {
    await mongoose.connect(settings.mongodb.url, {
      tlsCAFile: settings.mongodb.tlsCAFile,
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
  }
}

export default MongoDBConnectionFactory;
