import { HTTPBaseError, JSONError } from './HTTPBaseError';

export class HTTPConflictError extends HTTPBaseError {
  constructor(errors: JSONError[]) {
    super(409, errors);
  }
}
