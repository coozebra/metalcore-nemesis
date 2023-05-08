import { injectable } from 'inversify';
import { providers } from 'ethers';

@injectable()
export class BlockchainProviderFactory {
  apply(url: string): providers.BaseProvider {
    return providers.getDefaultProvider(url);
  }
}
