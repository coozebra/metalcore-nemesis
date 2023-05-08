import Chance from 'chance';

import ResourceModel, { ResourceDocument } from '../../src/models/Resource';
import { CollectionDocument } from '../../src/models/Collection';

export async function setupResource(collection: CollectionDocument, tokenId?: number): Promise<ResourceDocument> {
  const resource = await new ResourceModel({
    collectionId: collection.id,
    tokenId: tokenId,
    attributes: {
      name: new Chance().name(),
    },
  }).save();

  return resource;
}
