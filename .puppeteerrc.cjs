/**
 * Vercel runs exports on the serverless Chromium build, so its builds skip
 * Puppeteer's Chrome download. Local installs still get Chrome for development.
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  skipDownload: Boolean(process.env.VERCEL),
};
