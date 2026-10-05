"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const env_1 = require("../config/env");
function errorHandler(err, _req, res, _next) {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    if (statusCode >= 500) {
        console.error('Server Internal Error:', err);
    }
    res.status(statusCode).json({
        success: false,
        message,
        ...(env_1.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
    });
}
