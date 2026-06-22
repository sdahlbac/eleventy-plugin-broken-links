const path = require("path");
const {
  isInternalHref,
  stripFragmentAndQuery,
  resolveTargetPath,
} = require("../lib/getInternalLinksFromPage");
const getInternalLinksFromPage = require("../lib/getInternalLinksFromPage");
const InternalLink = require("../lib/InternalLink");
const { defaults } = require("../lib/constants");

const outputDir = "_site";

describe("isInternalHref", () => {
  test.each([
    ["/about", true],
    ["./contact", true],
    ["../blog", true],
    ["page", true],
    ["page/sub", true],
  ])("returns true for internal href %s", (href, expected) => {
    expect(isInternalHref(href)).toBe(expected);
  });

  test.each([
    ["https://example.com", false],
    ["http://example.com", false],
    ["mailto:user@example.com", false],
    ["tel:+1234567890", false],
    ["javascript:void(0)", false],
    ["ftp://files.example.com", false],
    ["//cdn.example.com/script.js", false],
    ["#section", false],
    ["", false],
    [null, false],
    [undefined, false],
    ["   ", false],
  ])("returns false for non-internal href %s", (href, expected) => {
    expect(isInternalHref(href)).toBe(expected);
  });
});

describe("stripFragmentAndQuery", () => {
  test("strips fragment", () => expect(stripFragmentAndQuery("/about#section")).toBe("/about"));
  test("strips query", () => expect(stripFragmentAndQuery("/page?foo=bar")).toBe("/page"));
  test("strips both", () => expect(stripFragmentAndQuery("/page?foo=bar#section")).toBe("/page"));
  test("leaves clean path unchanged", () => expect(stripFragmentAndQuery("/about")).toBe("/about"));
  test("returns empty string if only fragment", () => expect(stripFragmentAndQuery("#only")).toBe(""));
});

describe("resolveTargetPath", () => {
  const outputPath = path.join("_site", "blog", "index.html");

  test("absolute path is returned as-is", () => {
    expect(resolveTargetPath("/about", outputPath, outputDir)).toBe("/about");
  });

  test("absolute path with trailing slash", () => {
    expect(resolveTargetPath("/about/", outputPath, outputDir)).toBe("/about/");
  });

  test("relative path resolved against page output dir", () => {
    expect(resolveTargetPath("./contact", outputPath, outputDir)).toBe("/blog/contact");
  });

  test("relative path going up one level", () => {
    expect(resolveTargetPath("../about", outputPath, outputDir)).toBe("/about");
  });

  test("returns null for path traversal outside outputDir", () => {
    expect(resolveTargetPath("../../etc/passwd", outputPath, outputDir)).toBeNull();
  });

  test("returns null when href is only a fragment", () => {
    expect(resolveTargetPath("#section", outputPath, outputDir)).toBeNull();
  });

  test("strips fragment before resolving", () => {
    expect(resolveTargetPath("/about#section", outputPath, outputDir)).toBe("/about");
  });

  test("strips query before resolving", () => {
    expect(resolveTargetPath("/about?foo=bar", outputPath, outputDir)).toBe("/about");
  });
});

const content = `<html>
<body>
  <ul>
    <li><a href="/about">About</a></li>
    <li><a href="/blog/post">Blog Post</a></li>
    <li><a href="https://example.com">External</a></li>
    <li><a href="mailto:user@example.com">Email</a></li>
    <li><a href="#section">Fragment only</a></li>
    <li><a href="//cdn.example.com">Protocol-relative</a></li>
    <li><a>No href</a></li>
  </ul>
</body>
</html>`;

describe("getInternalLinksFromPage", () => {
  const config = { dir: { input: "src", output: "_site" } };
  const options = { ...defaults, internalLinks: "warn" };

  test("collects only internal links", () => {
    const store = [];
    const dummyThis = { inputPath: "./src/index.md", outputPath: "_site/index.html" };
    getInternalLinksFromPage(store, options, config).call(dummyThis, content);
    expect(store).toHaveLength(2);
    expect(store.every((item) => item instanceof InternalLink)).toBe(true);
  });

  test("store contains correct targetPaths", () => {
    const store = [];
    const dummyThis = { inputPath: "./src/index.md", outputPath: "_site/index.html" };
    getInternalLinksFromPage(store, options, config).call(dummyThis, content);
    const paths = store.map((l) => l.targetPath);
    expect(paths).toContain("/about");
    expect(paths).toContain("/blog/post");
  });

  test("skips page without outputPath", () => {
    const store = [];
    const dummyThis = { inputPath: "./src/index.md", outputPath: null };
    getInternalLinksFromPage(store, options, config).call(dummyThis, content);
    expect(store).toHaveLength(0);
  });

  test("skips excluded input pages", () => {
    const store = [];
    const dummyThis = { inputPath: "./src/index.md", outputPath: "_site/index.html" };
    const excludeOptions = { ...options, excludeInputs: ["index.md"] };
    getInternalLinksFromPage(store, excludeOptions, config).call(dummyThis, content);
    expect(store).toHaveLength(0);
  });

  test("deduplicates same target from same page", () => {
    const dupContent = `<html><body>
      <a href="/about">1</a><a href="/about">2</a>
    </body></html>`;
    const store = [];
    const dummyThis = { inputPath: "./src/index.md", outputPath: "_site/index.html" };
    getInternalLinksFromPage(store, options, config).call(dummyThis, dupContent);
    expect(store).toHaveLength(1);
  });

  test("same target from two different pages shares one InternalLink", () => {
    const store = [];
    const page1 = { inputPath: "./src/index.md", outputPath: "_site/index.html" };
    const page2 = { inputPath: "./src/contact.md", outputPath: "_site/contact.html" };
    const simpleContent = `<html><body><a href="/about">About</a></body></html>`;
    getInternalLinksFromPage(store, options, config).call(page1, simpleContent);
    getInternalLinksFromPage(store, options, config).call(page2, simpleContent);
    expect(store).toHaveLength(1);
    expect(store[0].getLinkCount()).toBe(2);
    expect(store[0].getPages()).toHaveLength(2);
  });

  test("relative link from different pages normalizes to same entry", () => {
    const store = [];
    // Both pages link to /about via different relative paths but same resolved target
    const page1 = { inputPath: "./src/index.md", outputPath: "_site/index.html" };
    const page2 = { inputPath: "./src/blog/index.md", outputPath: "_site/blog/index.html" };
    const absContent = `<html><body><a href="/about">About</a></body></html>`;
    const relContent = `<html><body><a href="../about">About</a></body></html>`;
    getInternalLinksFromPage(store, options, config).call(page1, absContent);
    getInternalLinksFromPage(store, options, config).call(page2, relContent);
    expect(store).toHaveLength(1);
    expect(store[0].targetPath).toBe("/about");
  });
});
