import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketServer } from 'socket.io';

const dev  = process.env.NODE_ENV !== 'production';
const app  = next({ dev });
const handle = app.getRequestHandler();

interface SocketUser {
  userId: string;
  role:   string;
}

/* Map userId → socketId for targeting specific users */
const onlineUsers = new Map<string, string>();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow same-origin/no-origin requests (e.g. mobile apps, server-to-server, same-origin)
        if (!origin) return callback(null, true);
        
        const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        
        // Dynamically allow any origin in local development to avoid CORS blockages on custom hosts/IPs
        if (process.env.NODE_ENV !== 'production' || origin === allowedOrigin) {
          return callback(null, true);
        }
        
        console.warn(`[SOCKET CORS] Blocked connection from origin: ${origin}`);
        return callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET SERVER] Client connected: socket.id = ${socket.id}`);

    /* Register user as online */
    socket.on('user:online', (data: SocketUser) => {
      console.log(`[SOCKET SERVER] User registered online: userId = ${data.userId}, socketId = ${socket.id}`);
      onlineUsers.set(data.userId, socket.id);
      socket.data.userId = data.userId;
      const onlineUserList = Array.from(onlineUsers.keys());
      console.log(`[SOCKET SERVER] Online users count: ${onlineUserList.length}`);
      io.emit('users:online', onlineUserList);
    });

    /* Join a conversation room */
    socket.on('conversation:join', (conversationId: string) => {
      console.log(`[SOCKET SERVER] Client ${socket.id} (user: ${socket.data.userId || 'unknown'}) joining room: conv:${conversationId}`);
      socket.join(`conv:${conversationId}`);
    });

    /* Send a message */
    socket.on('message:send', (data: {
      conversationId: string;
      senderId: string;
      content: string;
      type: 'text' | 'image' | 'file';
      fileUrl?: string;
    }) => {
      console.log(`[SOCKET SERVER] Message sent in room conv:${data.conversationId} by ${data.senderId}`);
      io.to(`conv:${data.conversationId}`).emit('message:receive', {
        ...data,
        createdAt: new Date().toISOString(),
      });
    });

    /* Typing indicator */
    socket.on('typing:start', (data: { conversationId: string; userId: string; name: string }) => {
      socket.to(`conv:${data.conversationId}`).emit('typing:start', data);
    });
    socket.on('typing:stop', (data: { conversationId: string; userId: string }) => {
      socket.to(`conv:${data.conversationId}`).emit('typing:stop', data);
    });

    /* Mark messages as seen */
    socket.on('messages:seen', (data: { conversationId: string; userId: string }) => {
      console.log(`[SOCKET SERVER] Messages marked as seen in room conv:${data.conversationId} by user: ${data.userId}`);
      io.to(`conv:${data.conversationId}`).emit('messages:seen', data);
    });

    /* Phone number request */
    socket.on('phone:request', (data: { toUserId: string; fromUserId: string; fromName: string }) => {
      const targetSocketId = onlineUsers.get(data.toUserId);
      console.log(`[SOCKET SERVER] Phone request from ${data.fromUserId} to ${data.toUserId} (targetSocketId = ${targetSocketId || 'offline'})`);
      if (targetSocketId) {
        io.to(targetSocketId).emit('phone:request', data);
      }
    });

    /* Phone consent response */
    socket.on('phone:response', (data: {
      toUserId: string;
      approved: boolean;
      phoneNumber?: string;
      conversationId: string;
    }) => {
      const targetSocketId = onlineUsers.get(data.toUserId);
      console.log(`[SOCKET SERVER] Phone response to ${data.toUserId} (approved = ${data.approved}, targetSocketId = ${targetSocketId || 'offline'})`);
      if (targetSocketId) {
        io.to(targetSocketId).emit('phone:response', data);
      }
    });

    /* Notification */
    socket.on('notification:send', (data: { toUserId: string; message: string; type: string }) => {
      const targetSocketId = onlineUsers.get(data.toUserId);
      console.log(`[SOCKET SERVER] Send notification to ${data.toUserId} (targetSocketId = ${targetSocketId || 'offline'})`);
      if (targetSocketId) {
        io.to(targetSocketId).emit('notification:receive', data);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET SERVER] Client disconnected: socket.id = ${socket.id}, userId = ${socket.data.userId || 'unknown'}`);
      if (socket.data.userId) {
        onlineUsers.delete(socket.data.userId);
        const onlineUserList = Array.from(onlineUsers.keys());
        io.emit('users:online', onlineUserList);
      }
    });
  });

  const PORT = parseInt(process.env.PORT ?? '3000', 10);
  httpServer.listen(PORT, () => {
    console.log(`> FitQuanta ready on http://localhost:${PORT}`);
  });
});
