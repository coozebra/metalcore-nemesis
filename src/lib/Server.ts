import 'express-async-errors';
import express, { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import { inject, injectable } from 'inversify';
import swaggerUi from 'swagger-ui-express';
import createHttpError from 'http-errors';
import Settings from '../types/Settings';
import compression from 'compression';
import helmet from 'helmet';
import cors from 'cors';
import http from 'http';

import { Logger } from '../types/ILogger';

import swaggerDocument from '../config/swagger.json';
import { HTTPBaseError } from '../errors/http/HTTPBaseError';
import { HttpErrorParser } from '../services/http/HttpErrorParser';

import { InfoController } from '../controllers/InfoController';
import { HealthController } from '../controllers/HealthController';
import { TokensController } from '../controllers/tokens/TokensController';

import { UsersRouter } from './routers/UsersRouter';
import { ServersRouter } from './routers/ServersRouter';
import { StudiosRouter } from './routers/StudiosRouter';
import { RequestBodyCheckerMiddleware } from '../middlewares/RequestBodyCheckerMiddleware';

@injectable()
class Server {
  app: express.Application;
  private port: number;
  private server: http.Server;

  private logger: Logger;
  private settings: Settings;

  constructor(
    @inject('Logger') logger: Logger,
    @inject('Settings') settings: Settings,
    @inject(RequestBodyCheckerMiddleware) requestBodyCheckerMiddleware: RequestBodyCheckerMiddleware,

    @inject(InfoController) infoController: InfoController,
    @inject(TokensController) tokenController: TokensController,
    @inject(HealthController) healthController: HealthController,

    @inject(ServersRouter) ServersRouter: ServersRouter,
    @inject(UsersRouter) usersRouter: UsersRouter,
    @inject(StudiosRouter) studiosRouter: StudiosRouter
  ) {
    this.port = settings.port;
    this.settings = settings;
    this.logger = logger;

    this.app = express()
      .use(helmet())
      .use(compression())
      .use(express.json())
      .use(express.urlencoded({ extended: true }))
      .use(cors())
      .use(requestBodyCheckerMiddleware.apply)
      .use('/info', infoController.router)
      .use('/health', healthController.router)
      .use('/tokens', tokenController.router)
      .use('/users', usersRouter.router)
      .use('/studios', studiosRouter.router)
      .use('/server', ServersRouter.router)
      .use('/docs', this.restrictProduction, swaggerUi.serveFiles(swaggerDocument), swaggerUi.setup(swaggerDocument))
      .use(this.generalErrorHandler);

    this.server = http.createServer(this.app);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  generalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
    const httpError = new HttpErrorParser().apply(err);

    if (httpError.status === 500) this.logger.error(err);

    if (httpError instanceof HTTPBaseError) {
      return res.status(httpError.status).send({ errors: httpError.errors });
    }

    if (httpError instanceof createHttpError.HttpError) {
      return res.status(httpError.status).send({ errors: [{ detail: httpError.message }] });
    }
  };

  start(): void {
    this.server.listen(this.port, () => this.logger.info('Live on: ' + this.port));
  }

  restrictProduction = (req: Request, res: Response, next: NextFunction) => {
    if (this.settings.environment === 'production') {
      return res.sendStatus(403);
    }

    next();
  };
}

export default Server;
