import { ethers, Signer } from 'ethers';
import { injectable } from 'inversify';
import { AssetSignatureDTO } from '../../types/IAssetSignature';

@injectable()
export class AssetSigner {
  async apply(
    { chainId, contractAddress, tokenId, walletAddress, nonce, signatureType }: AssetSignatureDTO,
    signer: Signer
  ): Promise<string> {
    const msgHash = ethers.utils.solidityKeccak256(
      ['string', 'uint256', 'address', 'uint256', 'address', 'uint256'],
      [signatureType, chainId, contractAddress, tokenId, walletAddress, nonce + 1]
    );

    const msgHashBinary = ethers.utils.arrayify(msgHash);
    const signature = await signer.signMessage(msgHashBinary);

    return signature;
  }
}
