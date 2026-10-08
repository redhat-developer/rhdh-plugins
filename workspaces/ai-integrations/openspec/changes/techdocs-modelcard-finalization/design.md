# Design: TechDocs / Model Card Integration Finalization

## Canonical Touchpoints

- Parent design: `openspec/changes/transition-oai-connector-to-kserve-plugin/design.md` — Decision 6
- Jira: [RHIDP-15205](https://redhat.atlassian.net/browse/RHIDP-15205)

## Context

The TechDocs / model card pipeline spans three plugins:

1. **`kserve-kubeflow-connector-backend`** — K8s Informer watches InferenceService CRs, `KServe.ts` converts them to `ModelCatalog` JSON with annotations including `TechDocsKey`, router serves model card markdown at `/modelcard/:sourceId/*`
2. **`catalog-backend-module-model-catalog`** — Entity provider polls the connector's REST API. `ModelCatalogGenerator.ts` transforms the `TechDocsKey` annotation: for relative paths (starting with `/`), prepends `svcUrl` (the connector's base URL); for full URLs (explicit `rhdh.io/techdocs` annotations), uses the value as-is. Wraps in `url:` prefix to produce the `backstage.io/techdocs-ref` annotation
3. **`catalog-techdoc-url-reader-backend`** — Custom URL reader that matches `backstage.io/techdocs-ref` URLs containing `modelcard` and a known connector ID. Fetches the markdown, writes it to disk with a `mkdocs.yml`, and returns a tree response for the TechDocs builder

The `url:` prefix on `backstage.io/techdocs-ref` is a Backstage convention that triggers URL reader dispatch. The entity provider already handles adding this prefix. When auto-set (no explicit `rhdh.io/techdocs` annotation), KServe.ts sets TechDocsKey as a **path only** (e.g., `/modelcard/sourceId/modelName`). When explicitly set via `rhdh.io/techdocs`, the value can be a full URL pointing to any host.

### Data flow

```
InferenceService CR (K8s)
  ↓ [Informer watch]
KServe.ts: generateModelCatalog()
  → sets TechDocsKey = "/modelcard/<sourceId>/<modelName>" (path only)
  ↓ [REST API: /models/:model/:version]
ModelCatalogGenerator.ts (entity provider)
  → reads TechDocsKey annotation
  → resolves svcUrl via discovery.getBaseUrl('kserve-kubeflow-connector')
  → prepends svcUrl: "http://localhost:7007/api/kserve-kubeflow-connector" (when running via `yarn dev`)
  → wraps in url: prefix
  → sets backstage.io/techdocs-ref = "url:http://localhost:7007/api/kserve-kubeflow-connector/modelcard/<sourceId>/<modelName>"
  ↓ [Backstage TechDocs builder]
ModeCatalogBridgeTechdocUrlReader (url-reader)
  → bridgePredicate matches URL (contains "modelcard" and connector ID)
  → readUrl fetches model card markdown from connector
  → readTree wraps in ModelCatalogBridgeUrlReaderServiceReadTreeResponse
  → dir() writes mkdocs.yml + docs/index.md
  ↓ [mkdocs build]
TechDocs rendered in RHDH UI
```

### Config structure

```yaml
catalog:
  providers:
    modelCatalog:
      kserve-kubeflow-connector:          # connector key
        cluster-1:                         # cluster sub-key
          name: my-k8s-cluster
          kubeflow-model-catalog-url: 'https://...'
          default-owner: team-alpha
          default-lifecycle: production
        cluster-2:                         # future: multiple clusters
          name: another-cluster
          ...
```

Both the connector (`plugin.ts`) and url-reader (`readBridgeConfigs`) navigate this two-level structure. The entity provider's config reading (`readModelCatalogApiEntityConfigs` in `config.ts`) uses flat single-level iteration and reads connector-level fields (e.g., `schedule`) — it does not need the cluster sub-keys and is unaffected by this change. The `config.d.ts` schema must declare these fields or Backstage's config validation silently strips them.

## Goals / Non-Goals

**Goals:**

- Auto-set TechDocsKey path when catalog annotations are present on InferenceService CRs
- Wildcard route handles model names containing slashes
- URL reader generates `mkdocs.yml` for TechDocs builder compatibility
- URL reader config aligned with cluster-nested config structure
- Config schema declares all new fields in `config.d.ts`
- `yarn build:all`, `yarn tsc`, unit tests, prettier, and lint pass
- Integration tested against upstream KServe/Kubeflow and RHOAI on OCP

**Non-Goals:**

- Merging url-reader into the connector (deferred per parent Decision 6)
- Multi-cluster support (TODO placed, deferred)
- TechDocs search index population (separate Backstage concern)

## Decisions

### D1 — TechDocsKey is a path, not a full URL; entity provider discovers the connector base URL

**Choice:** In `KServe.ts`, set `techdocsUrl = `/modelcard/${sourceId}/${modelName}`\` — a path only. Do not include the connector's base URL or the `url:` prefix in the annotation value. The connector plugin does NOT use `coreServices.discovery` — the entity provider (`catalog-backend-module-model-catalog`) already resolves the connector's base URL via its own `DiscoveryService` and prepends it when constructing the `backstage.io/techdocs-ref` annotation.

**Rationale:** `ModelCatalogGenerator.ts` handles the URL construction:

1. Reads the `techdocs` annotation key from the model
2. Calls `discovery.getBaseUrl(this.name)` to get `svcUrl` (the connector's base URL)
3. If the value starts with `/` (relative path), prepends `svcUrl`; if it's already a full URL (explicit `rhdh.io/techdocs` annotation), uses it as-is
4. Wraps the result in `url:` prefix

The auto-set path-only approach keeps KServe.ts decoupled from the entity provider's URL construction logic, while explicit `rhdh.io/techdocs` annotations allow full URLs pointing to any host (e.g., external documentation repositories). The connector does not need its own `DiscoveryService` dependency since all URL resolution happens in the entity provider.

### D2 — Wildcard route for multi-segment model names

**Choice:** Change the Express route from `/modelcard/:sourceId/:modelName` to `/modelcard/:sourceId/*`. Access the model name via `(req.params as Record<string, string>)[0]`.

**Rationale:** KubeFlow Model Catalog model names frequently contain slashes (e.g., `RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16`). Express named parameters (`:modelName`) only capture a single path segment. The wildcard `*` captures everything after `sourceId/` into `req.params[0]`, matching the key format used by `InformerService.ts` (`${catalogSource}/${catalogModel}`).

**Alternative considered:** URL-encode slashes in the model name when constructing the path in KServe.ts. Rejected because the stored model card key in the `modelCards` Map uses the raw unencoded form from the catalog annotations — encoding in one place and not the other would cause lookup mismatches.

**Alternative considered:** Switch to query parameters (`/modelcard?sourceId=...&modelName=...`) like the old golang sidecar. Rejected because it would require changing the router, all callers, and the url-reader's predicate matching — more disruption for no benefit.

### D3 — Generate minimal `mkdocs.yml` in url-reader `dir()` method

**Choice:** Write a minimal `mkdocs.yml` (`site_name: Model Card\nnav:\n  - Home: index.md\n`) alongside the `docs/index.md` in the url-reader's `dir()` method.

**Rationale:** Backstage's TechDocs generator runs `mkdocs build` which requires `mkdocs.yml` at the project root. The generator's `patchMkdocsYmlWithPlugins` function reads and patches this file to inject the `techdocs-core` plugin. Without it, the build fails with "Could not read MkDocs YAML config file". The old golang sidecar may have worked with a Backstage version (1.42) that didn't require this, but the current version (1.52) does.

### D4 — Two-level config iteration in url-reader

**Choice:** Update `readBridgeConfigs` to iterate connector keys then cluster sub-keys, filtering out non-cluster keys (e.g., `schedule`) that may coexist at the connector level:

```typescript
for (const connectorId of configs.keys()) {
  const connectorConfig = configs.getConfig(connectorId);
  for (const clusterKey of connectorConfig.keys()) {
    const clusterConfig = connectorConfig.getOptionalConfig(clusterKey);
    if (!clusterConfig) {
      continue;
    }
    result.push(readBridgeConfig(connectorId, clusterConfig));
  }
}
```

**Rationale:** The config structure nests cluster keys under connector keys (e.g., `kserve-kubeflow-connector.cluster-1`). The old flat iteration (`configs.keys().map(id => readBridgeConfig(id, ...))`) treated the connector key as the leaf, missing the cluster level entirely. The entity provider's config reading (`readModelCatalogApiEntityConfigs`) uses flat single-level iteration for its own connector-level fields and is unaffected by this change. Non-config sub-keys are filtered by `getOptionalConfig` returning falsy. The iteration does NOT gate on `has('kubeflow-model-catalog-url')` — see D6 for why.

### D5 — Config schema in config.d.ts uses index signature for cluster sub-keys

**Choice:** Add cluster sub-key fields to the existing `config.d.ts` using a `[clusterKey: string]` index signature within the connector key object:

```typescript
[clusterKey: string]:
  | { name?: string; 'kubeflow-model-catalog-url'?: string; 'default-owner'?: string; 'default-lifecycle'?: string; }
  | string | SchedulerServiceTaskScheduleDefinitionConfig | undefined;
```

**Rationale:** Backstage's config validation silently strips fields not declared in any plugin's `config.d.ts`. Without this declaration, `providerConfigs.keys()` returns an empty array because the cluster sub-keys and their fields don't pass validation. The union type accommodates both the new cluster sub-key objects and the existing scalar/schedule fields at the connector level.

### D6 — Do not gate on `has('kubeflow-model-catalog-url')` in url-reader config iteration

**Choice:** Accept any sub-config under the connector key as a cluster config. Do not require `kubeflow-model-catalog-url` to be present — it is optional and discoverable on OCP.

**Rationale:** Backstage's `ConfigReader.has()` returns `false` for config keys whose values come from env var substitution with empty defaults (e.g., `${KUBEFLOW_MODEL_CATALOG_URL:-}`), even when the env var is set in the process environment. This caused `readBridgeConfigs` to skip all cluster configs, producing zero `BridgeConfig` entries. The url-reader's `bridgePredicate` then returned `false` for every URL, and TechDocs triggered `NotAllowedError: Reading from '...' is not allowed` because no URL reader matched.

**Alternative considered:** Use `getOptionalString` instead of `has` as the gate. Rejected because `kubeflow-model-catalog-url` is genuinely optional — when running on OCP, the connector can discover the Kubeflow Model Catalog URL from the cluster.

### D7 — `safeGetOptionalString` wrapper for Backstage ConfigReader TypeError

**Choice:** Wrap `config.getOptionalString(key)` in a try/catch that returns `''` on TypeError. Used for all optional string config reads in `readBridgeConfig`.

**Rationale:** Backstage's `ConfigReader` throws a `TypeError` when `getOptionalString` encounters an empty string value produced by env var substitution like `${VAR:-}`. This is arguably a Backstage bug — `getOptionalString` should return `undefined` or `''` for empty values, not throw. The wrapper makes config reading robust against this edge case without requiring upstream fixes.

### D8 — Service-to-service token for url-reader → connector auth

**Choice:** The url-reader uses Backstage's `getPluginRequestToken` with `targetPluginId: 'kserve-kubeflow-connector'` to authenticate requests to the connector's `/modelcard` endpoint. No `RHDH_TOKEN` env var fallback.

**Rationale:** The initial implementation used a static admin token (`RHDH_TOKEN` env var) as a fallback because service-to-service auth was untested. Debugging revealed two issues: (1) the `targetPluginId` was incorrectly set (wrong plugin ID), and (2) the bridge configs were empty (see D6), so the predicate never matched and auth was never attempted. After fixing both, service-to-service auth works correctly. The `RHDH_TOKEN` env var is still required for Backstage's `backend.auth.externalAccess` config but is no longer used by the url-reader at request time.

## Risks / Trade-offs

| Risk                                                                                              | Mitigation                                                                                                 |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `config.d.ts` union type is permissive — allows invalid field combinations at the connector level | Acceptable for prototyping; a stricter schema can be added when the config shape stabilizes                |
| Wildcard route matches any number of path segments — could match unintended URLs                  | The model card key lookup in `getModelCard()` will return `undefined` for unknown keys, resulting in a 404 |
| `mkdocs.yml` is minimal — may not work with all mkdocs themes or plugins                          | TechDocs patcher auto-injects `techdocs-core`; the minimal config is sufficient                            |
| Multi-cluster TODO is unimplemented — only the first cluster key is used                          | Documented with TODO comment; sufficient for single-cluster deployments                                    |
| Backstage `ConfigReader.has()` unreliable for env var substitution defaults                       | Avoided entirely (D6); `safeGetOptionalString` (D7) handles the related `getOptionalString` TypeError      |
| `safeGetOptionalString` swallows all errors, not just TypeError                                   | Acceptable — the catch returns `''` which is the same as a missing optional field                          |

## Verification

After all changes:

1. `yarn tsc` passes with no errors
2. `yarn build:all` succeeds
3. Unit tests pass (`yarn test -- --watchAll=false` in url-reader plugin)
4. Prettier and lint checks pass
5. `curl http://localhost:7007/api/kserve-kubeflow-connector/modelcard/redhat_ai_validated_models/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16` returns 200 with model card markdown (assumes RHDH running locally via `yarn dev` from the `ai-integrations` workspace)
6. TechDocs page renders in browser for entities with auto-set `backstage.io/techdocs-ref`
7. Integration tested against upstream KServe/Kubeflow and RHOAI on OCP
