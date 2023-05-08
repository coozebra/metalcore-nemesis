import 'reflect-metadata';
import sinon from 'sinon';
import { expect } from 'chai';

import { getTestContainer } from '../../../helpers/getTestContainer';
import { UserAssetDepositAssigner } from '../../../../src/services/userAsset/UserAssetDepositAssigner';
import { UserRepository } from '../../../../src/repositories/UserRepository';
import { AssetRepository } from '../../../../src/repositories/AssetRepository';
import { CollectionRepository } from '../../../../src/repositories/CollectionRepository';

describe('UserAssetDepositAssigner', () => {
  let userAssetDepositAssigner: UserAssetDepositAssigner;

  let userRepository: sinon.SinonStubbedInstance<UserRepository>;
  let assetRepository: sinon.SinonStubbedInstance<AssetRepository>;
  let collectionRepository: sinon.SinonStubbedInstance<CollectionRepository>;

  const collectionId = '1234';
  const collectionContractAddress = '0xc4d58cf543045fd55b9e8e89e884b6b2c76d4a02';
  const walletAddress = '0x165ae5775fa193997fEBb56fD812333e203C03b7';
  const tokenId = 32;

  beforeEach(async () => {
    const container = getTestContainer();

    container.bind(AssetRepository).toConstantValue((assetRepository = sinon.createStubInstance(AssetRepository)));

    container.bind(UserRepository).toConstantValue((userRepository = sinon.createStubInstance(UserRepository)));

    container
      .bind(CollectionRepository)
      .toConstantValue((collectionRepository = sinon.createStubInstance(CollectionRepository)));

    userAssetDepositAssigner = container.get(UserAssetDepositAssigner);
  });

  it('resolve all ids and pass them to assigner', async () => {
    userRepository.findByWalletAddress.withArgs(walletAddress).resolves({
      id: 'u1',
      walletAddress,
      accountId: 'a1',
      studioId: 's1',
      balances: {},
    });

    collectionRepository.findByContractAddress.withArgs(collectionContractAddress).resolves({
      id: collectionId,
      gameId: '5678',
      contractAddress: collectionContractAddress,
      name: 'Asset',
      type: 'erc-721',
    });

    await userAssetDepositAssigner.apply(collectionContractAddress, tokenId, walletAddress);

    await expect(assetRepository.setUserId.calledOnceWith(collectionId, tokenId, 'u1')).is.true;
  });
});
