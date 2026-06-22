const path = require("path");
const debug = require("debug")("Eleventy:plugin-broken-links");
const { parse } = require("node-html-parser");
const InternalLink = require("./InternalLink");
const { shouldExcludePage } = require("./helpers");

// Matches any valid RFC 3986 URI scheme (e.g. http:, mailto:, tel:, javascript:)
const schemeRe = /^[a-zA-Z][a-zA-Z0-9+\-.]*:/;

function isInternalHref(href) {
  if (!href || href.trim() === "") return false;
  if (href.startsWith("#")) return false;
  if (href.startsWith("//")) return false;
  if (schemeRe.test(href)) return false;
  return true;
}

function stripFragmentAndQuery(href) {
  return href.replace(/[?#].*$/, "");
}

// Returns a site-relative path (e.g. "/about") or null if unresolvable.
function resolveTargetPath(href, outputPath, outputDir) {
  const stripped = stripFragmentAndQuery(href);
  if (stripped === "") return null;

  const absOutputDir = path.resolve(outputDir);

  if (stripped.startsWith("/")) {
    return stripped;
  }

  // Relative href: resolve from the directory of the linking page's output file
  const pageDir = path.dirname(path.resolve(outputPath));
  const resolved = path.resolve(pageDir, stripped);

  // Path traversal protection: resolved must stay inside outputDir
  if (!resolved.startsWith(absOutputDir + path.sep) && resolved !== absOutputDir) {
    debug(`href ${href} resolves outside outputDir; skipping`);
    return null;
  }

  const siteRelative = resolved.slice(absOutputDir.length);
  return siteRelative.startsWith("/") ? siteRelative : "/" + siteRelative;
}

function getInternalLinksFromPage(store, options, config) {
  return function (content) {
    debug("getting internal links from page...");
    const { inputPath, outputPath } = this;

    if (!outputPath) {
      debug(`page ${inputPath} has no outputPath; skipping`);
      return;
    }

    const dirInput = config.dir?.input ?? undefined;
    if (shouldExcludePage(inputPath, dirInput, options.excludeInputs)) {
      debug(`page ${inputPath} found in \`excludeInputs\`; skipping`);
      return;
    }

    const outputDir = config.dir?.output ?? "_site";

    const rawLinks = parse(content)
      .getElementsByTagName("a")
      .map((anchor) => anchor.getAttribute("href"))
      .filter(isInternalHref);

    const uniqueLinks = new Set(rawLinks);

    uniqueLinks.forEach((href) => {
      const targetPath = resolveTargetPath(href, outputPath, outputDir);
      if (targetPath === null) {
        debug(`href ${href} could not be resolved; skipping`);
        return;
      }

      let storeLink = store.find((elem) => elem.targetPath === targetPath);
      if (!storeLink) {
        storeLink = new InternalLink(targetPath);
        store.push(storeLink);
      }

      storeLink.addPage(inputPath);
      storeLink.incrementLinkCount();
    });

    debug("done getting internal links from page");
  };
}

module.exports = getInternalLinksFromPage;
module.exports.isInternalHref = isInternalHref;
module.exports.stripFragmentAndQuery = stripFragmentAndQuery;
module.exports.resolveTargetPath = resolveTargetPath;
