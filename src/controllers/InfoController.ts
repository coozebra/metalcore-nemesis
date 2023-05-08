/* eslint-disable @typescript-eslint/no-var-requires */
import { injectable } from 'inversify';
import express, { Request, Response } from 'express';

import packageJson from '../../package.json';

@injectable()
export class InfoController {
  router: express.Router;

  constructor() {
    this.router = express.Router().get('/', this.index);
  }

  index = async (request: Request, response: Response): Promise<void> => {
    response.send({ data: { version: packageJson.version } });
  };
}
