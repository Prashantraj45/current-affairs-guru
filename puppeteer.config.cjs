/**
 * Puppeteer config — cache lives inside the project directory.
 *
 * Render's /opt/render/.cache is build-phase only and gets wiped before the
 * service starts. Putting Chrome under process.cwd()/.cache/puppeteer ensures
 * it is part of the deployment artifact and available at runtime.
 *
 * On Render: set PUPPETEER_CACHE_DIR=/opt/render/project/puppeteer
 * in the service env vars or rely on this config to set it automatically.
 */
const { join } = require('path');

module.exports = {
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR || (process.env.RENDER ? '/opt/render/project/puppeteer' : join(process.cwd(), '.cache', 'puppeteer')),
};
