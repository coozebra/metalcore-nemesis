import { expect } from 'chai';
import request from 'supertest';

import Server from '../../../src/lib/Server';
import AssetModel from '../../../src/models/Asset';
import { getTestContainer } from '../../helpers/getTestContainer';

describe('TokensController', () => {
  const ROUTE = '/tokens/collection/:collectionId/token/:tokenId';
  const validTokenId = 13;
  const validCollectionId = '633f29a5b853142b1fd7ed05';

  const makeRequest = (collectionId: string, tokenId: number | string) =>
    request(server).get(ROUTE.replace(':collectionId', collectionId).replace(':tokenId', tokenId.toString()));

  const server = getTestContainer().get(Server).app;

  describe('GET /tokens/collectionId/:collectionId/token/:tokenId', () => {
    describe('when the params are valid', () => {
      describe('and the asset exists', () => {
        let res: request.Response;

        const validAsset = {
          type: 'ERC-721',
          externalId: 'externalId',
          collectionId: validCollectionId,
          tokenId: validTokenId,
          attributes: {
            name: 'Asset Name',
            description: 'Some description',
            image: 'http://imageplaceholder.fake.com/123',
            attributes: [
              {
                trait_type: 'Offense',
                value: 1,
              },
              {
                trait_type: 'Defense',
                value: 2,
              },
              {
                trait_type: 'Mobility',
                value: 3,
              },
              {
                trait_type: 'Versatility',
                value: 4,
              },
            ],
          },
        };

        beforeEach(async () => {
          await AssetModel.create(validAsset);
          res = await makeRequest('633f29a5b853142b1fd7ed05', 13);
        });

        it('returns http OK response status', () => {
          expect(res.status).to.equal(200);
        });

        it('returns token metadata', () => {
          expect(res.body).to.deep.equal({
            name: 'Asset Name',
            description: 'Some description',
            image: 'http://imageplaceholder.fake.com/123',
            attributes: [
              {
                trait_type: 'Offense',
                value: 1,
              },
              {
                trait_type: 'Defense',
                value: 2,
              },
              {
                trait_type: 'Mobility',
                value: 3,
              },
              {
                trait_type: 'Versatility',
                value: 4,
              },
            ],
          });
        });
      });

      describe('and the asset does not exist', () => {
        let res: request.Response;

        beforeEach(async () => {
          res = await makeRequest('633f29a5b853142b1fd7ed05', 13);
        });

        it('returns http Not Found response status', () => {
          expect(res.status).to.equal(404);
        });

        it('returns a NotFound error', () => {
          expect(res.body).to.eql({
            errors: [{ title: 'NotFound', detail: 'Asset not found' }],
          });
        });
      });
    });

    describe('when the params are invalid', () => {
      describe('and the collectionId is invalid', () => {
        const invalidCollectionId = 'carlos';

        let res: request.Response;

        beforeEach(async () => {
          res = await makeRequest(invalidCollectionId, validTokenId);
        });

        it('returns http Not Found response status', () => {
          expect(res.status).to.eql(404);
        });

        it('returns a NotFound error', () => {
          expect(res.body).to.eql({
            errors: [{ title: 'NotFound', detail: 'Collection not found' }],
          });
        });
      });

      describe('and the tokenId is invalid', () => {
        const invalidTokenId = 'carlos';

        let res: request.Response;

        beforeEach(async () => {
          res = await makeRequest(validCollectionId, invalidTokenId);
        });

        it('returns http Not Found response status', () => {
          expect(res.status).to.eql(404);
        });

        it('returns a NotFound error', () => {
          expect(res.body).to.eql({
            errors: [{ title: 'NotFound', detail: 'Token not found' }],
          });
        });
      });
    });
  });
});
