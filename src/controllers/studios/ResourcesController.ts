import { injectable, inject } from 'inversify';
import express, { Request, Response } from 'express';

import { Logger } from '../../types/ILogger';

import { GameAuthenticationMiddleware } from '../../middlewares/GameAuthenticationMiddleware';
import { ResourceFactory } from '../../services/factories/ResourceFactory';
import { ResourceRepository } from '../../repositories/ResourceRepository';

@injectable()
export class ResourcesController {
  @inject('Logger') logger: Logger;
  @inject(ResourceFactory) resourceFactory: ResourceFactory;
  @inject(ResourceRepository) resourceRepository: ResourceRepository;

  router: express.Application;

  constructor(@inject(GameAuthenticationMiddleware) authMiddleware: GameAuthenticationMiddleware) {
    this.router = express().use(authMiddleware.apply).post('/', this.create).get('/', this.index);
  }

  create = async (request: Request, response: Response): Promise<void> => {
    const { collectionId, attributes } = request.body.data;

    const resource = await this.resourceFactory.call(collectionId, attributes, response.locals.game);

    const storedResource = await this.resourceRepository.create(resource);

    response.status(201).send({ data: storedResource });
  };

  index = async (request: Request, response: Response): Promise<void> => {
    const collectionId = request.query.collectionId?.toString();

    const resources = await this.resourceRepository.findByCollectionId(collectionId);

    if (resources.length === 0) {
      response.sendStatus(204);
    } else {
      response.status(200).send({
        data: resources,
      });
    }
  };
}
