import { inject, injectable } from 'inversify';

import { Game } from '../../types';
import { ContractAddressChecker } from '../ContractAddressChecker';

export type Currencies = Record<string, string>;

@injectable()
export class GameFactory {
  @inject(ContractAddressChecker) private contractAddressChecker: ContractAddressChecker;

  call(gameName: string, studioId: string, chain: string, contractAddress: string, currencies: Currencies): Game {
    const game: Game = {
      name: gameName,
      studioId: studioId,
      chain: chain,
      contractAddress,
      currencies,
    };

    if (!this.isValid(game)) throw new Error('Invalid or incomplete Game Info');

    return game;
  }

  private isValid(object: Game): boolean {
    const validRoot = !Object.values(object).includes(undefined || '');
    const currencyAddresses = Object.values(object.currencies);
    const addresses = [object.contractAddress, ...currencyAddresses];

    addresses.forEach((address) => this.contractAddressChecker.apply(address));

    return validRoot;
  }
}
