// This class creates a standard format for ALL success responses in your app
// Instead of writing { success: true, message: "...", data: ... } everywhere manually
// You just do: new ApiResponse(200, "message", data)
export class ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;

  constructor(statusCode: number, message: string, data?: T) {
    this.success = statusCode < 400; // if status is less than 400, it's a success
    this.message = message;
    this.data = data;
  }
}

// This class creates a standard format for ALL error responses
// Instead of handling errors differently everywhere, every error looks the same
export class ApiError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message); // calls the built-in Error class with your message
    this.statusCode = statusCode;
  }
}
