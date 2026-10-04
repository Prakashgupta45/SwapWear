"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = initSocketServer;
exports.getIO = getIO;
exports.closeIO = closeIO;
const socket_io_1 = require("socket.io");
const env_1 = require("../config/env");
const cookie_1 = require("../utils/cookie");
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../config/prisma");
const chat_service_1 = require("../services/chat.service");
let io = null;
// Track online users per swap request room: Map<swapRequestId, Set<userId>>
const roomPresence = new Map();
// Track sockets per user: Map<userId, Set<socketId>>
const userSockets = new Map();
/**
 * Extract token from Socket.IO handshake (cookies, auth payload, or headers)
 */
function extractToken(socket) {
    // 1. Auth payload
    if (socket.handshake.auth && typeof socket.handshake.auth.token === 'string') {
        return socket.handshake.auth.token;
    }
    // 2. Authorization header
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // 3. Cookie header
    const cookieHeader = socket.handshake.headers.cookie;
    if (cookieHeader) {
        const cookies = cookieHeader.split(';').map((c) => c.trim());
        for (const cookie of cookies) {
            if (cookie.startsWith(`${cookie_1.AUTH_COOKIE_NAME}=`)) {
                return decodeURIComponent(cookie.substring(cookie_1.AUTH_COOKIE_NAME.length + 1));
            }
        }
    }
    return null;
}
/**
 * Initialize the Socket.IO server attached to HTTP server
 */
function initSocketServer(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.env.FRONTEND_URL,
            credentials: true,
            methods: ['GET', 'POST'],
        },
        pingTimeout: 60000,
        pingInterval: 25000,
    });
    // Socket.IO authentication middleware
    io.use(async (socket, next) => {
        try {
            const token = extractToken(socket);
            if (!token) {
                return next(new Error('Authentication required: No token provided'));
            }
            let decoded;
            try {
                decoded = (0, jwt_1.verifyJwt)(token);
            }
            catch {
                return next(new Error('Authentication failed: Invalid or expired token'));
            }
            const user = await prisma_1.prisma.user.findUnique({
                where: { id: decoded.userId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!user) {
                return next(new Error('Authentication failed: User no longer exists'));
            }
            socket.data.user = user;
            next();
        }
        catch (err) {
            next(new Error('Socket authentication internal error'));
        }
    });
    io.on('connection', (rawSocket) => {
        const socket = rawSocket;
        const user = socket.data.user;
        // Track user socket
        if (!userSockets.has(user.id)) {
            userSockets.set(user.id, new Set());
        }
        userSockets.get(user.id).add(socket.id);
        /**
         * Join private swap room: swap:<swapRequestId>
         */
        socket.on('join:swap', async (payload, callback) => {
            try {
                const { swapRequestId } = payload || {};
                if (!swapRequestId) {
                    callback?.({ success: false, message: 'swapRequestId is required.' });
                    return;
                }
                // Strict authorization check: Only requester or recipient can join
                await chat_service_1.ChatService.verifySwapMembership(swapRequestId, user.id);
                const roomName = `swap:${swapRequestId}`;
                await socket.join(roomName);
                // Update room presence
                if (!roomPresence.has(swapRequestId)) {
                    roomPresence.set(swapRequestId, new Set());
                }
                roomPresence.get(swapRequestId).add(user.id);
                const onlineUserIds = Array.from(roomPresence.get(swapRequestId));
                // Broadcast updated presence to everyone in the room
                io?.to(roomName).emit('presence:update', {
                    swapRequestId,
                    onlineUserIds,
                });
                callback?.({ success: true, onlineUserIds });
            }
            catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to join swap chat.';
                socket.emit('error', { message });
                callback?.({ success: false, message });
            }
        });
        /**
         * Leave swap room
         */
        socket.on('leave:swap', async (payload) => {
            try {
                const { swapRequestId } = payload || {};
                if (!swapRequestId)
                    return;
                const roomName = `swap:${swapRequestId}`;
                socket.leave(roomName);
                // Check if user has other active sockets in this room
                const room = roomPresence.get(swapRequestId);
                if (room) {
                    room.delete(user.id);
                    const onlineUserIds = Array.from(room);
                    io?.to(roomName).emit('presence:update', {
                        swapRequestId,
                        onlineUserIds,
                    });
                }
            }
            catch {
                // Ignore leave errors
            }
        });
        /**
         * Send real-time message via socket
         */
        socket.on('message:send', async (payload, callback) => {
            try {
                const { swapRequestId, content } = payload || {};
                if (!swapRequestId || !content) {
                    callback?.({ success: false, error: 'swapRequestId and content are required.' });
                    return;
                }
                // Service handles verification, sanitization, and DB persistence
                const message = await chat_service_1.ChatService.createMessage(swapRequestId, user.id, content);
                callback?.({ success: true, data: message });
            }
            catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Failed to send message.';
                callback?.({ success: false, error: errorMsg });
            }
        });
        /**
         * Typing indicators
         */
        socket.on('typing:start', async (payload) => {
            try {
                const { swapRequestId } = payload || {};
                if (!swapRequestId)
                    return;
                // Verify membership before broadcasting typing indicator
                await chat_service_1.ChatService.verifySwapMembership(swapRequestId, user.id);
                socket.to(`swap:${swapRequestId}`).emit('typing:start', {
                    swapRequestId,
                    userId: user.id,
                    userName: user.name,
                });
            }
            catch {
                // Ignore typing authorization errors
            }
        });
        socket.on('typing:stop', (payload) => {
            const { swapRequestId } = payload || {};
            if (!swapRequestId)
                return;
            socket.to(`swap:${swapRequestId}`).emit('typing:stop', {
                swapRequestId,
                userId: user.id,
            });
        });
        /**
         * Disconnect handler
         */
        socket.on('disconnecting', () => {
            // Remove from user sockets tracking
            const userSocketsSet = userSockets.get(user.id);
            if (userSocketsSet) {
                userSocketsSet.delete(socket.id);
                if (userSocketsSet.size === 0) {
                    userSockets.delete(user.id);
                }
            }
            // Check all joined swap rooms and update presence
            for (const roomName of socket.rooms) {
                if (roomName.startsWith('swap:')) {
                    const swapRequestId = roomName.substring(5);
                    const roomUsers = roomPresence.get(swapRequestId);
                    if (roomUsers) {
                        // Check if user has other active sockets
                        const stillHasActiveSockets = userSockets.has(user.id);
                        if (!stillHasActiveSockets) {
                            roomUsers.delete(user.id);
                        }
                        const onlineUserIds = Array.from(roomUsers);
                        socket.to(roomName).emit('presence:update', {
                            swapRequestId,
                            onlineUserIds,
                        });
                    }
                }
            }
        });
    });
    return io;
}
/**
 * Access the active Socket.IO server instance
 */
function getIO() {
    return io;
}
/**
 * Close Socket.IO server (for tests and clean shutdown)
 */
function closeIO() {
    return new Promise((resolve) => {
        if (io) {
            io.close(() => {
                io = null;
                resolve();
            });
        }
        else {
            resolve();
        }
    });
}
