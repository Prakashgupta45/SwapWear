"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COOKIE_OPTIONS = exports.AUTH_COOKIE_NAME = void 0;
exports.setAuthCookie = setAuthCookie;
exports.clearAuthCookie = clearAuthCookie;
const env_1 = require("../config/env");
exports.AUTH_COOKIE_NAME = 'swapwear_auth';
exports.COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env_1.env.isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
function setAuthCookie(res, token) {
    res.cookie(exports.AUTH_COOKIE_NAME, token, exports.COOKIE_OPTIONS);
}
function clearAuthCookie(res) {
    res.clearCookie(exports.AUTH_COOKIE_NAME, {
        httpOnly: true,
        secure: env_1.env.isProduction,
        sameSite: 'lax',
        path: '/',
    });
}
