const debug = require("debug")("Eleventy:plugin-broken-links");
const checkInternalLinkExists = require("./checkInternalLinkExists");

function checkAllInternalLinks(store, outputDir) {
  debug("checking internal link existence...");
  store.forEach((link) => {
    link.setExists(checkInternalLinkExists(link.targetPath, outputDir));
  });
  debug("done checking internal links");
}

module.exports = checkAllInternalLinks;
