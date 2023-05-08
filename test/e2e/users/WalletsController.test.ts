import sinon from 'sinon';
import axios from 'axios';
import { expect } from 'chai';
import { Wallet } from 'ethers';
import request from 'supertest';
import { Container } from 'inversify';
import { Application } from 'express';

import { expiredTicketAuth, invalidAuthTicket } from '../../fixtures/playFabFixtures';

import { SessionTicketAuthenticator } from '../../../src/services/playfab/SessionTicketAuthenticator';
import { ITicketAuthResponseSerialized } from '../../../src/types/playfab/PlayFabTypes';
import { setupUser, setupStudio, setupGame } from '../../controls/index';
import { getTestContainer } from '../../helpers/getTestContainer';
import { GameDocument } from '../../../src/models/Game';
import { UserDocument } from '../../../src/models/User';
import Server from '../../../src/lib/Server';

const signer = Wallet.createRandom();

const makeMessage = (walletAddress: string, timestamp: number) => `LinkWallet: ${walletAddress} ${timestamp}`;
const getTimeSeconds = () => Math.floor(Date.now() / 1000);

function createAuthStub(user: UserDocument, container: Container) {
  const tokenVerifier = container.get(SessionTicketAuthenticator);

  const stub = sinon.stub(tokenVerifier, 'apply').resolves({
    isSessionTicketExpired: false,
    userInfo: { accountId: user.accountId },
  } as ITicketAuthResponseSerialized);

  container.rebind(SessionTicketAuthenticator).toConstantValue(stub as unknown as SessionTicketAuthenticator);
}

describe('WalletsController', () => {
  const ROUTE = '/users/wallet';

  const container = getTestContainer();

  let server: Application;

  async function linkWallet(message: string, signer: Wallet) {
    const { status, body } = await request(server)
      .post(ROUTE)
      .set('Authorization', 'Bearer validToken')
      .send({
        data: {
          message: message,
          signature: await signer.signMessage(message),
        },
      });

    return { status, body };
  }

  describe('with invalid session ticket', () => {
    describe('when validator tells ticket is expired', () => {
      beforeEach(async () => {
        sinon.stub(axios, 'post').resolves({ status: 200, data: expiredTicketAuth });

        server = container.get(Server).app;
      });

      afterEach(() => {
        sinon.restore();
      });

      it('returns 401', async () => {
        const message = makeMessage(signer.address, getTimeSeconds());

        const { status, body } = await linkWallet(message, signer);

        expect(status).to.equal(401);
        expect(body).to.deep.equal({ errors: [{ detail: 'Authorization Error' }] });
      });
    });

    describe('when validator tells ticket is invalid', () => {
      beforeEach(async () => {
        sinon.stub(axios, 'post').rejects({ response: { status: 400, data: invalidAuthTicket } });
      });

      afterEach(() => {
        sinon.restore();
      });

      it('returns 401', async () => {
        const message = makeMessage(signer.address, getTimeSeconds());

        const { status, body } = await linkWallet(message, signer);

        expect(status).to.equal(401);
        expect(body).to.deep.equal({ errors: [{ title: 'InvalidSessionTicket', detail: 'InvalidSessionTicket' }] });
      });
    });
  });

  describe('with a valid session ticket', () => {
    let game: GameDocument;
    let user: UserDocument;

    beforeEach(async () => {
      game = await setupStudio().then(setupGame);
      user = await setupUser(game);

      createAuthStub(user, container);

      server = container.get(Server).app;
    });

    afterEach(() => {
      sinon.restore();
    });

    describe('with valid signature', () => {
      describe('and valid message', () => {
        describe('when user has no wallet linked', () => {
          it('links the wallet to the account id', async () => {
            const message = makeMessage(signer.address, getTimeSeconds());

            const { status, body } = await linkWallet(message, signer);

            expect(body).to.deep.equal({
              data: {
                accountId: user.accountId,
                walletAddress: signer.address,
              },
            });
            expect(status).to.equal(200);
          });
        });

        describe('when user has already linked a wallet', () => {
          it('returns Conflict error', async () => {
            const signer2 = Wallet.createRandom();

            const message = makeMessage(signer.address, getTimeSeconds());
            const message2 = makeMessage(signer2.address, getTimeSeconds());

            await linkWallet(message, signer);
            const { status, body } = await linkWallet(message2, signer2);

            expect(status).to.equal(409);
            expect(body).to.deep.equal({
              errors: [
                {
                  title: 'Conflict',
                  detail: 'User has already linked a wallet to their account',
                },
              ],
            });
          });
        });

        describe('when that wallet is already linked to another account', () => {
          let user2: UserDocument;

          afterEach(() => {
            sinon.restore();
          });

          it('returns Conflict error', async () => {
            const message = makeMessage(signer.address, getTimeSeconds());

            await linkWallet(message, signer);

            user2 = await setupStudio().then(setupGame).then(setupUser);
            createAuthStub(user2, container);

            const { status, body } = await linkWallet(message, signer);

            expect(status).to.equal(409);
            expect(body).to.deep.equal({
              errors: [
                {
                  title: 'Conflict',
                  detail: 'Wallet address already linked to an existing account',
                },
              ],
            });
          });
        });
      });

      describe('but sends an invalid message', () => {
        it('rejects the signature', async () => {
          const { status, body } = await linkWallet('', signer);

          expect(body).to.deep.equal({
            errors: [{ detail: 'Signature could not be verified' }],
          });
          expect(status).to.deep.equal(400);
        });
      });

      describe('but signed a message for another wallet address', () => {
        it('rejects the signature', async () => {
          const message = makeMessage(signer.address, getTimeSeconds());
          const signer2 = Wallet.createRandom();

          const { status, body } = await linkWallet(message, signer2);

          expect(body).to.deep.equal({
            errors: [{ detail: 'Signature could not be verified' }],
          });
          expect(status).to.deep.equal(400);
        });
      });

      describe('but their signature is too old', () => {
        it('rejects the signature', async () => {
          const message = makeMessage(signer.address, getTimeSeconds() - 61);

          const { status, body } = await linkWallet(message, signer);

          expect(body).to.deep.equal({
            errors: [{ detail: 'Signature could not be verified' }],
          });
          expect(status).to.deep.equal(400);
        });
      });
    });

    describe('with invalid signature format', () => {
      it('rejects the signature', async () => {
        const message = makeMessage(signer.address, getTimeSeconds());

        const { status, body } = await request(server)
          .post(ROUTE)
          .set('Authorization', 'Bearer validToken')
          .send({
            data: {
              message: message,
              signature: '0xNotASignature',
            },
          });

        expect(body).to.deep.equal({
          errors: [{ detail: 'Signature could not be verified' }],
        });
        expect(status).to.deep.equal(400);
      });
    });
  });
});
