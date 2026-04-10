import { ApiError } from '../utils/apiError.js';

export const notFoundError = (req, _, next) => {
  next(new ApiError(404, `Route not found - ${req.originalUrl}`));
};

export const errorHandler = (err, _req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  let statusCode = err.statusCode || 500;

  let message = err.message || 'Internal Server Error';

  if (!(err instanceof ApiError)) {
    statusCode = 500;
    message = err.message;
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};
