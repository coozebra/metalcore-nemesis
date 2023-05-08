export class InvalidInputError extends Error {
  title: string;

  constructor(message: string, title = 'InvalidInput') {
    super(message);

    this.title = title;
  }
}
