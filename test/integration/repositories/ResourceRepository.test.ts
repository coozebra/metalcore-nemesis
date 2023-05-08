import { expect } from 'chai';

import { ResourceRepository } from '../../../src/repositories/ResourceRepository';
import { setupCollection, setupGame, setupResource, setupStudio } from '../../controls';
import { CollectionDocument } from '../../../src/models/Collection';
import { getTestContainer } from '../../helpers/getTestContainer';
import ResourceModel, { ResourceDocument } from '../../../src/models/Resource';
import { Resource } from '../../../src/types';

describe('ResourceRepository', () => {
  const resourceRepository = getTestContainer().get(ResourceRepository);

  let collection: CollectionDocument;

  beforeEach(async () => {
    collection = await setupStudio().then(setupGame).then(setupCollection);
  });

  describe('#create', () => {
    describe('with valid parameters', () => {
      it('creates a new Resource', async () => {
        const resource: Resource = {
          collectionId: collection.id,
          attributes: {
            name: 'Zephyr',
          },
        };

        const createdResource = await resourceRepository.create(resource);
        createdResource.id = '';

        expect(createdResource).to.deep.equal({
          id: '',
          tokenId: null,
          collectionId: collection.id,
          attributes: {
            name: 'Zephyr',
          },
        });
      });

      it('can insert many times with null', async () => {
        const resource: Resource = {
          collectionId: collection.id,
          attributes: {
            name: 'Zephyr',
          },
        };

        await resourceRepository.create(resource);
        await resourceRepository.create(resource);

        expect(await ResourceModel.countDocuments()).to.equal(2);
      });
    });
  });

  describe('#update', () => {
    describe('updating the tokenId', () => {
      describe('when tokenId is not taken', () => {
        let resource: ResourceDocument;

        beforeEach(async () => {
          resource = await setupResource(collection);
        });

        it('returns resource with tokenId', async () => {
          const updatedResource = await resourceRepository.update({
            id: resource.id,
            collectionId: resource.collectionId.toString(),
            tokenId: 1,
            attributes: resource.attributes,
          });

          expect(updatedResource).to.deep.equal({
            id: resource.id,
            tokenId: 1,
            collectionId: collection.id,
            attributes: {
              name: resource.attributes.name,
            },
          });
        });
      });
    });
  });
});
