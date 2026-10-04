import { io, Socket } from 'socket.io-client';
import { tokenStorage } from './api';

let socket: Socket | null = null;

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  (process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:5000');

/**
 * Get or initialize the singleton Socket.IO connection
 */
export function getSocket(): Socket {
  if (!socket) {
    const token = tokenStorage.get();

    socket = io(SOCKET_SERVER_URL, {
      withCredentials: true,
      autoConnect: false,
      transports: ['websocket', 'polling'],
      auth: {
        token: token || undefined,
      },
    });
  } else {
    // Keep auth token fresh
    const token = tokenStorage.get();
    if (token) {
      socket.auth = { token };
    }
  }

  return socket;
}

/**
 * Disconnect and clear the socket instance
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
