/**
 * Keeps Puppeteer's Chrome inside the project. Render runs the build and the
 * service from this directory, but does not keep ~/.cache between them.
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: `${__dirname}/.cache/puppeteer`,
};
