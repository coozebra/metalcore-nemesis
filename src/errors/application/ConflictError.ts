export class ConflictError extends Error {
  title: string;

  constructor(message: string, title = 'Conflict') {
    super(message);

    this.title = title;
  }
}
