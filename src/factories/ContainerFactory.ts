import { Redis } from 'ioredis';
import { Container } from 'inversify';
import StatsdClient from 'statsd-client';

import { Logger } from '../types/ILogger';
import Settings from '../types/Settings';
import settings from '../config/settings';
import { PinoLoggerFactory } from './PinoLoggerFactory';
import BuildRedisConnection from './RedisConnectionFactory';
import { apply as statsDClient } from './StatsDClientFactory';

export const apply = (): Container => {
  const container = new Container({ autoBindInjectable: true });
  const buildRedisConnection = new BuildRedisConnection();
  const logger = new PinoLoggerFactory().apply();

  container
    .bind<Settings>('Settings')
    .toDynamicValue(() => settings)
    .inSingletonScope();

  container
    .bind<Logger>('Logger')
    .toDynamicValue(() => logger)
    .inSingletonScope();

  container
    .bind<Redis>('Redis')
    .toDynamicValue((ctx) => buildRedisConnection.apply(ctx.container.get<Settings>('Settings').redis))
    .inSingletonScope();

  container
    .bind<StatsdClient>('StatsdClient')
    .toDynamicValue(() => statsDClient())
    .inSingletonScope();

  return container;
};
