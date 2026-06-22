# Copilot Instructions

## Commands

```bash
npm test              # run all tests
npm test -- --testPathPattern=outputResults  # run a single test file
npm run test:watch    # run tests in watch mode
npm run lint          # lint
npm run lint:fix      # lint and auto-fix
```

## Architecture

This is an Eleventy plugin that detects broken external links during a build. It runs in two phases hooked into the Eleventy lifecycle:

1. **Phase 1 — Linting** (`eleventyConfig.addLinter`): `getExternalLinksFromPage` parses each built HTML page with `node-html-parser`, extracts `<a href>` attributes that start with `http`, and accumulates them into a shared `store` array of `ExternalLink` instances.

2. **Phase 2 — Checking** (`eleventyConfig.on("eleventy.after", ...)`): `checkLinksAndOutputResults` iterates the store, resolves HTTP status codes (via `getLinkStatusCode`, which uses `@11ty/eleventy-fetch` for caching), then calls `outputResults` to log and optionally throw based on user options.

The `store` is a plain array passed by reference between phases and across modules — it is populated in Phase 1 and read in Phase 2.

**Key modules in `lib/`:**
- `ExternalLink.js` — class holding a URL, its HTTP status code, the set of pages it appears on, and a link count
- `getLinkStatusCode.js` — fetches HTTP status via Node's `http`/`https` modules with a 5-second timeout; caches results using `AssetCache`
- `helpers.js` — pure utility functions: status classifiers (`isBroken`, `isRedirect`, `isForbidden`, `isOkay`), URL/input exclusion logic, validation helpers
- `constants.js` — single source of truth for default option values
- `validateUserOptions.js` — validates user-supplied plugin options at startup

## Conventions

- **CommonJS only** — all modules use `require`/`module.exports`; no ESM.
- **Mocking `getLinkStatusCode`** — tests that exercise network-dependent code use `jest.mock("../lib/getLinkStatusCode")`, which resolves to `lib/__mocks__/getLinkStatusCode.js`. That mock exports a fixed `linksToCheck` array reused across multiple test files to keep test data consistent.
- **Status code handling** — `isBroken` returns `true` for codes 400–504 *excluding* 403 (which is `isForbidden`). Non-numeric codes like `"ADDRESS NOT FOUND"` and `"REQUEST TIMED OUT"` also pass `isBroken` because `isNumber` returns false for them.
- **Option normalization** — string options (`broken`, `redirect`, `forbidden`, `cacheDuration`) are lowercased in `.eleventy.js` before being passed deeper; always store/compare them lowercase.
- **Debug logging** — use `require("debug")("Eleventy:plugin-broken-links")` for debug output; this integrates with Eleventy's `DEBUG=Eleventy*` workflow.
- **`excludeInputs` paths** are relative to `eleventyConfig.dir.input` and matched via `minimatch`; leading `./` is stripped before comparison.
- **`excludeUrls`** uses simple prefix-wildcard matching (only trailing `*` is supported), not full glob or regex.
