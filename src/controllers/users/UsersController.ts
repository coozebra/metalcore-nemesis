import { injectable, inject } from 'inversify';
import express, { NextFunction, Request, Response } from 'express';

import Game from '../../models/Game';
import { JwtIssuer } from '../../services/JwtIssuer';
import { UserLoginDTO } from '../../dto/UserLoginDTO';
import { HTTPBadRequestError } from '../../errors/http';
import { CreateAccountDTO } from '../../dto/CreateAccountDTO';
import { UserSerializer } from '../serializers/UserSerializer';
import { ErrorResponse } from '../../types/playfab/PlayFabTypes';
import { UserFactory } from '../../services/factories/UserFactory';
import { UserRepository } from '../../repositories/UserRepository';
import { AccountCreator } from '../../services/playfab/AccountCreator';
import { LoginAuthorizer } from '../../services/playfab/LoginAuthorizer';
import { UserLoginValidator } from '../../dto/validators/UserLoginValidator';
import { DisplayNameFetcher } from '../../services/playfab/DisplayNameFetcher';
import { CreateAccountValidator } from '../../dto/validators/CreateAccountValidator';
import { UserAuthenticationMiddleware } from '../../middlewares/UserAuthenticationMiddleware';

@injectable()
export class UsersController {
  @inject(CreateAccountValidator) private registerValidator: CreateAccountValidator;
  @inject(DisplayNameFetcher) private displayNameFetcher: DisplayNameFetcher;
  @inject(UserLoginValidator) private loginValidator: UserLoginValidator;
  @inject(LoginAuthorizer) private loginAuthorizer: LoginAuthorizer;
  @inject(AccountCreator) private accountCreator: AccountCreator;
  @inject(UserRepository) private userRepository: UserRepository;
  @inject(UserSerializer) private userSerializer: UserSerializer;
  @inject(UserFactory) private userFactory: UserFactory;
  @inject(JwtIssuer) private jwtIssuer: JwtIssuer;

  router: express.Application;

  constructor(@inject(UserAuthenticationMiddleware) userAuthenticationMiddleware: UserAuthenticationMiddleware) {
    this.router = express()
      .get('/', userAuthenticationMiddleware.apply, this.show)
      .post('/login', this.login)
      .post('/register', this.register);
  }

  private show = async (request: Request, response: Response): Promise<void> => {
    const accountId = response.locals.accountId;

    const user = await this.userRepository.findByAccountId(accountId);

    const displayName = await this.displayNameFetcher.apply(accountId);

    response.send({ data: this.userSerializer.apply(user, displayName) });
  };

  private login = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const { email, username, password } = request.body.data;
    const dto: UserLoginDTO = { email, username, password };

    const validationResult = this.loginValidator.apply(dto);

    if (!validationResult.isValid) {
      return next(new HTTPBadRequestError(validationResult.errors));
    }

    const authResponse = await this.loginAuthorizer.apply(dto);

    if (authResponse instanceof ErrorResponse) {
      return next(authResponse);
    }

    if (!authResponse.sessionTicket) {
      return next(new HTTPBadRequestError([{ detail: 'Could not login' }]));
    }

    const user = await this.userRepository.findByAccountId(authResponse.accountId);

    response.send({
      data: {
        id: user.id,
        accountId: authResponse.accountId,
        sessionTicket: authResponse.sessionTicket,
        jwt: email ? this.jwtIssuer.apply(email, authResponse.accountId) : '',
      },
    });
  };

  private register = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const { email, displayName, password } = request.body.data;
    const dto: CreateAccountDTO = { email, password, displayName };

    const validationResult = this.registerValidator.apply(dto);

    if (!validationResult.isValid) {
      return next(new HTTPBadRequestError(validationResult.errors));
    }

    const registerResult = await this.accountCreator.apply(dto);

    if (registerResult instanceof ErrorResponse) {
      return next(registerResult);
    }

    const game = await Game.findOne({ name: { $regex: 'MetalCore' } }); // TODO remove this for multi-game support

    const user = await this.userFactory.call(registerResult.accountId, game.key);
    const createdUser = await this.userRepository.create(user);

    response.status(201).send({ data: { ...createdUser, sessionTicket: registerResult.sessionTicket } });
  };
}
