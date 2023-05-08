export interface AssetSignatureDTO {
  chainId: number;
  contractAddress: string;
  tokenId: number;
  walletAddress: string;
  nonce: number;
  signatureType: 'withdrawERC721' | 'depositERC721';
}

export interface IAssetSignature {
  message: AssetSignatureDTO;
  signature: string;
}
