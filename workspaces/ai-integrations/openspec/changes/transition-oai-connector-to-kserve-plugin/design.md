## Context

The existing OpenShift AI Connector uses a golang-based sidecar architecture: a K8s controller watches `InferenceService` resources, a `rhoai-normalizer` converts data to `ModelCatalog` JSON, a `storage-rest` sidecar serves it, and a `location` sidecar exposes discovery. The `catalog-backend-module-model-catalog` entity provider in RHDH polls the bridge sidecar's REST API to ingest entities.

The RHDHPLAN-944 spike (RHIDP-11757) produced a working prototype on branch [`gabemontero/rhdh-plugins:kserve-kubeflow-connector`](https://github.com/gabemontero/rhdh-plugins/tree/kserve-kubeflow-connector) that replaces the golang sidecars with a TypeScript backend plugin (`kserve-kubeflow-connector-backend`) using `@kubernetes/client-node` Informers and REST clients. The prototype was demoed successfully against RHOAI.

This design builds on that prototype. The primary remaining decisions are around entity type modeling (upstream alignment), credential configuration (move off env vars), model registry removal, and whether the result is a community plugin or downstream-only.

### Stakeholders

- **Gabe Montero** — Feature lead, prototype author
- **Ben Wilcock** — PM/reporter
- **COPE team** — Upstream Backstage engagement
- **RHOAI team** — KubeFlow Model Catalog API compatibility

## Goals / Non-Goals

**Goals:**

- Standalone dynamic plugin with zero sidecar containers required
- Direct K8s Informer on KServe `InferenceService` resources (replacing golang controller)
- Direct REST client for KubeFlow Model Catalog APIs (replacing bridge sidecar)
- Entity type aligned with upstream Backstage API entity discriminated union (or compatible fallback)
- Credential configuration via Backstage K8s plugin config (not env vars)
- Compatible with generic KServe installations (not just RHOAI)
- Compatible with RHOAI 2.25+ for Model Catalog features
- Community Supported status (replacing Developer Preview)

**Non-Goals:**

- KubeFlow Model Registry integration (being removed, not replaced)
- Frontend UI changes (ai-experience plugin is a separate concern, being moved/removed)
- Merging catalog-techdoc-url-reader-backend into the connector plugin (deferred per Decision 6; prototype modified it but the current plugin-to-plugin approach is kept for initial release)
- Migration tooling for users on the current sidecar architecture
- Support for non-KServe model servers (SageMaker, Azure ML, etc.)
- MLFlow Model Registry integration

## Decisions

### Decision 1: Two-plugin architecture — connector + entity provider

**Choice:** Keep the `kserve-kubeflow-connector-backend` plugin separate from `catalog-backend-module-model-catalog`. The connector plugin owns data acquisition (Informers, REST clients, in-memory state) and exposes REST endpoints. The entity provider module polls those endpoints to ingest catalog entities.

**Rationale:** This matches the prototype's architecture and mirrors the existing sidecar separation of concerns — the connector replaces the sidecars, the entity provider remains the catalog integration point. It also allows the connector to be used independently of the Backstage catalog (e.g., for direct API consumption).

**Alternative considered:** Merge everything into a single plugin. Rejected because it couples data acquisition lifecycle to entity provider scheduling, and makes it harder to test or reuse the connector independently.

### Decision 2: K8s credential configuration via Backstage K8s plugin config

**Choice:** Migrate from `K8S_TOKEN` / `KUBECONFIG` env vars to using Backstage's existing K8s plugin configuration (`kubernetes.clusterLocatorMethods` in `app-config.yaml`), following the pattern used by the [OCM plugin](https://github.com/backstage/community-plugins/tree/main/workspaces/ocm/plugins/ocm).

**Rationale:** Env vars are a prototype shortcut. Backstage has a well-established K8s config pattern that supports multiple clusters, service account tokens, and OIDC. Using it means platform engineers don't need to learn a new config surface. It also positions the plugin better for upstream acceptance.

**Alternative considered:** Custom plugin-specific config section. Rejected because it duplicates what Backstage already provides and would be a blocker for upstream acceptance.

**Open question:** The prototype also uses `LIFECYCLE`, `OWNER`, and `POLLING_INTERVAL` env vars. These should move to `app-config.yaml` under `catalog.providers.modelCatalog` (extending the existing config schema), but the exact shape needs to be finalized.

### Decision 3: Entity type — upstream API discriminated union, with catalog-model fallback

**Choice:** First attempt to get `ai-model-server` accepted into the upstream Backstage API entity discriminated union (aligning with what merged for MCP servers). If upstream rejects this, fall back to using Backstage's catalog model layer to create a custom entity type whose schema matches the API discriminated union shape.

**Rationale:** PM is aligned on this approach. The MCP server entity type precedent shows upstream is open to extending the API kind. Schema alignment in the fallback case means minimal code change if upstream acceptance comes later.

**Impact on delivery:** The upstream path requires RFC/BEP engagement (external dependency, timeline measured in weeks/months). The fallback can be implemented immediately. Implementation should use an abstraction layer so the entity type source is swappable.

**Alternative considered:** Use existing Component/Resource/API kinds (current approach). Rejected because it doesn't accurately represent what AI model servers are, and PM wants alignment with the upstream direction.

### Decision 4: Remove KubeFlow Model Registry (KFMR) interaction

**Choice:** Remove all KFMR client code (`Kfmr.ts`, related types, KFMR-specific label handling in `InformerService.ts`). The connector will only interact with:

- KServe API (K8s Informer on `InferenceService` CRs)
- KubeFlow Model Catalog API (REST client for `CatalogSource`, `CatalogModel`/`ModelCard`)

**Rationale:** KFMR is explicitly out of scope in RHDHPLAN-404. The prototype includes it because it was a direct golang conversion, but the feature definition calls for dropping it. This significantly reduces the connector's surface area (~837 lines in `Kfmr.ts` alone, plus cross-references in `InformerService.ts`).

**Risk:** If RHOAI's KubeFlow Model Catalog API depends on KFMR data for model card resolution, we'll need to verify that the catalog API alone is sufficient. Validate against RHOAI 2.25+.

### Decision 5: Community plugin vs. downstream-only

**Choice:** Target community plugin in `backstage/community-plugins`, contingent on COPE approval. If COPE blocks, deliver as downstream RHDH dynamic plugin.

**Rationale:** Community is a goal of RHDHPLAN-404 and broadens the user base. The community vs. downstream decision also affects K8s client usage (community plugins tend to use K8s SDK directly, downstream could use Backstage's K8s plugin).

**Impact:** Community plugin path requires the upstream entity type decision (Decision 3) to be at least partially resolved — either accepted upstream, or the fallback approach must be demonstrably compatible. This gates the final packaging step but not the core implementation.

### Decision 6: TechDocs / model card integration approach

**Choice:** For the initial release, keep the prototype's approach of serving model cards via the connector's REST API. The prototype already modified `catalog-techdoc-url-reader-backend` to enable this plugin-to-plugin integration. Defer merging the techdoc reader into the connector (a TODO from the spike) to a follow-up.

**Rationale:** The plugin-to-plugin REST call workaround works — the prototype demonstrated this with modifications to both `kserve-kubeflow-connector-backend` (serving model cards) and `catalog-techdoc-url-reader-backend` (consuming them). Merging the two is cleaner but shouldn't block the primary deliverable. If the plugin moves upstream, the upstream community may have opinions on the right pattern.

## Risks / Trade-offs

**Upstream entity type timeline is unbounded** → Implement the fallback (custom entity type via catalog model layer) first. Treat upstream acceptance as a future enhancement, not a blocker. The abstraction layer from Decision 3 makes switching cheap.

**KFMR removal may break Model Catalog features on RHOAI** → Validate early against RHOAI 2.25+ that KubeFlow Model Catalog API works independently of Model Registry. If it doesn't, scope down to KServe-only for initial release and add KubeFlow Catalog support when the API is confirmed standalone.

**K8s credential config migration may surface edge cases** → The OCM plugin is the reference implementation. If Backstage's K8s plugin config doesn't cover a specific RHOAI auth pattern (e.g., custom CA bundles for internal clusters), document it as a known limitation and address in a follow-up.

**InformerService is 1400 lines of ported golang** → The prototype was Claude-assisted conversion. It works (demoed), but may contain patterns that don't fit TypeScript idioms. Plan for a refactoring pass during implementation, but don't let it block delivery.

**Community plugin acceptance is not guaranteed** → COPE may require changes. Keep the plugin architecture clean enough that it can be packaged either way without major rework.

## Migration Plan

1. **No automatic migration** — users on the sidecar architecture must manually remove sidecar containers from their RHDH Deployment YAML and update `app-config.yaml` with the new plugin config
2. **Documentation** — rewrite the installation guide with a clear "migrating from sidecar connector" section
3. **Extensions Catalog** — replace the old entry; the old plugin name/package should not be reused to avoid confusion
4. **Rollback** — users can revert to the sidecar architecture by re-adding the sidecar containers and reverting config; the two approaches are independent

## Open Questions

1. **KubeFlow Model Catalog API independence** — Does the Catalog API on RHOAI 2.25+ work without Model Registry? Needs validation before KFMR removal is finalized.
2. **Exact `app-config.yaml` schema** — What does the config shape look like after merging K8s plugin config with model catalog provider config? Need to prototype and document.
3. **COPE approval timeline** — When can we get a decision on community plugin acceptance? This gates final packaging but not implementation.
4. **Upstream RFC/BEP status** — What's the state of the MCP server entity type decisions? Ben Lambert was to circle back — those decisions inform our AI Model Server proposal.
