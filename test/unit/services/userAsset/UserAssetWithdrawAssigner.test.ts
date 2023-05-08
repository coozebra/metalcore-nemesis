import 'reflect-metadata';
import sinon from 'sinon';
import { expect } from 'chai';

import { getTestContainer } from '../../../helpers/getTestContainer';
import { UserAssetWithdrawAssigner } from '../../../../src/services/userAsset/UserAssetWithdrawAssigner';
import { AssetRepository } from '../../../../src/repositories/AssetRepository';
import { CollectionRepository } from '../../../../src/repositories/CollectionRepository';

describe('UserAssetWithdrawAssigner', () => {
  let userAssetWithdrawAssigner: UserAssetWithdrawAssigner;

  let assetRepository: sinon.SinonStubbedInstance<AssetRepository>;
  let collectionRepository: sinon.SinonStubbedInstance<CollectionRepository>;

  const collectionId = '1234';
  const collectionContractAddress = '0xc4d58cf543045fd55b9e8e89e884b6b2c76d4a02';
  const tokenId = 32;

  beforeEach(async () => {
    const container = getTestContainer();

    container.bind(AssetRepository).toConstantValue((assetRepository = sinon.createStubInstance(AssetRepository)));

    container
      .bind(CollectionRepository)
      .toConstantValue((collectionRepository = sinon.createStubInstance(CollectionRepository)));

    userAssetWithdrawAssigner = container.get(UserAssetWithdrawAssigner);
  });

  it('resolve all ids and pass them to assigner', async () => {
    collectionRepository.findByContractAddress.withArgs(collectionContractAddress).resolves({
      id: collectionId,
      gameId: '5678',
      contractAddress: collectionContractAddress,
      name: 'Asset',
      type: 'erc-721',
    });

    await userAssetWithdrawAssigner.apply(collectionContractAddress, tokenId);

    await expect(assetRepository.setUserId.calledOnceWith(collectionId, tokenId, null)).is.true;
  });
});
