// ...new file...
/**
 * Send a standard success response
 * @param {import('express').Response} res
 * @param {number} status
 * @param {string} message
 * @param {any} data
 */
function sendSuccessResponse(res, status = 200, message = "Success", data = null) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

/**
 * Optional helper for errors (named export)
 * @param {import('express').Response} res
 * @param {number} status
 * @param {string} message
 * @param {any} error
 */
export function sendErrorResponse(res, status = 500, message = "Error", error = null) {
  return res.status(status).json({
    success: false,
    message,
    error,
  });
}

export default sendSuccessResponse;
