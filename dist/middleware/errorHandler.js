"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createError = exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    let error = Object.assign({}, err);
    error.message = err.message;
    console.error(err);
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = Object.assign(Object.assign({}, error), { message, statusCode: 404 });
    }
    if (err.name === 'MongoError' && err.code === 11000) {
        const message = 'Duplicate field value entered';
        error = Object.assign(Object.assign({}, error), { message, statusCode: 400 });
    }
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        error = Object.assign(Object.assign({}, error), { message, statusCode: 400 });
    }
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = Object.assign(Object.assign({}, error), { message, statusCode: 401 });
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = Object.assign(Object.assign({}, error), { message, statusCode: 401 });
    }
    res.status(error.statusCode || 500).json(Object.assign({ success: false, error: error.message || 'Server Error' }, (process.env.NODE_ENV === 'development' && { stack: err.stack })));
};
exports.errorHandler = errorHandler;
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
};
exports.createError = createError;
//# sourceMappingURL=errorHandler.js.map