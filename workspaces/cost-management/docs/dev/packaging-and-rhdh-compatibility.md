# Packaging and RHDH Compatibility — Plugin Developers

Developer reference for building, packaging, and targeting Cost Management OCI images against supported Red Hat Developer Hub (RHDH) releases.

For **customer install steps** (Operator / Helm / ConfigMap), see [`../installing-on-rhdh.md`](../installing-on-rhdh.md).  
For **local app development**, see [`local-dev-setup.md`](./local-dev-setup.md).  
For **testing on rhdh-local**, see [`testing-cost-management-on-rhdh-local.md`](./testing-cost-management-on-rhdh-local.md).

---

## Supported host / artifact matrix

| Target RHDH                     | RHDH frontend                        | Cost Management image tag | Build with rhdh-cli                  | Frontend packaging                                                                        |
| ------------------------------- | ------------------------------------ | ------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| **2.1** (latest / Full Support) | New frontend system (NFS) by default | `2.4.2`                   | `2.1.x`                              | Standard Module Federation under `dist/` (`remoteEntry.js`); `/alpha` export              |
| **1.10** (Maintenance Support)  | Default Scalprum shell               | `2.2.2`                   | `1.10.x` or pre-`2.1` (e.g. `2.0.x`) | Scalprum-compatible frontend assets; root (`.`) export + `dynamicPlugins.frontend` config |

RHDH **1.9** and earlier are EOL and are not supported.

Do **not** ship one NFS-only (CLI `2.1.x`) frontend image for default RHDH 1.10. CLI major.minor tracks RHDH packaging: `2.1.x` export is for NFS hosts; default 1.10 still expects Scalprum packaging.

Confirm current RHDH life cycle phases on the [Red Hat Developer Hub Life Cycle](https://access.redhat.com/support/policy/updates/developerhub) page.

---

## Frontend systems: Scalprum vs NFS

| Topic                             | RHDH 1.10 (default)                                                    | RHDH 2.1                                                                                                                                                                               |
| --------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Module loading                    | Scalprum                                                               | Standard Module Federation / new frontend system (NFS)                                                                                                                                 |
| Plugin entry                      | Package root export (`.`)                                              | `./alpha` export (`createFrontendPlugin` / blueprints)                                                                                                                                 |
| Customer UI wiring                | `dynamicPlugins.frontend` (`dynamicRoutes`, `importName`, `menuItems`) | Defaults from code; optional `app.extensions` overrides                                                                                                                                |
| Nested sidebar `menuItems.parent` | Supported                                                              | Not available on NFS — see [RHDH-specific gaps](https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/migrating-config-to-new-frontend-system.md#rhdh-specific-gaps) |

On RHDH 1.10 only, NFS can be opted in for migration testing with:

```bash
APP_CONFIG_app_packageName=app-next
ENABLE_STANDARD_MODULE_FEDERATION=true
```

That path is for migration testing, not the default production 1.10 install documented for customers.

---

## Dual-export pattern

Keep both entry points so the same source can support 1.10 (`.`) and 2.1 (`./alpha`):

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./alpha": "./src/alpha.tsx",
    "./package.json": "./package.json"
  }
}
```

Dual source exports are **code** compatibility. They do **not** replace choosing the correct **rhdh-cli** line when exporting OCI images.

---

## rhdh-cli and packaging

This workspace uses `@red-hat-developer-hub/cli` (see workspace `package.json`) and `scripts/dynamic-plugins.sh` for `plugin export` / `plugin package`.

### Migrating to CLI 2.1.0

From the official [rhdh-cli “Migrating to 2.1.0”](https://github.com/redhat-developer/rhdh-cli#migrating-to-210) notes:

- Scalprum support is removed from frontend export — no Scalprum fallback
- Removed flags such as `--scalprum-config`, `--generate-scalprum-assets`, `--generate-module-federation-assets` (MF assets are always generated)
- Consumers use `dist/` (e.g. `remoteEntry.js`), not `dist-scalprum/plugin-manifest.json`
- Update package `files` to keep `dist` and drop `dist-scalprum`
- CLI major.minor aligns with RHDH packaging (`2.1.x` ↔ RHDH `2.1`)

### Practical build guidance

| Goal                            | CLI to pin                                                           | Notes                                       |
| ------------------------------- | -------------------------------------------------------------------- | ------------------------------------------- |
| Image for **RHDH 2.1**          | `@red-hat-developer-hub/cli@2.1.x`                                   | Current workspace default for NFS packaging |
| Image for **default RHDH 1.10** | `@red-hat-developer-hub/cli@1.10.x` or last Scalprum-capable `2.0.x` | Rebuild and publish a **1.10-specific** tag |

Prefer separate image tags (or version lines) per RHDH major/minor rather than assuming one OCI tag covers both default 1.10 and 2.1.

---

## Related developer documentation

- [rhdh-cli Migrating to 2.1.0](https://github.com/redhat-developer/rhdh-cli#migrating-to-210)
- [Prepare your custom plug-ins for RHDH 2.1](https://developers.redhat.com/articles/2026/10/20/prepare-your-custom-plug-ins-red-hat-developer-hub-21) — dual-export, NFS, config migration for plugin authors
- [Migrating config to the new frontend system](https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/migrating-config-to-new-frontend-system.md)
- [Export derived package](https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/export-derived-package.md)
- [Packaging and publishing as a dynamic plugin](https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/packaging-dynamic-plugins.md#packaging-and-publishing-backstage-plugin-as-a-dynamic-plugin)
- [Red Hat Developer Hub Life Cycle](https://access.redhat.com/support/policy/updates/developerhub)
- Customer install guide: [`../installing-on-rhdh.md`](../installing-on-rhdh.md)
