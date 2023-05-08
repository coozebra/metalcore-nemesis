import { inject, injectable } from 'inversify';

import { ConflictError } from '../../errors/application';

import { GamePortalContractFactory } from '../factories/GamePortalContractFactory';
import { CollectionRepository } from '../../repositories/CollectionRepository';
import { AssetRepository } from '../../repositories/AssetRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { IAssetSignature, AssetSignatureDTO } from '../../types/IAssetSignature';
import { AssetSigner } from './AssetSigner';

@injectable()
export class AssetWithdrawer {
  @inject(AssetRepository) private assetRepository: AssetRepository;
  @inject(UserRepository) private userRepository: UserRepository;
  @inject(CollectionRepository) private collectionRepository: CollectionRepository;
  @inject(AssetSigner) private assetSigner: AssetSigner;

  @inject(GamePortalContractFactory) private gamePortalContractFactory: GamePortalContractFactory;

  async apply(assetId: string, accountId: string, chainId: number): Promise<IAssetSignature> {
    const { collectionId, tokenId, userId } = await this.assetRepository.findById(assetId);

    const [{ id, walletAddress }, { gameId, contractAddress }] = await Promise.all([
      this.userRepository.findByAccountId(accountId),
      this.collectionRepository.findById(collectionId),
    ]);

    if (id !== userId) throw new ConflictError('User is not the owner of the asset');

    if (!walletAddress) throw new ConflictError('User has no linked wallet address');

    const contract = await this.gamePortalContractFactory.call(gameId);

    const nonce = (await contract.nonces(walletAddress)).toNumber();

    const signatureDTO: AssetSignatureDTO = {
      chainId,
      contractAddress,
      tokenId,
      walletAddress,
      nonce,
      signatureType: 'withdrawERC721',
    };

    const signature = await this.assetSigner.apply(signatureDTO, contract.signer);

    return { message: signatureDTO, signature };
  }
}
