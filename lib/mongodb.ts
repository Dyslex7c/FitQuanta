import mongoose from 'mongoose';
import { env } from './env';
import dns from 'dns';

declare global {
  var mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

if (!global.mongooseConn) {
  global.mongooseConn = { conn: null, promise: null };
}

// Helper function to resolve mongodb+srv:// to standard mongodb:// using a custom DNS Resolver.
// This is necessary because in Next.js worker threads, process-wide dns.setServers has no effect.
async function resolveMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith('mongodb+srv://')) {
    return uri;
  }

  const match = uri.match(/^mongodb\+srv:\/\/([^@]+)@([^/?]+)([^?]*)(.*)$/);
  if (!match || !match[1] || !match[2]) {
    throw new Error('Invalid MongoDB SRV URI format');
  }

  const auth = match[1];
  const host = match[2];
  const dbPath = match[3] || '/';
  const options = match[4] || '';

  const resolver = new dns.Resolver();
  // Use public, reliable DNS servers to resolve MongoDB SRV records.
  resolver.setServers(['8.8.8.8', '1.1.1.1']);

  // Resolve SRV records
  const srvPromise = new Promise<dns.SrvRecord[]>((resolve, reject) => {
    resolver.resolveSrv(`_mongodb._tcp.${host}`, (err, addresses) => {
      if (err) reject(err);
      else resolve(addresses);
    });
  });

  // Resolve TXT records (contains replicaSet, authSource, etc. settings)
  const txtPromise = new Promise<string[][]>((resolve) => {
    resolver.resolveTxt(host, (err, records) => {
      if (err) {
        resolve([]);
      } else {
        resolve(records);
      }
    });
  });

  const [addresses, txtRecords] = await Promise.all([srvPromise, txtPromise]);

  if (!addresses || addresses.length === 0) {
    throw new Error(`No SRV records found for host: ${host}`);
  }

  // Format resolved hosts into standard comma-separated host:port string
  const hosts = addresses.map((addr) => `${addr.name}:${addr.port}`).join(',');

  // Parse TXT options
  let txtOpts = '';
  if (txtRecords && txtRecords.length > 0) {
    const flatRecords = txtRecords.flat();
    txtOpts = flatRecords.join('&');
  }

  // Merge options (standard connection via mongodb:// requires ssl=true for Atlas)
  let mergedOptions = 'ssl=true';
  if (txtOpts) {
    mergedOptions += '&' + txtOpts;
  }
  if (options) {
    const cleanOpts = options.startsWith('?') ? options.slice(1) : options;
    if (cleanOpts) {
      mergedOptions += '&' + cleanOpts;
    }
  }

  const resolvedUri = `mongodb://${auth}@${hosts}${dbPath}?${mergedOptions}`;
  return resolvedUri;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (global.mongooseConn.conn) return global.mongooseConn.conn;
  if (!global.mongooseConn.promise) {
    global.mongooseConn.promise = (async () => {
      let connectionUri = env.MONGODB_URI;
      try {
        connectionUri = await resolveMongoUri(connectionUri);
      } catch (dnsErr) {
        console.warn('Failed to dynamically resolve MongoDB SRV URI, falling back to original:', dnsErr);
      }
      return mongoose.connect(connectionUri, {
        bufferCommands: false,
      });
    })().catch((err) => {
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
