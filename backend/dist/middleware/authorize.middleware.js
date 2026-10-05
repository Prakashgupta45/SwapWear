"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
exports.authorizeRoles = authorizeRoles;
const auth_middleware_1 = require("./auth.middleware");
function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient permissions to access this resource.',
            });
            return;
        }
        next();
    };
}
exports.requireAdmin = [auth_middleware_1.authenticate, authorizeRoles('ADMIN')];
