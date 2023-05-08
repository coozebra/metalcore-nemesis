import { HTTPBaseError, JSONError } from './HTTPBaseError';

export class HTTPUnauthorizedError extends HTTPBaseError {
  constructor(errors: JSONError[]) {
    super(401, errors);
  }
}
