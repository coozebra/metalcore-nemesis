import express from 'express';
import { inject, injectable } from 'inversify';

import { UsersController } from '../../controllers/users/UsersController';
import { AccessKeyController } from '../../controllers/users/AccessKeyController';
import { WalletsController } from '../../controllers/users/WalletsController';
import { AssetsController } from '../../controllers/users/AssetsController';

@injectable()
export class UsersRouter {
  router = express.Router();

  constructor(
    @inject(WalletsController) walletsController: WalletsController,
    @inject(AccessKeyController) accessKeysController: AccessKeyController,
    @inject(UsersController) usersController: UsersController,
    @inject(AssetsController) assetsController: AssetsController
  ) {
    this.router
      .use('/', usersController.router)
      .use('/access-keys', accessKeysController.router)
      .use('/wallet', walletsController.router)
      .use('/assets', assetsController.router);
  }
}
