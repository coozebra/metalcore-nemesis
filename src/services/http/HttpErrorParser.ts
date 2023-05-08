import createError from 'http-errors';

import {
  HTTPBaseError,
  HTTPConflictError,
  HTTPNotFoundError,
  HTTPBadRequestError,
  HTTPUnauthorizedError,
} from '../../errors/http';

import { ConflictError, InvalidInputError, NotFoundError, UnauthorizedError } from '../../errors/application';
import { ErrorResponse } from '../../types/playfab/PlayFabTypes';

export class HttpErrorParser {
  apply(error: any): HTTPBaseError | createError.HttpError {
    if (error instanceof createError.HttpError) {
      return error;
    }

    if (error instanceof ErrorResponse) {
      return new HTTPBaseError(error.status, [this.makeErrorDetails(error)]);
    }

    if (error.name === 'UserNotFound') {
      return new HTTPBadRequestError([{ title: error.name, detail: error.message }]);
    }

    if (error instanceof ConflictError) {
      return new HTTPConflictError([this.makeErrorDetails(error)]);
    }

    if (error instanceof NotFoundError) {
      return new HTTPNotFoundError([this.makeErrorDetails(error)]);
    }

    if (error instanceof InvalidInputError) {
      return new HTTPBadRequestError([this.makeErrorDetails(error)]);
    }

    if (error instanceof UnauthorizedError) {
      return new HTTPUnauthorizedError([this.makeErrorDetails(error)]);
    }

    if (error instanceof HTTPBaseError) {
      return error;
    }

    return new HTTPBaseError(500, [{ detail: 'Internal Server Error' }]);
  }

  private makeErrorDetails(error: any) {
    return {
      title: error.title,
      detail: error.message,
    };
  }
}
