const checkAllInternalLinks = require("../lib/checkAllInternalLinks");
const InternalLink = require("../lib/InternalLink");

jest.mock("../lib/checkInternalLinkExists");
const checkInternalLinkExists = require("../lib/checkInternalLinkExists");

describe("checkAllInternalLinks", () => {
  beforeEach(() => {
    checkInternalLinkExists.mockReset();
  });

  test("sets exists=true for found links", () => {
    checkInternalLinkExists.mockReturnValue(true);
    const link = new InternalLink("/about");
    checkAllInternalLinks([link], "_site");
    expect(link.getExists()).toBe(true);
  });

  test("sets exists=false for missing links", () => {
    checkInternalLinkExists.mockReturnValue(false);
    const link = new InternalLink("/missing");
    checkAllInternalLinks([link], "_site");
    expect(link.getExists()).toBe(false);
  });

  test("handles empty store", () => {
    expect(() => checkAllInternalLinks([], "_site")).not.toThrow();
  });

  test("processes multiple links", () => {
    checkInternalLinkExists
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const links = [new InternalLink("/about"), new InternalLink("/missing")];
    checkAllInternalLinks(links, "_site");
    expect(links[0].getExists()).toBe(true);
    expect(links[1].getExists()).toBe(false);
  });
});
