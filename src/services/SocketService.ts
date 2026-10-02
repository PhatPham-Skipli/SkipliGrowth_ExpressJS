import { Server as HttpServer } from 'http';
import logger from 'jet-logger';
import { Server } from 'socket.io';

import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '@src/common/types/socket';
import UserRepo from '@src/repos/UserRepo';
import JwtService, { IJwtPayload } from '@src/services/JwtService';

let io: Server<ClientToServerEvents, ServerToClientEvents> | null = null;

export function initSocket(server: HttpServer): void {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket, next) => {
    void (async () => {
      try {
        let token = socket.handshake.auth?.token as string | undefined;

        // Fallback to handshake cookies if auth token is missing
        if (!token && socket.handshake.headers.cookie) {
          const cookies = socket.handshake.headers.cookie.split(';').reduce(
            (acc, item) => {
              const [k, v] = item.trim().split('=');
              if (k && v) acc[k] = decodeURIComponent(v);
              return acc;
            },
            {} as Record<string, string>,
          );
          token = cookies.accessToken;
        }

        if (!token) {
          return next(new Error('Authentication error: Token missing'));
        }

        const decoded = await JwtService.verify<IJwtPayload>(token);
        if (decoded && decoded.userId) {
          const user = await UserRepo.getById(decoded.userId);
          if (!user) {
            return next(new Error('Authentication error: User not found'));
          }
          if (user.isBanned) {
            return next(
              new Error(
                user.banReason || 'Authentication error: Account is banned',
              ),
            );
          }
          // Attach userId to socket for later use
          (socket.data as { userId: string }).userId = decoded.userId;
          next();
        } else {
          next(new Error('Authentication error: Invalid token'));
        }
      } catch (_error) {
        next(new Error('Authentication error'));
      }
    })();
  });

  io.on('connection', (socket) => {
    const userId = (socket.data as { userId: string }).userId;
    logger.info(`Socket connected: User ${userId} (${socket.id})`);

    // Automatically join a personal room for direct user notifications
    void socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: User ${userId} (${socket.id})`);
    });
  });
}

// ---------------------------------------------------------
// Strongly-Typed Emit Functions
// ---------------------------------------------------------

export function emitOrderFunded(
  sellerId: string,
  payload: { orderId: string; orderNumber: string; amount: number },
) {
  io?.to(`user:${sellerId}`).emit('order:funded', payload);
}

export function emitOrderPaid(
  buyerId: string,
  payload: { orderId: string; orderNumber: string },
) {
  io?.to(`user:${buyerId}`).emit('order:paid', payload);
}

export function getIO() {
  return io;
}

export default {
  initSocket,
  getIO,
  emitOrderFunded,
  emitOrderPaid,
};
