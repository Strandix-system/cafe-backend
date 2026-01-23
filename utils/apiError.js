class ApiError extends Error {
    constructor(statusCode, message, err, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.err = err;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        };
    };
};

export { ApiError };
