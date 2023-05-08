import { inject, injectable } from 'inversify';
import { Contract, Wallet } from 'ethers';

import settings from '../../config/settings';
import GamePortal from '../../abi/GamePortal.json';
import { GameRepository } from '../../repositories/GameRepository';
import { BlockchainProviderFactory } from '../BlockchainProviderFactory';

@injectable()
export class GamePortalContractFactory {
  @inject(GameRepository) gameRepository!: GameRepository;
  @inject(BlockchainProviderFactory) blockchainProviderFactory!: BlockchainProviderFactory;

  async call(gameId: string): Promise<Contract> {
    const { contractAddress: gamePortalAddress } = await this.gameRepository.findById(gameId);

    const provider = this.blockchainProviderFactory.apply(settings.blockchain.polygon.provider);
    const wallet = new Wallet(settings.blockchain.polygon.gamePortalKey, provider);

    return new Contract(gamePortalAddress, GamePortal.abi, wallet);
  }
}
