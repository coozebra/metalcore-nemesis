import { injectable } from 'inversify';

import { Collection } from '../types';
import { NotFoundError } from '../errors/application';
import CollectionModel, { CollectionDocument } from '../models/Collection';

@injectable()
export class CollectionRepository {
  async findByContractAddress(contractAddress: string): Promise<Collection> {
    const collection = await CollectionModel.findOne({ contractAddress });

    if (!collection) throw new NotFoundError('Collection not found');

    return this.toObject(collection);
  }

  async findManyByGameId(gameId: string): Promise<Collection[]> {
    const collections = await CollectionModel.find({ gameId });

    if (!collections.length) return [];

    return collections.map((collection) => this.toObject(collection));
  }

  async findById(id: string): Promise<Collection> {
    const collection = await CollectionModel.findById(id);

    if (!collection) throw new NotFoundError('Collection not found');

    return this.toObject(collection);
  }

  async findAll(): Promise<Collection[]> {
    const collections = await CollectionModel.find({});

    return collections.map(this.toObject);
  }

  async findByGameIdAndContractType(gameId: string, type: string): Promise<Collection[]> {
    const collections = await CollectionModel.find({ gameId, type });

    if (!collections.length) return [];

    return collections.map(this.toObject);
  }

  private toObject({ id, name, gameId, contractAddress, type }: CollectionDocument): Collection {
    return {
      id: id,
      name,
      gameId: gameId.toString(),
      contractAddress,
      type,
    };
  }
}
