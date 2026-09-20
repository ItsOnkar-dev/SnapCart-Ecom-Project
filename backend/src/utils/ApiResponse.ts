export class ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;

  constructor(statusCode: number, message: string, data?: T) {
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
  }
}

export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
