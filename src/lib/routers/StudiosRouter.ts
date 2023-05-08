import { inject, injectable } from 'inversify';
import express, { Request, Response, NextFunction } from 'express';

import Settings from '../../types/Settings';
import { UsersController } from '../../controllers/studios/UsersController';
import { GamesController } from '../../controllers/studios/GamesController';
import { AssetsController } from '../../controllers/studios/AssetsController';
import { ResourcesController } from '../../controllers/studios/ResourcesController';
import { UsersBalancesController } from '../../controllers/studios/BalancesController';
import { UserResourcesController } from '../../controllers/studios/UserResourcesController';

@injectable()
export class StudiosRouter {
  router = express.Router();

  constructor(
    @inject('Settings') private settings: Settings,
    @inject(GamesController) gamesController: GamesController,
    @inject(AssetsController) assetsController: AssetsController,
    @inject(UsersController) usersController: UsersController,
    @inject(ResourcesController) resourcesController: ResourcesController,
    @inject(UsersBalancesController) userBalancesController: UsersBalancesController,
    @inject(UserResourcesController) userResourcesController: UserResourcesController
  ) {
    this.router
      .use('/users', usersController.router)
      .use(this.restrictProduction)
      .use('/games', gamesController.router)
      .use('/assets', assetsController.router)
      .use('/resources', resourcesController.router)
      .use('/users/balances', userBalancesController.router)
      .use('/users/resources', userResourcesController.router);
  }

  private restrictProduction = (req: Request, res: Response, next: NextFunction) => {
    if (this.settings.environment === 'production') {
      return res.sendStatus(403);
    }

    next();
  };
}
