export class NotFoundError extends Error {
  title: string;

  constructor(message: string, title = 'NotFound') {
    super(message);

    this.title = title;
  }
}
