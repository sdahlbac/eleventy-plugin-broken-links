const path = require("path");
const fs = require("fs");

// Returns true if the target of an internal link exists in the output directory.
function checkInternalLinkExists(targetPath, outputDir) {
  const absOutputDir = path.resolve(outputDir);
  // targetPath is site-relative (e.g. "/about" or "/blog/post")
  const withoutLeadingSlash = targetPath.replace(/^\//, "");
  const fullPath = path.resolve(absOutputDir, withoutLeadingSlash);

  // Path traversal protection
  if (!fullPath.startsWith(absOutputDir + path.sep) && fullPath !== absOutputDir) {
    return false;
  }

  const ext = path.extname(withoutLeadingSlash);
  if (ext) {
    // Has explicit extension: check exact path only
    return fs.existsSync(fullPath);
  }

  // No extension: try .html, /index.html, and the exact path (for extension-less files)
  return (
    fs.existsSync(fullPath + ".html") ||
    fs.existsSync(path.join(fullPath, "index.html")) ||
    fs.existsSync(fullPath)
  );
}

module.exports = checkInternalLinkExists;
