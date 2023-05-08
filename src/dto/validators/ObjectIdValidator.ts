import { inject, injectable } from 'inversify';
import Joi from 'joi';

import { ValidationErrorHandler } from '../../services/validators/ValidationErrorHandler';

const schema = Joi.string().hex().length(24).required();

@injectable()
export class ObjectIdValidator {
  @inject(ValidationErrorHandler) errorHandler: ValidationErrorHandler;

  apply(id: string) {
    const result = schema.validate(id);

    return this.errorHandler.apply(result);
  }
}
