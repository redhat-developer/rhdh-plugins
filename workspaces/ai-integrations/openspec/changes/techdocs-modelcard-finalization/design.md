# Design: TechDocs / Model Card Integration Finalization

## Canonical Touchpoints

- Parent design: `openspec/changes/transition-oai-connector-to-kserve-plugin/design.md` — Decision 6
- Jira: [RHIDP-15205](https://redhat.atlassian.net/browse/RHIDP-15205)

## Context

The TechDocs / model card pipeline spans three plugins:

1. **`kserve-kubeflow-connector-backend`** — K8s Informer watches InferenceService CRs, `KServe.ts` converts them to `ModelCatalog` JSON with annotations including `TechDocsKey`, router serves model card markdown at `/modelcard/:sourceId/*`
2. **`catalog-backend-module-model-catalog`** — Entity provider polls the connector's REST API. `ModelCatalogGenerator.ts` (lines 149-159) transforms the `TechDocsKey` annotation: prepends `svcUrl` (the connector's base URL) and wraps in `url:` prefix to produce the `backstage.io/techdocs-ref` annotation
3. **`catalog-techdoc-url-reader-backend`** — Custom URL reader that matches `backstage.io/techdocs-ref` URLs containing `modelcard` and a known connector ID. Fetches the markdown, writes it to disk with a `mkdocs.yml`, and returns a tree response for the TechDocs builder

The `url:` prefix on `backstage.io/techdocs-ref` is a Backstage convention that triggers URL reader dispatch. The entity provider already handles adding this prefix — KServe.ts must set TechDocsKey as a **path only** (e.g., `/modelcard/sourceId/modelName`), not a full URL.

### Data flow

```
InferenceService CR (K8s)
  ↓ [Informer watch]
KServe.ts: generateModelCatalog()
  → sets TechDocsKey = "/modelcard/<sourceId>/<modelName>" (path only)
  ↓ [REST API: /models/:model/:version]
ModelCatalogGenerator.ts (entity provider)
  → reads TechDocsKey annotation
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

- Connector resolves its own base URL via `coreServices.discovery` and threads it through the config chain
- Auto-set TechDocsKey path when catalog annotations are present on InferenceService CRs
- Wildcard route handles model names containing slashes
- URL reader generates `mkdocs.yml` for TechDocs builder compatibility
- URL reader config aligned with cluster-nested config structure
- Config schema declares all new fields in `config.d.ts`
- `yarn build:all`, `yarn tsc`, unit tests, prettier, and lint pass
- Integration tested against upstream KServe/Kubeflow and RHOAI on OCP

**Non-Goals:**

- Merging url-reader into the connector (deferred per parent Decision 6)
- Resolving plugin-to-plugin auth (RHDH_TOKEN workaround stays)
- Multi-cluster support (TODO placed, deferred)
- TechDocs search index population (separate Backstage concern)

## Decisions

### D1 — Use `coreServices.discovery` for connector self-URL resolution

**Choice:** Add `discovery: coreServices.discovery` to the connector plugin's deps. Call `discovery.getBaseUrl('kserve-kubeflow-connector')` at init time and store the result as `connectorBaseUrl` on `ConnectorConfig`. Thread it through `ReconcilerConfig` to `KServe.ts`.

**Rationale:** The connector needs to construct TechDocsKey URLs pointing back at its own `/modelcard` endpoint. Hardcoding `localhost:7007` would break in any non-dev deployment. `DiscoveryService` is the standard Backstage mechanism for plugin URL resolution, already used by other plugins in the workspace.

**Alternative considered:** Read the URL from `app-config.yaml`. Rejected because `DiscoveryService` already derives this from the backend config and handles proxy/ingress scenarios correctly.

### D2 — TechDocsKey is a path, not a full URL

**Choice:** In `KServe.ts`, set `techdocsUrl = `/modelcard/${sourceId}/${modelName}`\` — a path relative to the connector's base URL. Do not include `connectorBaseUrl` or the `url:` prefix in the annotation value.

**Rationale:** `ModelCatalogGenerator.ts` (lines 149-159) already handles the full URL construction:

1. Reads the `TechDocs` annotation key from the model
2. Prepends `svcUrl` (the connector's base URL, passed by the entity provider)
3. Wraps the result in `url:` prefix

If KServe.ts included the full URL or the `url:` prefix, the result would be double-concatenated (e.g., `url:http://...url:http://...`). The path-only approach keeps KServe.ts decoupled from the entity provider's URL construction logic.

### D3 — Wildcard route for multi-segment model names

**Choice:** Change the Express route from `/modelcard/:sourceId/:modelName` to `/modelcard/:sourceId/*`. Access the model name via `(req.params as Record<string, string>)[0]`.

**Rationale:** KubeFlow Model Catalog model names frequently contain slashes (e.g., `RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16`). Express named parameters (`:modelName`) only capture a single path segment. The wildcard `*` captures everything after `sourceId/` into `req.params[0]`, matching the key format used by `InformerService.ts` (`${catalogSource}/${catalogModel}`).

**Alternative considered:** URL-encode slashes in the model name when constructing the path in KServe.ts. Rejected because the stored model card key in the `modelCards` Map uses the raw unencoded form from the catalog annotations — encoding in one place and not the other would cause lookup mismatches.

**Alternative considered:** Switch to query parameters (`/modelcard?sourceId=...&modelName=...`) like the old golang sidecar. Rejected because it would require changing the router, all callers, and the url-reader's predicate matching — more disruption for no benefit.

### D4 — Generate minimal `mkdocs.yml` in url-reader `dir()` method

**Choice:** Write a minimal `mkdocs.yml` (`site_name: Model Card\nnav:\n  - Home: index.md\n`) alongside the `docs/index.md` in the url-reader's `dir()` method.

**Rationale:** Backstage's TechDocs generator runs `mkdocs build` which requires `mkdocs.yml` at the project root. The generator's `patchMkdocsYmlWithPlugins` function reads and patches this file to inject the `techdocs-core` plugin. Without it, the build fails with "Could not read MkDocs YAML config file". The old golang sidecar may have worked with a Backstage version (1.42) that didn't require this, but the current version (1.52) does.

### D5 — Two-level config iteration in url-reader

**Choice:** Update `readBridgeConfigs` to iterate connector keys then cluster sub-keys, filtering out non-cluster keys (e.g., `schedule`) that may coexist at the connector level:

```typescript
for (const connectorId of configs.keys()) {
  const connectorConfig = configs.getConfig(connectorId);
  for (const clusterKey of connectorConfig.keys()) {
    const clusterConfig = connectorConfig.getOptionalConfig(clusterKey);
    if (!clusterConfig || !clusterConfig.has('kubeflow-model-catalog-url')) {
      continue; // skip connector-level non-cluster objects (e.g., schedule)
    }
    result.push(readBridgeConfig(connectorId, clusterConfig));
  }
}
```

**Rationale:** The config structure nests cluster keys under connector keys (e.g., `kserve-kubeflow-connector.cluster-1`). The old flat iteration (`configs.keys().map(id => readBridgeConfig(id, ...))`) treated the connector key as the leaf, missing the cluster level entirely. The entity provider's config reading (`readModelCatalogApiEntityConfigs`) uses flat single-level iteration for its own connector-level fields and is unaffected by this change. Connector-level keys like `schedule` may coexist alongside cluster sub-keys, so the iteration must filter them via `getOptionalConfig` and field presence checks.

### D6 — Config schema in config.d.ts uses index signature for cluster sub-keys

**Choice:** Add cluster sub-key fields to the existing `config.d.ts` using a `[clusterKey: string]` index signature within the connector key object:

```typescript
[clusterKey: string]:
  | { name?: string; 'kubeflow-model-catalog-url'?: string; 'default-owner'?: string; 'default-lifecycle'?: string; }
  | string | SchedulerServiceTaskScheduleDefinitionConfig | undefined;
```

**Rationale:** Backstage's config validation silently strips fields not declared in any plugin's `config.d.ts`. Without this declaration, `providerConfigs.keys()` returns an empty array because the cluster sub-keys and their fields don't pass validation. The union type accommodates both the new cluster sub-key objects and the existing scalar/schedule fields at the connector level.

## Risks / Trade-offs

| Risk                                                                                              | Mitigation                                                                                                 |
| ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `config.d.ts` union type is permissive — allows invalid field combinations at the connector level | Acceptable for prototyping; a stricter schema can be added when the config shape stabilizes                |
| `connectorBaseUrl` is resolved once at init — won't track dynamic URL changes                     | Standard Backstage pattern; `DiscoveryService` is designed for init-time resolution                        |
| Wildcard route matches any number of path segments — could match unintended URLs                  | The model card key lookup in `getModelCard()` will return `undefined` for unknown keys, resulting in a 404 |
| `mkdocs.yml` is minimal — may not work with all mkdocs themes or plugins                          | TechDocs patcher auto-injects `techdocs-core`; the minimal config is sufficient                            |
| Multi-cluster TODO is unimplemented — only the first cluster key is used                          | Documented with TODO comment; sufficient for single-cluster deployments                                    |

## Verification

After all changes:

1. `yarn tsc` passes with no errors
2. `yarn build:all` succeeds
3. Unit tests pass (`yarn test -- --watchAll=false` in url-reader plugin)
4. Prettier and lint checks pass
5. `curl http://localhost:7007/api/kserve-kubeflow-connector/modelcard/redhat_ai_validated_models/RedHatAI/Meta-Llama-3.1-8B-Instruct-quantized.w4a16` returns 200 with model card markdown (assumes RHDH running locally via `yarn dev` from the `ai-integrations` workspace)
6. TechDocs page renders in browser for entities with auto-set `backstage.io/techdocs-ref`
7. Integration tested against upstream KServe/Kubeflow and RHOAI on OCP
