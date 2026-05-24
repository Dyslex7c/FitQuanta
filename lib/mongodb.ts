import mongoose from 'mongoose';
import { env } from './env';

declare global {
  var mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

if (!global.mongooseConn) {
  global.mongooseConn = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  const MONGODB_URI = env.MONGODB_URI;
  if (global.mongooseConn.conn) return global.mongooseConn.conn;
  if (!global.mongooseConn.promise) {
    global.mongooseConn.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).catch((err) => {
      global.mongooseConn.promise = null;
      throw err;
    });
  }
  try {
    global.mongooseConn.conn = await global.mongooseConn.promise;
  } catch (err) {
    global.mongooseConn.promise = null;
    throw err;
  }
  return global.mongooseConn.conn;
}

