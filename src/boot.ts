import 'reflect-metadata';

import './config/setupDotenv';
import './config/setupNewrelic';

import MongoDBConnectionFactory from './factories/MongoDBConnectionFactory';

(async () => {
  const { default: settings } = await require('./config/settings');

  await new MongoDBConnectionFactory().apply(settings);
})();
