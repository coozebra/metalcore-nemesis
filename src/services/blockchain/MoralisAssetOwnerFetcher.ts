import { inject, injectable } from 'inversify';
import { getAddress } from 'ethers/lib/utils';
import axios from 'axios';

import Settings from '../../types/Settings';
import { Logger } from '../../types/ILogger';

type NonDepositedAsset = {
  contractAddress: string;
  ownerAddress: string;
  tokenId: number;
};

type MoralisAsset = {
  token_id: string;
  owner_of: string;
  token_address: string;
};

type MoralisResponse = {
  result: MoralisAsset[];
};

const chainIdNameMap: Record<number, string> = {
  5: 'goerli',
};

const makeUrl = (contractAddress: string, chainName: string) =>
  `https://deep-index.moralis.io/api/v2/nft/${contractAddress}/owners?chain=${chainName}&format=decimal`;

@injectable()
export class MoralisAssetOwnerFetcher {
  @inject('Settings') settings: Settings;
  @inject('Logger') logger: Logger;

  async apply(contractAddress: string, walletAddress: string, chainId = 5): Promise<NonDepositedAsset[]> {
    try {
      const response = await axios.get(makeUrl(contractAddress, chainIdNameMap[chainId]), {
        headers: {
          'X-API-Key': this.settings.apiKeys.moralisApi,
        },
      });

      return this.filterByWallet(response.data, walletAddress);
    } catch (err) {
      this.logger.error(`Error fetching asset owners from Moralis.`);

      return [];
    }
  }

  private filterByWallet(response: MoralisResponse, walletAddress: string): NonDepositedAsset[] {
    return response.result
      .filter((asset) => getAddress(asset.owner_of) == walletAddress)
      .map((asset) => ({
        contractAddress: getAddress(asset.token_address),
        ownerAddress: getAddress(asset.owner_of),
        tokenId: parseInt(asset.token_id, 10),
      }));
  }
}
