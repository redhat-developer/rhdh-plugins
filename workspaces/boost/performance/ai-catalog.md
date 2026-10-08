# AI Catalog performance baseline

Baseline captured on 2026-09-22 at source commit `495a084a3` with Backstage
1.54.6, Node.js 24.5.0, the local Boost dev app, and Playwright's Chrome
project.

The benchmark uses 500 synthetic catalog entities distributed across
`AiResource`, `API`, and `Resource` AI asset types. It intercepts the Catalog
API, matching the current frontend design: the page loads the full result set
once and applies search and filters in the browser. No separate Boost backend
proxy measurement is applicable.

| Measurement                                 |   Result |     Target | Status |
| ------------------------------------------- | -------: | ---------: | ------ |
| Navigation through 20 rendered grid cards   | 1,636 ms | < 2,000 ms | Pass   |
| Search/filter response to one matching card |   385 ms |   < 500 ms | Pass   |

The built `ai-catalog` package emits 116,977 bytes of JavaScript, or 23,098
bytes when the emitted modules are gzipped together. The complete `dist`
directory is 676K and includes source maps and declarations; those are not
runtime bundle payload.

Re-run the benchmark from the workspace root with:

```bash
yarn test:e2e:performance
yarn workspace @red-hat-developer-hub/backstage-plugin-ai-catalog build
```

The performance test is opt-in so normal end-to-end runs are not made
environment-sensitive by timing thresholds.
