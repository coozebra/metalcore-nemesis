import express, { Request, Response } from 'express';
import { injectable, inject } from 'inversify';

import { UserAuthenticationMiddleware } from '../../middlewares/UserAuthenticationMiddleware';
import { ObjectIdValidator } from '../../dto/validators/ObjectIdValidator';
import { AssetsRetriever } from '../../services/assets/AssetsRetriever';
import { InvalidInputError } from '../../errors/application';
import { AssetDepositer } from '../../services/assets/AssetDepositer';
import { AssetWithdrawer } from '../../services/assets/AssetWithdrawer';

@injectable()
export class AssetsController {
  @inject(AssetsRetriever) private assetsRetriever: AssetsRetriever;
  @inject(AssetDepositer) private assetDepositer: AssetDepositer;
  @inject(AssetWithdrawer) private assetWithdrawer: AssetWithdrawer;
  @inject(ObjectIdValidator) private objectIdValidator: ObjectIdValidator;

  router: express.Application;

  constructor(@inject(UserAuthenticationMiddleware) userAuthenticationMiddleware: UserAuthenticationMiddleware) {
    this.router = express()
      .use(userAuthenticationMiddleware.apply)
      .get('/deposit', this.deposit)
      .get('/withdraw', this.withdraw)
      .get('/:gameId', this.show);
  }

  private deposit = async (request: Request, response: Response): Promise<void> => {
    const { assetId, chainId } = request.body.data;
    const { accountId } = response.locals;

    this.validateId(assetId);

    const signature = await this.assetDepositer.apply(assetId, accountId, chainId);

    response.send({
      data: signature,
    });
  };

  private withdraw = async (request: Request, response: Response): Promise<void> => {
    const { assetId, chainId } = request.body.data;
    const { accountId } = response.locals;

    this.validateId(assetId);

    const signature = await this.assetWithdrawer.apply(assetId, accountId, chainId);

    response.send({
      data: signature,
    });
  };

  private show = async (request: Request, response: Response): Promise<void> => {
    const { gameId } = request.params;

    this.validateGameId(gameId);

    const assets = await this.assetsRetriever.apply(gameId, response.locals.accountId);
    response.send({ data: assets });
  };

  private validateId(assetId: string): void {
    const validateObjectId = this.objectIdValidator.apply(assetId);

    if (!validateObjectId.isValid) {
      throw new InvalidInputError('Invalid assetId');
    }
  }

  private validateGameId(gameId: string): void {
    const validationResult = this.objectIdValidator.apply(gameId);

    if (!validationResult.isValid) {
      throw new InvalidInputError('Invalid gameId');
    }
  }
}
