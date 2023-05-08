import { inject, injectable } from 'inversify';
import Joi from 'joi';

import { UserLoginDTO } from '../UserLoginDTO';
import { ValidationErrorHandler } from '../../services/validators/ValidationErrorHandler';

const schema = Joi.object({
  email: Joi.string().email(),
  username: Joi.string(),
  password: Joi.string().required(),
})
  .xor('email', 'username')
  .options({ abortEarly: false });

@injectable()
export class UserLoginValidator {
  @inject(ValidationErrorHandler) errorHandler: ValidationErrorHandler;

  apply(dto: Partial<UserLoginDTO>) {
    const result = schema.validate(dto);

    return this.errorHandler.apply(result);
  }
}
