import('./src/server.js').catch((error) => {
  console.error('Failed to start Medicare API:', error);
  process.exit(1);
});
