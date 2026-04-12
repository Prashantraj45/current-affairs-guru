/**
 * Puppeteer config — sets explicit cache path for Render deployment.
 * Chrome is downloaded here during `npm install` (via postinstall script).
 */
const { join } = require('path');

module.exports = {
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR || join(require('os').homedir(), '.cache', 'puppeteer'),
};
