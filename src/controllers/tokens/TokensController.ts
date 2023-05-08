import { inject, injectable } from 'inversify';
import express, { Request, Response } from 'express';

import { Logger } from '../../types/ILogger';

import { AssetRepository } from '../../repositories/AssetRepository';
import { TokenSerializer } from './serializers/TokenSerializer';
import { ObjectIdValidator } from '../../dto/validators/ObjectIdValidator';
import { NotFoundError } from '../../errors/application';

interface TokenMetadataDTO {
  collectionId: string;
  tokenId: number;
}

@injectable()
export class TokensController {
  @inject('Logger') logger: Logger;
  @inject(AssetRepository) private assetRepository: AssetRepository;
  @inject(TokenSerializer) private tokenSerializer: TokenSerializer;
  @inject(ObjectIdValidator) private objectIdValidator: ObjectIdValidator;

  router: express.Application;

  constructor() {
    this.router = express().get('/collection/:collectionId/token/:tokenId', this.find);
  }

  find = async (request: Request, response: Response): Promise<void> => {
    const { collectionId, tokenId } = request.params;
    const dto: TokenMetadataDTO = { collectionId, tokenId: parseInt(tokenId) };

    this.validateDto(dto);

    const asset = await this.assetRepository.findByCollectionIdAndTokenId(dto.collectionId, dto.tokenId);

    response.send(this.tokenSerializer.serialize(asset));
  };

  private validateDto(dto: TokenMetadataDTO): void {
    const validateObjectId = this.objectIdValidator.apply(dto.collectionId);

    if (!validateObjectId.isValid) {
      throw new NotFoundError('Collection not found');
    }

    if (!Number.isInteger(dto.tokenId)) {
      throw new NotFoundError('Token not found');
    }
  }
}
