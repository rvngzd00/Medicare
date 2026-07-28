require('dotenv/config');

import('./src/server.js').catch((error) => {
  console.error('Backend startup failed:');
  console.error(error);
  process.exit(1);
});
