import pino, { Logger } from 'pino';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const nrPino = require('@newrelic/pino-enricher');

export class PinoLoggerFactory {
  apply(): Logger {
    return pino(nrPino());
  }
}
