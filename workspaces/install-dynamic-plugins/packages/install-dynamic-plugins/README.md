# cli-module-install-dynamic-plugins

Backstage CLI module that downloads, extracts, and configures RHDH dynamic plugins listed in a `dynamic-plugins.yaml` file.

This package replaces the previous Python implementation (`install-dynamic-plugins.py`) with a TypeScript/Node.js implementation. The runtime contract — input config, output `app-config.dynamic-plugins.yaml`, on-disk layout, hash-based change detection, lock file — is **unchanged**.

The package has two invocation paths, both running the same `installer.ts` pipeline:

- **`bin/install-dynamic-plugins` → fast-path** that loads `dist/installer.cjs.js` directly. Direct `npx install-dynamic-plugins` and any host that resolves the bin via `node_modules/.bin/...` hits this path — bypasses `@backstage/cli-node`'s `runCliModule` dispatch (~80 ms saved on cold start).
- **`main: dist/index.cjs.js` → `createCliModule(...)`**, exposed for `backstage-cli` discovery. When a host project lists this package as a dependency, `backstage-cli install <dynamic-plugins-root>` is registered automatically.

## Usage

### Direct (bundled bin)

```sh
npx @red-hat-developer-hub/cli-module-install-dynamic-plugins ./dynamic-plugins-root
```

Or install globally:

```sh
npm install -g @red-hat-developer-hub/cli-module-install-dynamic-plugins
install-dynamic-plugins ./dynamic-plugins-root
```

### Via `backstage-cli` discovery

When the package is a dependency of a project that uses `backstage-cli`, the `install` command is registered automatically:

```sh
backstage-cli install ./dynamic-plugins-root
```

Runtime requirements: Node.js 22 or 24, and `skopeo` on `PATH` for OCI plugin support. `npm` is also expected on `PATH` for NPM-sourced plugins.

## How RHDH consumes it

The init container invokes the wrapper `install-dynamic-plugins.sh /dynamic-plugins-root`, which delegates to the bin installed via `yarn install` from this package (see [redhat-developer/rhdh#4908](https://github.com/redhat-developer/rhdh/pull/4908)). Node.js is already present in the runtime image (it runs the Backstage backend), and `skopeo` is installed for OCI inspection — no new system packages are required.

## OCI package version inheritance

An OCI entry tagged with `{{inherit}}` is matched to an included plugin by its image name, the final OCI path segment. The registry host and namespace on the `{{inherit}}` entry are ignored during this lookup:

```yaml
# Included catalog entry
- package: oci://quay.io/rhdh/backstage-plugin-catalog:v1!catalog-backend

# Main configuration
- package: oci://registry.redhat.io/rhdh/backstage-plugin-catalog:{{inherit}}!catalog-backend
```

The main entry resolves to `oci://quay.io/rhdh/backstage-plugin-catalog:v1!catalog-backend`, adopting the catalog's concrete registry and version. An explicit `!plugin-path` on the main entry takes precedence over the included path. When it differs from the included path, it creates a distinct plugin entry, matching the operator; the included entry remains unless it is separately disabled.

Name matching is only used to resolve the reference. Normal merging continues to use the resolved registry, image, and plugin path, so ordinary OCI entries do not override each other merely because their image names match. Different enabled images at the same merge level must not share a final image name because that would make name-based references ambiguous; the installer reports both conflicting entries. Disabled candidates are ignored when an enabled match exists, while a unique disabled candidate remains available for a higher-precedence entry to re-enable. Multiple explicit paths from the same image remain distinct, while enabled pathless inheritance from such an image is rejected as ambiguous.

Include files participate directly in name-based inheritance resolution and must come from trusted sources.

## Architecture

```
src/
├── index.ts              # createCliModule default export (backstage-cli discovery)
├── command.ts            # loader for the `install` command (used by cli-module)
├── installer.ts          # install pipeline + main() — the single source of truth
├── log.ts                # uniform stdout logger
├── errors.ts             # InstallException
├── types.ts              # PluginSpec / Plugin / PluginMap / PullPolicy + constants
├── util.ts               # shared helpers (fileExists, isInside, isPlainObject, tar filters)
├── run.ts                # subprocess wrapper with structured errors
├── concurrency.ts        # Semaphore + mapConcurrent + getWorkers()
├── which.ts              # PATH lookup (no `which` dep)
├── skopeo.ts             # Skopeo wrapper with promise-based inspect cache
├── image-resolver.ts     # registry.access.redhat.com → quay.io fallback
├── image-cache.ts        # OciImageCache — share OCI tarballs across plugins
├── tar-extract.ts        # streaming OCI / NPM extraction with security checks
├── npm-key.ts            # NPM package-spec parsing
├── oci-key.ts            # OCI package-spec parsing + {{inherit}} + auto-path
├── plugin-name.ts        # final-segment name extraction for reference lookup
├── integrity.ts          # streaming SRI integrity verification
├── merger.ts             # reference resolution + plugin/config merging
├── plugin-hash.ts        # hash for change-detection ("already installed?")
├── installer-oci.ts      # install one OCI plugin
├── installer-npm.ts      # install one NPM (or local) plugin
├── catalog-index.ts      # CATALOG_INDEX_IMAGE extraction
└── lock-file.ts          # exclusive lock + SIGTERM cleanup
```

### Concurrency strategy (resource-conscious)

OCI plugin downloads are parallelized via `mapConcurrent`. NPM `npm pack` calls stay sequential because the upstream npm registry throttles parallel fetches.

The default worker count comes from `getWorkers()`:

```
Math.max(1, Math.min(Math.floor(availableParallelism() / 2), 6))
```

`availableParallelism()` honours cgroup CPU limits, so init containers in OpenShift won't try to use 16 workers on a 0.5 CPU pod. Override with `DYNAMIC_PLUGINS_WORKERS=<n>`.

### Memory budget

All tar extraction is streaming via `node-tar` — large layers never load into RAM. SHA verification streams chunks through `node:crypto`. A typical 10-plugin run sits around 20–80 MB peak RSS, comfortably below an init-container memory limit of 512 Mi.

### Security checks (parity with the previous Python script)

| Check                                                                 | Source                               |
| --------------------------------------------------------------------- | ------------------------------------ |
| Path-traversal in plugin path (`..`, absolute paths)                  | `tar-extract.ts`                     |
| Per-entry size cap (zip bomb) — `MAX_ENTRY_SIZE`, default 20 MB       | `tar-extract.ts`, `catalog-index.ts` |
| Symlink / hardlink target must stay inside destination                | `tar-extract.ts`                     |
| Reject device files / FIFOs / unknown entry types                     | `tar-extract.ts`                     |
| `package/` prefix enforced for NPM tarballs                           | `tar-extract.ts`                     |
| SRI integrity verification (`sha256` / `sha384` / `sha512`)           | `integrity.ts`                       |
| Registry fallback: `registry.access.redhat.com/rhdh` → `quay.io/rhdh` | `image-resolver.ts`                  |

## Environment variables

| Variable                          | Default              | Purpose                                                                                                |
| --------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------ |
| `MAX_ENTRY_SIZE`                  | `20000000`           | Per-entry byte limit when extracting tarballs                                                          |
| `SKIP_INTEGRITY_CHECK`            | `false`              | When `true`, skip the SRI integrity check for remote NPM packages                                      |
| `CATALOG_INDEX_IMAGE`             | _(unset)_            | OCI image to extract `dynamic-plugins.default.yaml` and catalog entities from                          |
| `CATALOG_ENTITIES_EXTRACT_DIR`    | `$TMPDIR/extensions` | Where to extract `catalog-entities/` from the catalog-index image                                      |
| `DYNAMIC_PLUGINS_WORKERS`         | `auto`               | Worker count override for parallel OCI downloads (`auto` uses `availableParallelism()/2`, capped at 6) |
| `DYNAMIC_PLUGINS_LOCK_TIMEOUT_MS` | `600000` (10 min)    | Max time to wait for the lock file before aborting with an error                                       |

## Development

From the workspace root:

```sh
yarn install
yarn tsc          # type-check
yarn test         # Jest unit tests (166 tests)
yarn workspace @red-hat-developer-hub/cli-module-install-dynamic-plugins build
```

`yarn build` runs `backstage-cli package build` and emits the unbundled `dist/*.cjs.js` + type declarations. The package is published as-is; no committed bundle.

## Compatibility notes

- The **input contract** matches the previous Python script exactly: same `dynamic-plugins.yaml` schema (`includes`, `plugins`, `package`, `pluginConfig`, `disabled`, `pullPolicy`, `forceDownload`, `integrity`).
- The **output contract** matches: same `app-config.dynamic-plugins.yaml`, same plugin directory layout, same `dynamic-plugin-config.hash` / `dynamic-plugin-image.hash` files.
- `{{inherit}}` resolves by final OCI image name across registries, then uses the concrete included package for normal merging. OCI path auto-detection, registry fallback, integrity algorithms, and lock-file behaviour are preserved.
