const { defaults } = require("../lib/constants");
const ExternalLink = require("../lib/ExternalLink");
const outputResults = require("../lib/outputResults");

describe("outputResults", () => {
  let data;
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    const links = [
      { url: "https://example.com", code: 200 },
      { url: "https://google.com", code: 301 },
      { url: "https://example.com/broken", code: 404 },
    ];
    const options = { ...defaults, ...{ loggingLevel: 3 } };
    const store = links.map((link) => {
      const storeLink = new ExternalLink(link.url);
      storeLink.setHttpStatusCode(link.code);
      storeLink.addPage("./src/index.md");
      storeLink.incrementLinkCount();
      return storeLink;
    });

    data = { store, options };
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test("it outputs something", () => {
    const { store, options } = data;
    outputResults(store, options);
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  test("contains at least one of each type", () => {
    const { store, options } = data;
    outputResults(store, options);
    expect(consoleLogSpy.mock.calls.some((call) => call[0].includes("Link okay"))).toBe(true);
    expect(consoleLogSpy.mock.calls.some((call) => call[0].includes("Link is broken"))).toBe(true);
    expect(consoleLogSpy.mock.calls.some((call) => call[0].includes("Link redirects"))).toBe(true);
  });

  test("it outputs status code and pages", () => {
    const { store, options } = data;
    outputResults(store, options);

    const redirectIndex = consoleLogSpy.mock.calls.findIndex((call) =>
      call[0].includes("Link redirects")
    );
    expect(consoleLogSpy.mock.calls[redirectIndex + 1][0]).toContain("HTTP Status Code: 301");
    expect(consoleLogSpy.mock.calls[redirectIndex + 2][0]).toContain(
      "Used 1 time(s) on these pages"
    );
    expect(consoleLogSpy.mock.calls[redirectIndex + 3][0]).toContain("- ./src/index.md");
  });

  test("doesn't show okay links with loggingLevel 2", () => {
    const { store, options } = data;
    options.loggingLevel = 2;
    outputResults(store, options);

    expect(consoleLogSpy.mock.calls.every((call) => call[0].includes("Link okay"))).toBe(false);
    expect(consoleLogSpy.mock.calls.some((call) => call[0].includes("Link redirects"))).toBe(true);
    expect(consoleLogSpy.mock.calls.some((call) => call[0].includes("Link is broken"))).toBe(true);
  });

  test("only shows broken with loggingLevel 1", () => {
    const { store, options } = data;
    options.loggingLevel = 1;
    outputResults(store, options);

    expect(consoleLogSpy.mock.calls.every((call) => call[0].includes("Link okay"))).toBe(false);
    expect(consoleLogSpy.mock.calls.every((call) => call[0].includes("Link redirects"))).toBe(
      false
    );
    expect(consoleLogSpy.mock.calls.some((call) => call[0].includes("Link is broken"))).toBe(true);
  });

  test("no output with loggingLevel 0", () => {
    const { store, options } = data;
    options.loggingLevel = 0;
    outputResults(store, options);

    expect(consoleLogSpy.mock.calls.length).toBe(0);
  });

  test("throws with 'error'", () => {
    const { store, options } = data;
    options.broken = "error";
    expect(() => outputResults(store, options)).toThrow();
  });

  test("callback is called", () => {
    const { store, options } = data;
    const callbackSpy = jest.fn();
    options.callback = callbackSpy;
    outputResults(store, options);
    expect(callbackSpy).toHaveBeenCalled();
    expect(callbackSpy.mock.calls[0][0]).toEqual(
      store.filter((link) => link.httpStatusCode == 404)
    );
    expect(callbackSpy.mock.calls[0][1]).toEqual(
      store.filter((link) => link.httpStatusCode == 301)
    );
  });

  test("callback not called if only okay", () => {
    const { store, options } = data;
    const onlyOkayStore = store.filter((link) => link.getHttpStatusCode() == 200);
    const callbackSpy = jest.fn();
    options.callback = callbackSpy;
    outputResults(onlyOkayStore, options);
    expect(callbackSpy).not.toHaveBeenCalled();
  });
});

describe("outputResults — internal links", () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  function makeInternalStore(entries) {
    const InternalLink = require("../lib/InternalLink");
    return entries.map(({ targetPath, exists }) => {
      const link = new InternalLink(targetPath);
      link.setExists(exists);
      link.addPage("./src/index.md");
      link.incrementLinkCount();
      return link;
    });
  }

  test("logs broken internal link at loggingLevel >= 1", () => {
    const options = { ...defaults, internalLinks: "warn", loggingLevel: 1 };
    const internalStore = makeInternalStore([{ targetPath: "/missing", exists: false }]);
    outputResults([], options, internalStore);
    expect(consoleLogSpy.mock.calls.some((c) => c[0].includes("Internal link is broken"))).toBe(true);
  });

  test("does not log broken internal link at loggingLevel 0", () => {
    const options = { ...defaults, internalLinks: "warn", loggingLevel: 0 };
    const internalStore = makeInternalStore([{ targetPath: "/missing", exists: false }]);
    outputResults([], options, internalStore);
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  test("does not log existing internal links", () => {
    const options = { ...defaults, internalLinks: "warn", loggingLevel: 3 };
    const internalStore = makeInternalStore([{ targetPath: "/about", exists: true }]);
    outputResults([], options, internalStore);
    expect(consoleLogSpy.mock.calls.every((c) => !c[0].includes("Internal link is broken"))).toBe(true);
  });

  test("throws when internalLinks is 'error' and broken internal links exist", () => {
    const options = { ...defaults, internalLinks: "error", loggingLevel: 1 };
    const internalStore = makeInternalStore([{ targetPath: "/missing", exists: false }]);
    expect(() => outputResults([], options, internalStore)).toThrow(
      "broken internal links"
    );
  });

  test("does not throw when internalLinks is 'warn'", () => {
    const options = { ...defaults, internalLinks: "warn", loggingLevel: 1 };
    const internalStore = makeInternalStore([{ targetPath: "/missing", exists: false }]);
    expect(() => outputResults([], options, internalStore)).not.toThrow();
  });

  test("works without internalStore (backward compat)", () => {
    const options = { ...defaults };
    expect(() => outputResults([], options)).not.toThrow();
  });
});
