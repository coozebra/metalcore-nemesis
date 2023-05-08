import IORedis from 'ioredis';
import Settings from '../types/Settings';
import { injectable, inject } from 'inversify';

@injectable()
class RedisConnectionFactory {
  @inject('Settings') settings!: Settings;

  apply(settings: Settings['redis']): IORedis {
    return new IORedis(settings.url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
}

export default RedisConnectionFactory;
