import { injectable } from 'inversify';
import express, { NextFunction, Request, Response } from 'express';

@injectable()
export class HealthController {
  router: express.Application;

  constructor() {
    this.router = express().get('/', this.pong);
  }

  pong = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    response.send('pong');
    next();
  };
}
