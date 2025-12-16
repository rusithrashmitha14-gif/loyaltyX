const net = require('net');

const host = 'db.rehqncmqjfbatmtujnee.supabase.co';
const ports = [5432, 6543];

console.log(`Resolving and testing connection to ${host}...`);

ports.forEach(port => {
    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.on('connect', () => {
        console.log(`✅ SUCCESS: Connected to ${host}:${port}`);
        socket.destroy();
    });

    socket.on('timeout', () => {
        console.log(`❌ TIMEOUT: Could not connect to ${host}:${port}`);
        socket.destroy();
    });

    socket.on('error', (err) => {
        console.log(`❌ ERROR connecting to ${host}:${port}:`, err.message);
    });

    console.log(`Attempting connection to port ${port}...`);
    socket.connect(port, host);
});
