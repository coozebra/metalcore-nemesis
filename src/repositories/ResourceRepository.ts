import { injectable } from 'inversify';

import ResourceModel, { ResourceDocument } from '../models/Resource';
import { Resource } from '../types';
import { resourceNotFoundError } from '../errors/errors';

@injectable()
export class ResourceRepository {
  async create(resource: Resource): Promise<Resource> {
    const createdResource = await new ResourceModel({
      collectionId: resource.collectionId,
      attributes: resource.attributes,
    }).save();

    return this.toResourceObject(createdResource);
  }

  async findByCollectionId(id?: string): Promise<Resource[]> {
    const resources = await ResourceModel.find({ collectionId: id });

    return resources.map(this.toResourceObject);
  }

  async findByResourceId(resourceId: string): Promise<Resource> {
    const resource = await ResourceModel.findById(resourceId);

    if (!resource) {
      throw resourceNotFoundError;
    }

    return this.toResourceObject(resource);
  }

  async findByCollectionIdAndTokenId(collectionId: string, tokenId: number): Promise<Resource> {
    const resource = await ResourceModel.findOne({ collectionId, tokenId });

    if (!resource) {
      throw resourceNotFoundError;
    }

    return this.toResourceObject(resource);
  }

  async update(resource: Resource): Promise<Resource> {
    const updatedResource = await ResourceModel.findOneAndUpdate({ _id: resource.id }, { ...resource }, { new: true });

    return this.toResourceObject(updatedResource);
  }

  private toResourceObject(resource: ResourceDocument): Resource {
    return {
      id: resource.id,
      tokenId: resource.tokenId || null,
      collectionId: resource.collectionId.toString(),
      attributes: resource.attributes,
    };
  }
}
