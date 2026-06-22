const path = require("path");
const fs = require("fs");
const checkInternalLinkExists = require("../lib/checkInternalLinkExists");

jest.mock("fs");

const outputDir = path.resolve("_site");

describe("checkInternalLinkExists", () => {
  beforeEach(() => {
    fs.existsSync.mockReset();
    fs.existsSync.mockReturnValue(false);
  });

  test("returns true when .html variant exists", () => {
    fs.existsSync.mockImplementation((p) => p === path.join(outputDir, "about.html"));
    expect(checkInternalLinkExists("/about", outputDir)).toBe(true);
  });

  test("returns true when /index.html variant exists", () => {
    fs.existsSync.mockImplementation((p) => p === path.join(outputDir, "about", "index.html"));
    expect(checkInternalLinkExists("/about", outputDir)).toBe(true);
  });

  test("returns true when exact path exists (extension-less file)", () => {
    fs.existsSync.mockImplementation((p) => p === path.join(outputDir, "about"));
    expect(checkInternalLinkExists("/about", outputDir)).toBe(true);
  });

  test("returns false when none of the candidates exist", () => {
    expect(checkInternalLinkExists("/missing", outputDir)).toBe(false);
  });

  test("checks exact path for hrefs with an extension", () => {
    fs.existsSync.mockImplementation((p) => p === path.join(outputDir, "feed.xml"));
    expect(checkInternalLinkExists("/feed.xml", outputDir)).toBe(true);
  });

  test("does not try .html fallback for hrefs with an extension", () => {
    // Only exact path should be tried for /feed.xml
    checkInternalLinkExists("/feed.xml", outputDir);
    const calls = fs.existsSync.mock.calls.map((c) => c[0]);
    expect(calls).toHaveLength(1);
    expect(calls[0]).toBe(path.join(outputDir, "feed.xml"));
  });

  test("returns false for path traversal outside outputDir", () => {
    expect(checkInternalLinkExists("/../etc/passwd", outputDir)).toBe(false);
  });

  test("handles nested paths", () => {
    fs.existsSync.mockImplementation((p) => p === path.join(outputDir, "blog", "post.html"));
    expect(checkInternalLinkExists("/blog/post", outputDir)).toBe(true);
  });
});
