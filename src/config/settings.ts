import './setupDotenv';

import Settings from '../types/Settings';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json');

const settings: Settings = {
  port: parseInt(process.env.PORT || '3000'),
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },
  mongodb: {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/nemesis',
    tlsCAFile: process.env.MONGODB_TLS_CA_PATH || '',
  },
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
  statsd: {
    host: process.env.STATSD_URL || '',
  },
  playFab: {
    titleId: process.env.PLAYFAB_TITLE_ID,
    secretKey: String(process.env.PLAYFAB_SECRET_KEY).trim(),
  },
  blockchain: {
    ethereum: {
      provider: process.env.ETHEREUM_PROVIDER_URL,
    },
    polygon: {
      provider: process.env.POLYGON_PROVIDER_URL,
      scanBatchSize: parseInt(process.env.POLYGON_SCAN_BATCH_SIZE || '1000', 10),
      confirmations: parseInt(process.env.POLYGON_BLOCK_CONFIRMATIONS || '5', 10),
      gamePortalKey: String(process.env.POLYGON_GAME_PORTAL_PRIVATE_KEY).trim(),
    },
  },
  apiKeys: {
    moralisApi: process.env.MORALIS_API_KEY || 'n82CIia9lOzIWi9YdyQA7cAqRxFkQj8pgCwkMuiINN1mEY83J7IdbqImBnwVjVIS',
  },
  jobs: {
    transactionWorker: {
      interval: parseInt(process.env.TRANSACTION_WORKER_JOB_INTERVAL || '15000', 10),
      lockTTL: parseInt(process.env.TRANSACTION_WORKER_JOB_LOCK_TTL || '30000'),
    },
    contractScanWorker: {
      interval: parseInt(process.env.CONTRACT_SCAN_WORKER_JOB_INTERVAL || '15000', 10),
    },
  },
  zendesk: {
    fieldId: process.env.ZENDESK_FIELD_ID,
  },
  accessKeys: {
    maxAccessKeysPerPlayer: parseInt(process.env.MAX_ACCESS_KEYS_PER_PLAYER || '3'),
  },
  authenticationKey: process.env.AUTHENTICATION_KEY,
  serverAuthenticationKey: process.env.SERVER_AUTHENTICATION_KEY,
  jwtSecretKey: process.env.JWT_SECRET_KEY,
  environment: process.env.ENVIRONMENT || process.env.NODE_ENV,
  version: packageJson.version,
};

export default settings;
