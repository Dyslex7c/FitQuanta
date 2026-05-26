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
      origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    /* Register user as online */
    socket.on('user:online', (data: SocketUser) => {
      onlineUsers.set(data.userId, socket.id);
      socket.data.userId = data.userId;
      io.emit('users:online', Array.from(onlineUsers.keys()));
    });

    /* Join a conversation room */
    socket.on('conversation:join', (conversationId: string) => {
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
      io.to(`conv:${data.conversationId}`).emit('messages:seen', data);
    });

    /* Phone number request */
    socket.on('phone:request', (data: { toUserId: string; fromUserId: string; fromName: string }) => {
      const targetSocketId = onlineUsers.get(data.toUserId);
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
      if (targetSocketId) {
        io.to(targetSocketId).emit('phone:response', data);
      }
    });

    /* Notification */
    socket.on('notification:send', (data: { toUserId: string; message: string; type: string }) => {
      const targetSocketId = onlineUsers.get(data.toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('notification:receive', data);
      }
    });

    socket.on('disconnect', () => {
      if (socket.data.userId) {
        onlineUsers.delete(socket.data.userId);
        io.emit('users:online', Array.from(onlineUsers.keys()));
      }
    });
  });

  const PORT = parseInt(process.env.PORT ?? '3000', 10);
  httpServer.listen(PORT, () => {
    console.log(`> FitQuanta ready on http://localhost:${PORT}`);
  });
});
