import express, { NextFunction, Request, Response } from 'express';
import { injectable, inject } from 'inversify';

import { GameAuthenticationMiddleware } from '../../middlewares/GameAuthenticationMiddleware';
import { AttributesUpdater } from '../../services/assets/attributes/AttributesUpdater';
import { ObjectIdValidator } from '../../dto/validators/ObjectIdValidator';
import { AssetsRetriever } from '../../services/assets/AssetsRetriever';
import { AssetUpdater } from '../../services/assets/AssetUpdater';
import { AssetCreator } from '../../services/assets/AssetCreator';
import { CreateAssetDTO } from '../../dto/assets/CreateAssetDTO';
import { AssetBurner } from '../../services/assets/AssetBurner';
import { HTTPBadRequestError } from '../../errors/http';

@injectable()
export class AssetsController {
  @inject(AssetUpdater) private assetUpdater: AssetUpdater;
  @inject(AssetCreator) private assetCreator: AssetCreator;
  @inject(AssetBurner) private assetBurner: AssetBurner;
  @inject(AssetsRetriever) private assetsRetriever: AssetsRetriever;
  @inject(ObjectIdValidator) private objectIdValidator: ObjectIdValidator;
  @inject(AttributesUpdater) private attributesUpdater: AttributesUpdater;

  router: express.Application;

  constructor(@inject(GameAuthenticationMiddleware) authMiddleware: GameAuthenticationMiddleware) {
    this.router = express()
      .use(authMiddleware.apply)
      .post('/', this.create)
      .get('/', this.index)
      .put('/update', this.update)
      .post('/burn', this.burn)
      .patch('/:assetId/attributes', this.updateAttributes);
  }

  index = async (request: Request, response: Response): Promise<void> => {
    const assets = await this.assetsRetriever.apply(response.locals.game.id, request.query.accountId?.toString());
    response.send({ data: assets });
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const { type, accountId, externalId, collectionId, attributes } = request.body.data;

    const dto: CreateAssetDTO = {
      game: response.locals.game,
      type,
      accountId,
      externalId,
      collectionId,
      attributes,
    };

    const storedAsset = await this.assetCreator.apply(dto);

    response.status(201).send({ data: storedAsset });
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const asset = await this.assetUpdater.apply(
      request.body.data.id,
      request.body.data.type,
      request.body.data.accountId,
      request.body.data.attributes
    );

    if (asset) {
      response.send({ data: asset });
    } else {
      response.status(400).send({ error: { detail: 'Asset could not be updated' } });
    }
  };

  burn = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const { assetId } = request.body.data;

    const validationError = await this.validateAssetId(assetId);

    if (validationError) return next(validationError);

    const burntAsset = await this.assetBurner.apply(assetId, response.locals.game.id);

    response.status(200).send({ data: burntAsset });
  };

  updateAttributes = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const { assetId } = request.params;
    const { attributes } = request.body.data;

    const validationError = await this.validateAssetId(assetId);

    if (validationError) return next(validationError);

    const asset = await this.attributesUpdater.apply(assetId, attributes);

    response.status(200).send({ data: asset });
  };

  private validateAssetId = async (gameId: string) => {
    const validationResult = this.objectIdValidator.apply(gameId);

    if (!validationResult.isValid) {
      return new HTTPBadRequestError(validationResult.errors);
    }
  };
}
