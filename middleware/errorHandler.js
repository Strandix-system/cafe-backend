import { ApiError } from '../utils/apiError.js';

export const notFoundError = (req, _, next) => {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;

  let message = err.message || 'Internal Server Error';

  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};
