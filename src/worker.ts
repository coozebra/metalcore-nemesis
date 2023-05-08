import './boot';

import yargs from 'yargs';

import AssetDepositWorker from './workers/AssetDepositWorker';
import AssetWithdrawWorker from './workers/AssetWithdrawWorker';
import { WorkerScheduler } from './workers/WorkerScheduler';
import TransactionWorker from './workers/TransactionWorker';
import Application from './lib/Application';
import { Logger } from './types/ILogger';

const argv = yargs(process.argv.slice(2)).options({
  worker: { type: 'array', demandOption: true },
}).argv;

const logger = Application.get<Logger>('Logger');

function logWorkerName(workerName: string) {
  logger.info(`Starting ${workerName} worker`);
}

for (const worker of argv.worker) {
  switch (worker) {
    case 'AssetDepositWorker': {
      logWorkerName(worker);
      Application.get(AssetDepositWorker).start();
      break;
    }

    case 'AssetWithdrawWorker': {
      logWorkerName(worker);
      Application.get(AssetWithdrawWorker).start();
      break;
    }

    case 'TransactionWorker': {
      logWorkerName(worker);
      Application.get(TransactionWorker).start();
      break;
    }

    case 'WorkerScheduler': {
      logWorkerName(worker);
      Application.get(WorkerScheduler).start();
      break;
    }

    default: {
      logger.error('Unknown worker');
    }
  }
}
