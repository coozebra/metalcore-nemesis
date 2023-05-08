import { injectable, inject } from 'inversify';
import express, { NextFunction, Request, Response } from 'express';

import { UserAuthenticationMiddleware } from '../../middlewares/UserAuthenticationMiddleware';
import { WalletAddressStorer } from '../../services/WalletAddressStorer';
import { SignatureVerifier } from '../../services/SignatureVerifier';
import { HTTPBadRequestError } from '../../errors/http';

@injectable()
export class WalletsController {
  @inject(WalletAddressStorer) private walletAddressStorer: WalletAddressStorer;
  @inject(SignatureVerifier) private signatureVerifier: SignatureVerifier;

  router: express.Application;

  constructor(@inject(UserAuthenticationMiddleware) userAuthenticationMiddleware: UserAuthenticationMiddleware) {
    this.router = express().use(userAuthenticationMiddleware.apply).post('/', this.linkWallet);
  }

  linkWallet = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const { message, signature } = request.body.data;

    const validationObject = this.signatureVerifier.apply(message, signature);

    if (!validationObject.isValid) {
      return next(new HTTPBadRequestError([{ detail: 'Signature could not be verified' }]));
    }

    try {
      const user = await this.walletAddressStorer.apply(response.locals.accountId, validationObject.signerAddress);

      response.send({
        data: {
          accountId: user.accountId,
          walletAddress: user.walletAddress,
        },
      });
    } catch (e: any) {
      next(e);
    }
  };
}
