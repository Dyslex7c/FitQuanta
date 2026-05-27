import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000');
    console.log('[SOCKET] Initializing socket connection to:', url);
    socket = io(url, {
      autoConnect: false,
      withCredentials: true,
    });
  }
  return socket;
}

export function connectSocket(userId: string, role: string): Socket {
  const s = getSocket();
  
  // Clean up any previous 'connect' listeners to prevent duplicate handler registrations
  s.off('connect');
  
  // Register connect handler to ensure online status is sent on initial connect AND automatic reconnects
  s.on('connect', () => {
    console.log('[SOCKET] Socket connected, registering user as online:', userId);
    s.emit('user:online', { userId, role });
  });

  if (!s.connected) {
    console.log('[SOCKET] Connecting socket...');
    s.connect();
  } else {
    console.log('[SOCKET] Socket already connected, emitting user:online...');
    s.emit('user:online', { userId, role });
  }
  return s;
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    console.log('[SOCKET] Disconnecting socket...');
    socket.disconnect();
  }
}

