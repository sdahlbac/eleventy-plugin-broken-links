const InternalLink = require("../lib/InternalLink");

describe("InternalLink", () => {
  test("constructs with targetPath", () => {
    const link = new InternalLink("/about");
    expect(link.targetPath).toBe("/about");
    expect(link.getLinkCount()).toBe(0);
    expect(link.getPages()).toEqual([]);
    expect(link.getExists()).toBeNull();
  });

  test("incrementLinkCount works", () => {
    const link = new InternalLink("/about");
    expect(link.incrementLinkCount()).toBe(1);
    expect(link.incrementLinkCount()).toBe(2);
    expect(link.getLinkCount()).toBe(2);
  });

  test("addPage and getPages work", () => {
    const link = new InternalLink("/about");
    link.addPage("./src/index.md");
    link.addPage("./src/blog.md");
    expect(link.getPages()).toHaveLength(2);
    expect(link.getPages()).toContain("./src/index.md");
  });

  test("addPage deduplicates", () => {
    const link = new InternalLink("/about");
    link.addPage("./src/index.md");
    link.addPage("./src/index.md");
    expect(link.getPages()).toHaveLength(1);
  });

  test("setExists and getExists work", () => {
    const link = new InternalLink("/about");
    link.setExists(true);
    expect(link.getExists()).toBe(true);
    link.setExists(false);
    expect(link.getExists()).toBe(false);
  });
});
