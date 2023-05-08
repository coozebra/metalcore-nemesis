import { HTTPBaseError, JSONError } from './HTTPBaseError';

export class HTTPNotFoundError extends HTTPBaseError {
  constructor(errors: JSONError[]) {
    super(404, errors);
  }
}
