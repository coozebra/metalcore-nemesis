import { Contract } from 'ethers';
import { inject, injectable } from 'inversify';

import Asset from '../../abi/Asset.json';
import settings from '../../config/settings';
import { BlockchainProviderFactory } from '../BlockchainProviderFactory';

@injectable()
export class EthereumAssetContractFactory {
  @inject(BlockchainProviderFactory) blockchainProviderFactory: BlockchainProviderFactory;

  apply(address: string): Contract {
    const provider = this.blockchainProviderFactory.apply(settings.blockchain.ethereum.provider);
    const contract = new Contract(address, Asset.abi, provider);

    return contract;
  }
}
