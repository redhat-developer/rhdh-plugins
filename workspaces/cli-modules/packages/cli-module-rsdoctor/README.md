# Rsdoctor

[Rsdoctor](https://rsdoctor.rs) is a build analyser for Rspack and webpack. It
records the module graph, chunk graph, package graph, loader timings and
bundle sizes of a build and shows them in an interactive report.

The Backstage CLI bundles frontend packages with Rspack but does not expose the
Rspack configuration, so the plugin cannot be added the usual way. This CLI
module adds an `rsdoctor` command group to `backstage-cli`. The commands wrap
the regular `package build` / `package start` commands and append
`RsdoctorRspackPlugin` to the frontend bundler config right before the build.
Everything else (entry points, `splitChunks`, output) stays as in a normal build.

## Commands

```sh
backstage-cli rsdoctor build     # Rspack build of the current package with a report
backstage-cli rsdoctor start     # dev server of the current package with a live report
backstage-cli rsdoctor analyze   # re-open the report of a previous build
backstage-cli rsdoctor check     # check a previous build against the size budgets
backstage-cli rsdoctor diff      # compare the sizes of two builds
backstage-cli rsdoctor <command> --help
```

Run them inside a frontend package, i.e. `packages/app` or a frontend plugin.
Convenience scripts exist as well:

```sh
yarn build:rsdoctor                                            # app (= yarn workspace app build:rsdoctor)
yarn workspace app start:rsdoctor                              # app dev server
yarn workspace @internal/backstage-plugin-example build:rsdoctor
yarn workspace @internal/backstage-plugin-example start:rsdoctor
yarn rsdoctor:analyze                                          # re-open the app report
yarn rsdoctor:analyze --port 4321 --no-open                    # fixed port, no browser
yarn rsdoctor:check                                            # budgets against the last app build
yarn workspace @internal/backstage-plugin-example check:rsdoctor  # same for the plugin
yarn rsdoctor:diff --baseline path/to/previous/.rsdoctor       # size changes since a previous build
```

After `rsdoctor build` Rsdoctor starts a local report server and opens the
browser (unless disabled, see below). The report data is written to
`<package>/.rsdoctor/` (gitignored), so it can be re-opened later with
`rsdoctor analyze`.

### `rsdoctor build`

Runs `backstage-cli package build` with Rsdoctor enabled, writes
`.rsdoctor/sizes.json` and runs the size checks described below. Flags it does
not know are forwarded to the build command (for example `--config`,
`--stats`).

| Flag                   | Default                                             | Effect                                                                                                                              |
| ---------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `--mode`               | `normal`, `brief` when `CI` is set                  | `brief` writes a single self-contained `rsdoctor-report.html` without module source code, suitable as a CI artifact.                |
| `--open` / `--no-open` | `--open`, `--no-open` when `CI` is set              | Whether to start the report server and open the browser after the build.                                                            |
| `--port`               | random                                              | Port of the Rsdoctor report server.                                                                                                 |
| `--report-dir`         | `<package>/.rsdoctor`                               | Where the report goes. Normal mode creates a `.rsdoctor/` folder inside it, brief mode writes `rsdoctor-report.html` into it.       |
| `--module-federation`  | on for plugin packages, off for the `frontend` role | Build the package as a module federation remote. This is the only Rspack production build of a plugin, so it is the plugin default. |
| `--json`               | off                                                 | Also write the report as JSON next to the HTML report. Brief mode only.                                                             |
| `--summary`            | on when `CI` is set                                 | Print the size summary and the Rsdoctor findings to the console after the build.                                                    |
| `--budget`             | on when `rsdoctor.budgets.json` exists              | Check the size budgets and fail the build when one is exceeded. `--no-budget` skips the check.                                      |
| `--budget-file`        | `<package>/rsdoctor.budgets.json`                   | Use another budget file.                                                                                                            |
| `--baseline`           | `baseline.path` of the budget file                  | `sizes.json` (or a directory containing it) of a previous build to compare against.                                                 |

The environment variables `RSDOCTOR_MODE`, `RSDOCTOR_OPEN`, `RSDOCTOR_PORT`
and `RSDOCTOR_REPORT_DIR` provide the same settings for scripts and CI.

### `rsdoctor start`

Runs `backstage-cli package start` with Rsdoctor enabled. Takes the same
`--mode`, `--open`, `--port` and `--report-dir` flags; everything else is
forwarded to the start command. The dev server's `eval` source maps are
replaced with `cheap-module-source-map`, because Rsdoctor cannot read `eval`
maps.

### `rsdoctor analyze`

Opens a saved report with the Rsdoctor report server.

| Flag        | Default                                          |
| ----------- | ------------------------------------------------ |
| `--profile` | `.rsdoctor/manifest.json` in the current package |
| `--port`    | random                                           |
| `--no-open` | opens the browser by default                     |

### `rsdoctor check`

Evaluates the `sizes.json` of a previous `rsdoctor build` against the budgets
and an optional baseline without rebuilding. Prints the summary and exits with
an error when a limit is exceeded.

| Flag                                                   | Default                                        |
| ------------------------------------------------------ | ---------------------------------------------- |
| `--sizes`                                              | `.rsdoctor/sizes.json` in the current package  |
| `--budget`, `--budget-file`, `--baseline`, `--summary` | as for `rsdoctor build`, summary on by default |

### `rsdoctor diff`

Compares two builds and prints the gzip size change per file, largest change
first, plus the initial and total deltas.

```sh
backstage-cli rsdoctor diff --baseline ../../main-build/.rsdoctor            # console diff
backstage-cli rsdoctor diff --baseline ../../main-build/.rsdoctor --html     # + Rsdoctor bundle diff HTML
backstage-cli rsdoctor diff --baseline ../../main-build/.rsdoctor --serve    # interactive bundle diff
```

| Flag                           | Default                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `--baseline`                   | required: the `.rsdoctor` directory, `sizes.json` or `manifest.json` of the baseline build             |
| `--current`                    | `.rsdoctor` in the current package                                                                     |
| `--limit`                      | 15 changed files listed                                                                                |
| `--budget`, `--budget-file`    | apply the `baseline` limits of the budget file and fail on excessive growth; on when the file exists   |
| `--html`, `--json`, `--output` | also write Rsdoctor's own bundle diff (needs `manifest.json` of both builds, i.e. normal-mode reports) |
| `--serve`                      | open Rsdoctor's interactive bundle diff instead of writing a file                                      |

## Size budgets

Put an `rsdoctor.budgets.json` next to the package's `package.json`. All sizes
are gzipped, matching what the Backstage CLI prints. `packages/app` ships one:

```json
{
  "maxInitialSize": "1.5 MB",
  "maxTotalSize": "4.5 MB",
  "maxChunkSize": "600 KB",
  "maxChunks": 450,
  "chunks": {
    "main": "30 KB",
    "backstage": "300 KB",
    "vendor": "250 KB",
    "module-*": "300 KB",
    "*": "550 KB"
  },
  "baseline": {
    "maxInitialIncrease": "5%",
    "maxTotalIncrease": "5%",
    "maxChunkIncrease": "10%",
    "newChunks": "100 KB",
    "maxNewChunks": 20
  }
}
```

| Key                           | Meaning                                                                                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `maxInitialSize`              | Limit for all JS files that load on page start (initial chunks).                                                                                                                                                    |
| `maxTotalSize`                | Limit for all JS files.                                                                                                                                                                                             |
| `maxChunkSize`                | Limit for any single JS or CSS file, listed or not.                                                                                                                                                                 |
| `maxChunks`                   | Maximum number of JS files the build may emit. Catches a change that splits the bundle into many more chunks.                                                                                                       |
| `chunks`                      | Limits for individual files, keyed by chunk name (`main`, `backstage`, `vendor`), file name without hash (`static/698.chunk.js`) or its basename. Keys may contain `*` wildcards (`module-*`, `static/*.chunk.js`). |
| `chunks["*"]`                 | Catch-all for **every file no other key matches**. This is how unlisted and newly appearing chunks get a limit without naming them; a missing named key is only reported, but every file always falls under `*`.    |
| `baseline.maxInitialIncrease` | Maximum growth of the initial JS total compared to the baseline, as a percentage (`5%`) or a size (`20 KB`).                                                                                                        |
| `baseline.maxTotalIncrease`   | Maximum growth of the JS total.                                                                                                                                                                                     |
| `baseline.maxChunkIncrease`   | Maximum growth of any file that also exists in the baseline.                                                                                                                                                        |
| `baseline.newChunks`          | Policy for files that do not exist in the baseline: `allow` (default, they are listed in the output), `fail` (any new file fails), or a size such as `100 KB` (new files above it fail).                            |
| `baseline.maxNewChunks`       | Maximum number of files that may be new compared to the baseline.                                                                                                                                                   |
| `baseline.path`               | Default baseline `sizes.json`, used when `--baseline` is not given.                                                                                                                                                 |

Files that existed in the baseline but are gone are listed as removed. Every
check works on the whole file list, so a new chunk is covered three times:
by `maxChunkSize` and the `*` catch-all in the static checks, and by
`newChunks` / `maxNewChunks` in the baseline checks, in addition to the totals
it contributes to.

Sizes accept bytes or `KB` / `MB` strings. Static limits are checked by
`rsdoctor build` and `rsdoctor check`; baseline limits are checked whenever a
baseline is given, also by `rsdoctor diff`. A violation fails the command with
a list like:

```
Bundle size budget exceeded:
  - initial JS: 1.31 MB gzip, limit 1.25 MB exceeded by 61.4 KB
  - static/3616.chunk.js: 493.9 KB gzip exceeds maxChunkSize 400.0 KB
```

The same static checks are registered as a custom Rsdoctor rule
(`bundle-size-budget`, code E9001), so violations also appear under Bundle
Alerts in the report.

### `sizes.json`

Every `rsdoctor build` writes `sizes.json` next to the report (in
`.rsdoctor/` in normal mode, next to `rsdoctor-report.html` in brief mode). It
lists every JS and CSS file with raw and gzipped size, chunk name, whether it
is an initial chunk, and a `key` with the content hash removed so files can be
matched across builds. Keep it as a CI artifact: it is the baseline for
`--baseline` and `rsdoctor diff`.

## CI

```sh
CI=true yarn build:rsdoctor
# -> packages/app/.rsdoctor/rsdoctor-report.html, packages/app/.rsdoctor/sizes.json
```

On CI the build prints the summary (sizes, largest files, Rsdoctor findings),
checks the budgets when `rsdoctor.budgets.json` exists, and fails when a
budget is exceeded. A typical pull request job downloads the `sizes.json` of
the last main-branch build and passes it as `--baseline`, then uploads its own
`.rsdoctor/` as an artifact for the next comparison:

```sh
CI=true yarn workspace app backstage-cli rsdoctor build --baseline ./baseline/sizes.json
```

Rsdoctor reports its lint findings (duplicate packages, cross-chunk packages,
...) as Rspack warnings. Because the Backstage CLI treats warnings as errors
when `CI` is set, the module strips those findings from the build warnings on
CI; they remain in the report. Without `CI` they are printed after the build as
usual.

## Analysing a single frontend plugin

`yarn build:rsdoctor` reports on the whole app bundle; the plugin's code is
in there, but mixed with everything else. The regular plugin build
(`backstage-cli package build`) uses Rollup, so Rsdoctor cannot attach to it.
Inside a plugin, `rsdoctor build` therefore defaults to the module federation
remote build, which bundles only the plugin and its dependencies with Rspack
(output in `<plugin>/dist`, report in `<plugin>/.rsdoctor/`), and
`rsdoctor start` runs the plugin's dev app from `dev/index.tsx`.

Keep in mind that a module federation remote splits dependencies into async
chunks and declares shared packages, so its chunk graph is not the one the
plugin gets inside the app. Use it to see what the plugin itself pulls in and
to compare plugins with each other; use the app report for the chunks that
actually load in the app.

### Plugin size budgets

Budgets work the same way for plugins. `plugins/example/rsdoctor.budgets.json`
limits the plugin's module federation build (numbers are gzipped, about 20%
above the current sizes):

```json
{
  "maxInitialSize": "85 KB",
  "maxTotalSize": "300 KB",
  "maxChunkSize": "80 KB",
  "maxChunks": 15,
  "chunks": {
    "remoteEntry.js": "40 KB",
    "runtime": "40 KB",
    "backstage": "40 KB",
    "vendor": "32 KB",
    "__federation_expose_default_export": "2 KB",
    "*": "70 KB"
  },
  "baseline": {
    "maxInitialIncrease": "10%",
    "maxTotalIncrease": "10%",
    "maxChunkIncrease": "15%",
    "newChunks": "10 KB",
    "maxNewChunks": 2
  }
}
```

In a remote build the plugin's own code is tiny: the registration code sits in
the `__federation_expose_default_export` chunk and the page in a small
numbered chunk. Numbered ids change when the module graph changes, so they are
not listed by name; the `*` catch-all limits them together with every other
unlisted file, and `newChunks` / `maxNewChunks` flag them when they appear
compared to a baseline. Nearly all of the size is dependencies that the app
would share at runtime, which is why `maxTotalSize`, `maxChunks` and the
dependency chunk limits are the interesting ones: they catch a plugin that
starts to pull in a new large library or splits into many more chunks.

```sh
yarn workspace @internal/backstage-plugin-example build:rsdoctor            # build + budgets
yarn workspace @internal/backstage-plugin-example check:rsdoctor            # re-check the last build
yarn workspace @internal/backstage-plugin-example backstage-cli rsdoctor diff --baseline ../../previous/.rsdoctor
CI=true yarn workspace @internal/backstage-plugin-example build:rsdoctor    # brief report + checks on CI
```

## What to look at for chunk questions

The **Bundle Size** page lists every emitted asset together with the modules it
contains and lets you drill into a chunk. The **Bundle > Treemap** view shows
which packages dominate each chunk, and the **Module Graph** answers why a
module is in the bundle at all (its import chain). For the plugin chunk
analysis in `docs/example-plugin-chunk-analysis.md`, search the Bundle Size
page for `plugins/example/src` to find the `main` chunk (sync registration)
and the small async chunk holding `TodoPage`.

## How the module works

- `packages/cli-module-rsdoctor/src/lib/enableRsdoctor.ts` wraps the exported
  `createConfig` of `@backstage/cli-module-build`'s internal bundler config
  module. Every frontend config the CLI creates afterwards (build and dev
  server) gets the plugin appended, except the optional `dist/public` auth
  bundle, which would otherwise start a second Rsdoctor instance.
- The commands then call the CLI's own `package build` / `package start`
  command implementations in the same process with the forwarded arguments.
- `packages/cli-module-rsdoctor/index.cjs` is the entry `backstage-cli` loads
  from the workspace. It registers the TypeScript transform of
  `@backstage/cli-node` before requiring `src/index.ts`, the same way a CLI
  module's generated `bin` does; a published build would use `dist` instead.
- Because this relies on internal paths of `@backstage/cli-module-build`, it
  may need adjusting when that package changes its layout. The commands fail
  at start-up in that case rather than silently building without Rsdoctor.
