import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000', {
      autoConnect: false,
      withCredentials: true,
    });
  }
  return socket;
}

export function connectSocket(userId: string, role: string): Socket {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
    s.emit('user:online', { userId, role });
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
