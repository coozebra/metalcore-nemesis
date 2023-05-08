import { inject, injectable } from 'inversify';
import { utils } from 'ethers';

import { Logger } from '../types/ILogger';

const ONE_MINUTE = 60;

type VerificationResultObject = {
  isValid: boolean;
  signerAddress: string;
};

@injectable()
export class SignatureVerifier {
  @inject('Logger') logger!: Logger;

  apply(message: string, signature: string): VerificationResultObject {
    try {
      const signerAddress = utils.verifyMessage(message, signature);

      const isValid = this.checkClaim(message, signerAddress);

      return { isValid, signerAddress };
    } catch {
      return { isValid: false, signerAddress: '' };
    }
  }

  private checkClaim(message: string, signerAddress: string) {
    const [, claimer, timestamp] = message.split(' ');

    const timeNow = Math.floor(Date.now() / 1000);

    return claimer === signerAddress && timeNow - Number(timestamp) <= ONE_MINUTE;
  }
}
