const dns = require('dns').promises;

async function run() {
  const resolver = new dns.Resolver();
  // Use Google and Cloudflare public DNS
  resolver.setServers(['8.8.8.8', '1.1.1.1']);

  console.log('Resolving SRV records for _mongodb._tcp.dulcet.a62sz.mongodb.net...');
  try {
    const srvRecords = await resolver.resolveSrv('_mongodb._tcp.dulcet.a62sz.mongodb.net');
    console.log('SRV Records found:', srvRecords);

    console.log('\nResolving TXT records for dulcet.a62sz.mongodb.net...');
    const txtRecords = await resolver.resolveTxt('dulcet.a62sz.mongodb.net');
    console.log('TXT Records found:', txtRecords);

    // Build standard connection string
    // Standard format: mongodb://username:password@host1:port1,host2:port2/db?ssl=true&replicaSet=...
    const hosts = srvRecords.map(r => `${r.name}:${r.port}`).join(',');
    
    // Parse TXT records (typically contains replicaSet and authSource)
    let extraParams = 'ssl=true&authSource=%24external&authMechanism=MONGODB-X509'; // defaults
    if (txtRecords && txtRecords.length > 0) {
      const txtStr = txtRecords.flat().join('&');
      extraParams = txtStr;
    }
    
    console.log('\n--- SUGGESTED STANDARD CONNECTION STRING (replace password) ---');
    console.log(`mongodb://rit007:<PASSWORD>@${hosts}/?${extraParams}`);
    console.log('---------------------------------------------------------------\n');
  } catch (err) {
    console.error('Failed to resolve using public DNS:', err);
  }
}

run();
