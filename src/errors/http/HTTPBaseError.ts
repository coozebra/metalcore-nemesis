export type JSONError = {
  title?: string;
  detail?: string;
};

export class HTTPBaseError {
  status: number;
  errors: JSONError[];

  constructor(status: number, errors: JSONError[]) {
    this.status = status;
    this.errors = errors;
  }
}
