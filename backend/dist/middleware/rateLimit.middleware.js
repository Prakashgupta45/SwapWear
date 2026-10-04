"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRateLimiter = messageRateLimiter;
const userRequestMap = new Map();
// Cleanup stale records every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of userRequestMap.entries()) {
        if (now > record.resetAt) {
            userRequestMap.delete(key);
        }
    }
}, 5 * 60 * 1000).unref();
/**
 * In-memory rate limiter for chat messaging.
 * Allows up to 45 messages per 60 seconds per authenticated user.
 */
function messageRateLimiter(req, res, next) {
    const userId = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 45;
    let record = userRequestMap.get(userId);
    if (!record || now > record.resetAt) {
        record = { count: 1, resetAt: now + windowMs };
        userRequestMap.set(userId, record);
        return next();
    }
    if (record.count >= maxRequests) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000);
        res.status(429).json({
            success: false,
            message: `Rate limit exceeded. Please wait ${retryAfter} seconds before sending another message.`,
        });
        return;
    }
    record.count += 1;
    next();
}
