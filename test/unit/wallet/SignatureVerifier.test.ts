import { expect } from 'chai';
import { Wallet } from 'ethers';

import { SignatureVerifier } from '../../../src/services/SignatureVerifier';

const makeMessage = (walletAddress: string, timestamp: number) => `LinkWallet: ${walletAddress} ${timestamp}`;
const getTimeSeconds = () => Math.floor(Date.now() / 1000);

describe('SignatureVerifier', () => {
  const signatureVerifier = new SignatureVerifier();
  const signer = Wallet.createRandom();

  describe('#apply', () => {
    describe('with valid message format', () => {
      describe('when the message is properly signed', () => {
        it('returns true', async () => {
          const message = makeMessage(signer.address, getTimeSeconds());
          const signature = await signer.signMessage(message);

          const result = signatureVerifier.apply(message, signature);

          expect(result).to.deep.equal({
            isValid: true,
            signerAddress: signer.address,
          });
        });
      });

      describe('if someone else signed the message', () => {
        const signer2 = Wallet.createRandom();

        it('returns false', async () => {
          const message = makeMessage(signer.address, getTimeSeconds());
          const signature = await signer2.signMessage(message);

          const result = signatureVerifier.apply(message, signature);

          expect(result).to.deep.equal({
            isValid: false,
            signerAddress: signer2.address,
          });
        });
      });

      describe('if the signature is too old', () => {
        it('returns false', async () => {
          const message = makeMessage(signer.address, getTimeSeconds() - 61);
          const signature = await signer.signMessage(message);

          const result = signatureVerifier.apply(message, signature);

          expect(result).to.deep.equal({
            isValid: false,
            signerAddress: signer.address,
          });
        });
      });
    });

    describe('with invalid message format', () => {
      const wrongMessage = 'Wrong Message';

      it('returns false', async () => {
        const signature = await signer.signMessage(wrongMessage);

        const result = signatureVerifier.apply(wrongMessage, signature);

        expect(result).to.deep.equal({
          isValid: false,
          signerAddress: signer.address,
        });
      });
    });
  });
});
