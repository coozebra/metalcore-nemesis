export class UnauthorizedError extends Error {
  title: string;

  constructor(message: string, title = 'Unauthorized') {
    super(message);

    this.title = title;
  }
}
