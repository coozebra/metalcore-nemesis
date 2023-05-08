import { injectable } from 'inversify';
import Joi from 'joi';

interface FailureObject {
  attribute: string;
  detail: string;
}

interface ValidationResponse {
  isValid: boolean;
  errors?: FailureObject[];
}

@injectable()
export class ValidationErrorHandler {
  apply(validationResult: Joi.ValidationResult<any>): ValidationResponse {
    if (!validationResult.error) {
      return { isValid: true };
    }

    const failureObjects = validationResult.error.details.map((error) => ({
      attribute: error.context.label,
      detail: error.message,
    }));

    return { isValid: false, errors: failureObjects };
  }
}
