/**
 * Puppeteer config — cache lives inside the project directory.
 *
 * Render's /opt/render/.cache is build-phase only and gets wiped before the
 * service starts. Putting Chrome under process.cwd()/.cache/puppeteer ensures
 * it is part of the deployment artifact and available at runtime.
 *
 * On Render: set PUPPETEER_CACHE_DIR=/opt/render/project/src/.cache/puppeteer
 * in the service env vars (same effect, explicit path).
 */
const { join } = require('path');

module.exports = {
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR || join(process.cwd(), '.cache', 'puppeteer'),
};
