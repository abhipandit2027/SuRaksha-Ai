import('vite').then(async (vite) => {
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const logPath = path.join(__dirname, 'vite-runtime.log');
  let logStream = fs.createWriteStream(logPath, { flags: 'a' });

  function writeLog(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    logStream.write(line);
    process.stdout.write(line);
  }

  process.on('uncaughtException', (err) => {
    writeLog('UNCAUGHT EXCEPTION: ' + err.message);
    writeLog(err.stack);
  });
  process.on('unhandledRejection', (err) => {
    writeLog('UNHANDLED REJECTION: ' + (err && err.message ? err.message : String(err)));
    if (err && err.stack) writeLog(err.stack);
  });

  writeLog('========================================');
  writeLog('Starting SuRaksha AI Dev Server');
  writeLog('Node: ' + process.version);
  writeLog('========================================');

  const server = await vite.createServer({
    server: {
      host: '0.0.0.0',
      port: 8080,
      strictPort: false,
    },
  });

  writeLog('Vite server created. Starting listen...');
  await server.listen();
  writeLog('Listen returned. Server should be live.');

  server.printUrls();
  writeLog('--- Server Information ---');
  writeLog('PID: ' + process.pid);
  writeLog('Configured port: 8080');
  writeLog('Local URL: http://localhost:8080');
  writeLog('Network URL: http://0.0.0.0:8080');

  setInterval(() => {
    writeLog('Heartbeat: ' + Math.floor(process.uptime()) + 's uptime');
  }, 15000);

}).catch((err) => {
  console.error('FATAL STARTUP ERROR:', err);
  process.exit(1);
});
