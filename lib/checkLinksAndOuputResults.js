const checkLinkStatuses = require("./checkLinkStatuses");
const checkAllInternalLinks = require("./checkAllInternalLinks");
const outputResults = require("./outputResults");

function checkLinksAndOutputResults(store, options, internalStore, outputDir) {
  return async function () {
    await checkLinkStatuses(store, options.cacheDuration);
    if (options.internalLinks !== "off" && internalStore) {
      checkAllInternalLinks(internalStore, outputDir);
    }
    outputResults(store, options, internalStore);
  };
}

module.exports = checkLinksAndOutputResults;
