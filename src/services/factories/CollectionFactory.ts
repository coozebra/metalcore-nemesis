import { inject, injectable } from 'inversify';

import { Collection, CollectionTypeMap } from '../../types';
import { GameRepository } from '../../repositories/GameRepository';
import { ContractAddressChecker } from '../ContractAddressChecker';
import { InvalidInputError } from '../../errors/application';

@injectable()
export class CollectionFactory {
  @inject(GameRepository) private gameRepository: GameRepository;
  @inject(ContractAddressChecker) private contractAddressChecker: ContractAddressChecker;

  async call(gameId: string, contractAddress: string, name: string, type: string): Promise<Collection> {
    const game = await this.gameRepository.findById(gameId);
    const validType = this.checkType(type);
    const validContractAddress = this.contractAddressChecker.apply(contractAddress);

    const collection: Collection = {
      gameId: game.id,
      contractAddress: validContractAddress,
      name: name,
      type: validType,
    };

    return collection;
  }

  private checkType(type: string): string {
    if (!Object.values(CollectionTypeMap).includes(type)) throw new InvalidInputError('Invalid collection type');

    return type;
  }
}
