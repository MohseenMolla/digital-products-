export class AppError extends Error {
  constructor(public status: number, message: string, public errorCode: string = 'ERROR') {
    super(message);
  }
}
