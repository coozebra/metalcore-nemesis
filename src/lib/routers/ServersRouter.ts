import { inject, injectable } from 'inversify';
import express from 'express';

import { UsersController } from '../../controllers/server/UsersController';

@injectable()
export class ServersRouter {
  router = express.Router();

  constructor(@inject(UsersController) usersController: UsersController) {
    this.router.use('/games', usersController.router);
  }
}
