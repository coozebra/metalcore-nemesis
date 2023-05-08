import StatsdClient from 'statsd-client';

declare global {
  namespace Express {
    interface Response {
      metrics?: {
        metric: string;
        delta?: number;
        tags?: StatsdClient.Tags;
      };
    }
  }
}
