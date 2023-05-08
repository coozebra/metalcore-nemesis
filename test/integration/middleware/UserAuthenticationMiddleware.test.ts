import chai from 'chai';
import sinon from 'sinon';
import axios from 'axios';
import { NextFunction, Request, response, Response } from 'express';

import Application from '../../../src/lib/Application';
import { expiredTicketAuth, nonExpiredTicketAuth } from '../../fixtures/playFabFixtures';
import { UserAuthenticationMiddleware } from '../../../src/middlewares/UserAuthenticationMiddleware';

describe('UserAuthenticationMiddleware', () => {
  const authMiddleware = Application.get(UserAuthenticationMiddleware);

  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const nextFunction: NextFunction = () => {
    return;
  };
  const expect = chai.expect;

  before(async () => {
    mockRequest = {
      headers: {
        authorization: 'veryValidToken',
      },
    };
    mockResponse = { ...response, locals: {} };
  });

  describe('#apply', async () => {
    describe('with an invalid ticket', () => {
      it('returns a UnauthorizedError', async () => {
        const authFunction = () =>
          authMiddleware.apply(
            { ...mockRequest, headers: { authorization: '' } } as Request,
            mockResponse as Response,
            nextFunction
          );

        await expect(authFunction()).to.be.rejectedWith('Authorization Error');
      });
    });

    describe('with a non expired ticket', () => {
      beforeEach(async () => {
        sinon.stub(axios, 'post').resolves({ status: 200, data: nonExpiredTicketAuth });
      });

      afterEach(() => {
        sinon.restore();
      });

      it('resolves calling the next step', async () => {
        const authFunction = () => authMiddleware.apply(mockRequest as Request, mockResponse as Response, nextFunction);

        await expect(authFunction()).to.be.fulfilled;
      });
    });

    describe('with an expired ticket', () => {
      beforeEach(async () => {
        sinon.stub(axios, 'post').resolves({ status: 200, data: expiredTicketAuth });
      });

      afterEach(() => {
        sinon.restore();
      });

      it('returns a UnauthorizedError', async () => {
        const authFunction = () => authMiddleware.apply(mockRequest as Request, mockResponse as Response, nextFunction);

        await expect(authFunction()).to.be.rejectedWith('Authorization Error');
      });
    });
  });
});
