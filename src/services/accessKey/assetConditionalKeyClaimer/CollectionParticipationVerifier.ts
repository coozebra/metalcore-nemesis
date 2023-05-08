import { inject, injectable } from 'inversify';

import { EthereumAssetContractFactory } from '../../factories/EthereumAssetContractFactory';

@injectable()
export class CollectionParticipationVerifier {
  @inject(EthereumAssetContractFactory) ethereumAssetContractFactory: EthereumAssetContractFactory;

  async apply(contractAddress: string, walletAddress: string): Promise<boolean> {
    const contract = this.ethereumAssetContractFactory.apply(contractAddress);

    if (!(await contract.balanceOf(walletAddress)).toNumber()) return false;

    return true;
  }
}
