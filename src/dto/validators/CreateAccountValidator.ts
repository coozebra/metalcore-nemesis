import { injectable, inject } from 'inversify';
import Joi from 'joi';

import { ValidationErrorHandler } from '../../services/validators/ValidationErrorHandler';
import { CreateAccountDTO } from '../CreateAccountDTO';

const schema = Joi.object({
  email: Joi.string().email().required(),
  displayName: Joi.string().alphanum().min(3).max(20).required(),
  password: Joi.string().min(8).max(32).required(),
}).options({ abortEarly: false });

@injectable()
export class CreateAccountValidator {
  @inject(ValidationErrorHandler) errorHandler: ValidationErrorHandler;

  apply(dto: Partial<CreateAccountDTO>) {
    const result = schema.validate(dto);

    return this.errorHandler.apply(result);
  }
}
