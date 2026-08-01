class ApiResponse {
  constructor(success, message, data = null) {
    this.success = success;
    this.message = message;
    this.data = data;
  }

  static success(message, data = null) {
    return new ApiResponse(true, message, data);
  }

  static error(message) {
    return new ApiResponse(false, message);
  }
}

export default ApiResponse;