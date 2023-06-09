import { inject, injectable } from 'inversify';
import StatsdClient from 'statsd-client';
import { Request, Response, NextFunction } from 'express';

@injectable()
export class MetricsMiddleware {
  @inject('StatsdClient')
  private statsdClient?: StatsdClient;

  apply = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!this.statsdClient) return next();
    if (!res.metrics) return next();

    const { metric, delta } = res.metrics;
    const { tags } = res.metrics;

    if (delta && tags) {
      this.statsdClient?.increment(metric, delta, tags);
    } else if (delta) {
      this.statsdClient?.increment(metric, delta);
    } else if (tags) {
      this.statsdClient?.increment(metric, 1, tags);
    } else {
      this.statsdClient?.increment(metric);
    }

    next();
  };
}
