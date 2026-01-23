const sendSuccessResponse = (res, statusCode, message, result) => {
    return res.status(statusCode).json({
        success: true,
        message: message,
        result: result
    });
};

export {
    sendSuccessResponse
};
