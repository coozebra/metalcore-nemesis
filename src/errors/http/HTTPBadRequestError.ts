import { HTTPBaseError, JSONError } from './HTTPBaseError';

export class HTTPBadRequestError extends HTTPBaseError {
  constructor(errors: JSONError[]) {
    super(400, errors);
  }
}
