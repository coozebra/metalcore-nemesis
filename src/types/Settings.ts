type Settings = {
  port: number;
  redis: {
    url: string;
  };
  mongodb: {
    url: string;
    tlsCAFile: string;
  };
  logger: {
    level: string;
  };
  statsd: {
    host: string;
  };
  playFab: {
    titleId: string;
    secretKey: string;
  };
  blockchain: {
    ethereum: {
      provider: string;
    };
    polygon: {
      provider: string;
      scanBatchSize: number;
      confirmations: number;
      gamePortalKey: string;
    };
  };
  apiKeys: {
    moralisApi: string;
  };
  jobs: {
    transactionWorker: {
      interval: number;
      lockTTL: number;
    };
    contractScanWorker: {
      interval: number;
    };
  };
  zendesk: {
    fieldId: string;
  };
  accessKeys: {
    maxAccessKeysPerPlayer: number;
  };
  serverAuthenticationKey: string;
  authenticationKey: string;
  jwtSecretKey: string;
  version: string;
  environment?: string;
};

export default Settings;
