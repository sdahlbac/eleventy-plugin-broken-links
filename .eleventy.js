const { defaults } = require("./lib/constants");
const validateUserOptions = require("./lib/validateUserOptions");
const getExternalLinksFromPage = require("./lib/getExternalLinksFromPage");
const getInternalLinksFromPage = require("./lib/getInternalLinksFromPage");
const checkLinksAndOutputResults = require("./lib/checkLinksAndOuputResults");

module.exports = function (eleventyConfig, _options) {
  // validate user-supplied options
  validateUserOptions(_options);

  // merge default and user options, normalize
  const options = { ...defaults, ...(_options ?? {}) };
  options.loggingLevel = parseInt(options.loggingLevel);
  options.cacheDuration = options.cacheDuration.toLowerCase();
  options.forbidden = options.forbidden.toLowerCase();
  options.broken = options.broken.toLowerCase();
  options.redirect = options.redirect.toLowerCase();
  options.internalLinks = options.internalLinks.toLowerCase();

  // create stores of links
  const store = [];
  const internalStore = [];
  const outputDir = eleventyConfig.dir?.output ?? "_site";

  // Phase 1: "Lint" each page and add links to stores
  eleventyConfig.addLinter(
    "getExternalLinksFromPage",
    getExternalLinksFromPage(store, options, eleventyConfig)
  );

  if (options.internalLinks !== "off") {
    eleventyConfig.addLinter(
      "getInternalLinksFromPage",
      getInternalLinksFromPage(internalStore, options, eleventyConfig)
    );
  }

  // Phase 2: Check the links and log them
  eleventyConfig.on(
    "eleventy.after",
    checkLinksAndOutputResults(store, options, internalStore, outputDir)
  );
};
