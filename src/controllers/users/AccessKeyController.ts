import { injectable, inject } from 'inversify';
import express, { NextFunction, Request, Response } from 'express';

import { UserRepository } from '../../repositories/UserRepository';
import { AccessKeySerializer } from './serializers/AccessKeySerializer';
import { HTTPBadRequestError, HTTPNotFoundError } from '../../errors/http';
import { AccessKeyRepository } from '../../repositories/AccessKeyRepository';
import { GameAccessKeysExistsChecker } from '../../services/GameAccessKeysExistsChecker';
import { UserAuthenticationMiddleware } from '../../middlewares/UserAuthenticationMiddleware';
import { AssetConditionalKeyClaimer } from '../../services/accessKey/AssetConditionalKeyClaimer';
import { ObjectIdValidator } from '../../dto/validators/ObjectIdValidator';

@injectable()
export class AccessKeyController {
  @inject(UserRepository) private userRepository: UserRepository;
  @inject(AccessKeyRepository) private accessKeyRepository: AccessKeyRepository;
  @inject(AccessKeySerializer) private accessKeySerializer: AccessKeySerializer;
  @inject(AssetConditionalKeyClaimer) private assetConditionalKeyClaimer: AssetConditionalKeyClaimer;
  @inject(GameAccessKeysExistsChecker) private gameAccessKeyExistsChecker: GameAccessKeysExistsChecker;
  @inject(ObjectIdValidator) private objectIdValidator: ObjectIdValidator;

  router: express.Application;

  constructor(@inject(UserAuthenticationMiddleware) userAuthenticationMiddleware: UserAuthenticationMiddleware) {
    this.router = express()
      .get('/:gameId', userAuthenticationMiddleware.apply, this.get)
      .patch('/', userAuthenticationMiddleware.apply, this.patch);
  }

  private get = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const { gameId } = request.params;

    const validationError = await this.validateGameId(gameId);

    if (validationError) return next(validationError);

    const { id: userId } = await this.userRepository.findByAccountId(response.locals.accountId);

    const claimedKeys = await this.accessKeyRepository.findByGameIdAndUserId(gameId, userId);

    if (claimedKeys.length === 0) {
      return next(
        new HTTPNotFoundError([{ title: 'NotFound', detail: 'There is no activated access key for this game' }])
      );
    }

    response.send(this.accessKeySerializer.apply(claimedKeys));
  };

  private patch = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const gameId = request.body.data?.gameId;

    const validationError = await this.validateGameId(gameId);

    if (validationError) return next(validationError);

    const accountId = response.locals.accountId.toString();
    const resultObject = await this.assetConditionalKeyClaimer.apply({ gameId, accountId });

    if (resultObject.error) return next(resultObject.error);

    response.send(this.accessKeySerializer.apply(resultObject.data));
  };

  private validateGameId = async (gameId: string) => {
    const validationResult = this.objectIdValidator.apply(gameId);

    if (!validationResult.isValid) {
      return new HTTPBadRequestError(validationResult.errors);
    }

    if (!(await this.gameAccessKeyExistsChecker.apply(gameId))) {
      return new HTTPNotFoundError([{ title: 'NotFound', detail: 'There are no keys for this game' }]);
    }
  };
}
