import { injectable } from 'inversify';

import { invalidContractAddressError } from '../errors/errors';

@injectable()
export class ContractAddressChecker {
  apply(contractAddress: string): string {
    const contractAddressRegex = /^0x[a-fA-F0-9]{40}$/;

    if (!contractAddressRegex.test(contractAddress)) throw invalidContractAddressError;

    return contractAddress;
  }
}
