import { inject, injectable } from 'inversify';
import { BigNumber, Contract } from 'ethers';

import GamePortal from '../abi/GamePortal.json';
import { UserResourceDepositIncrementor } from '../services/userResource/UserResourceDepositIncrementor';
import { CollectionRepository } from '../repositories/CollectionRepository';
import ContractScanWorker from './ContractScanWorker';

@injectable()
class ResourceDepositWorker extends ContractScanWorker {
  @inject(UserResourceDepositIncrementor) userResourceDepositIncrementor!: UserResourceDepositIncrementor;

  @inject(CollectionRepository) collectionRepository!: CollectionRepository;

  async processTransactions(contractAddress: string, fromBlock: number, toBlock: number): Promise<void> {
    const { id: collectionId } = await this.collectionRepository.findByContractAddress(contractAddress);

    const provider = this.blockchainProviderFactory.apply(this.providerUrl);

    const contract = new Contract(contractAddress, GamePortal.abi, provider);
    const events = await contract.queryFilter(contract.filters.LogERC1155Deposited(), fromBlock, toBlock);

    await Promise.all(
      events.map((event) => {
        const { transactionHash: txId, blockNumber, args } = event;
        const { account, amount, tokenId } = args;

        return this.userResourceDepositIncrementor.apply(
          collectionId,
          BigNumber.from(tokenId).toNumber(),
          BigNumber.from(amount).toNumber(),
          account,
          txId,
          blockNumber
        );
      })
    );
  }
}

export default ResourceDepositWorker;
