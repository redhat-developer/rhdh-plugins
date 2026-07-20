# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-catalog-backend-module-ai-resource-extensions

A Backstage catalog backend module that validates RHDH-specific extension
fields on AIResource entities.

## Validation

The module registers two catalog processors for `AIResource` entities.
Non-AIResource entities pass through unchanged.

### `AIResourceExtensionsProcessor`

Validates RHDH extension fields on `AIResource` entities.

#### `spec.scope`

When present, `spec.scope` must be one of:

- `organization`
- `product`
- `team`

Omitting `spec.scope` is valid. Invalid values produce an actionable error
naming the field, the received value, and the accepted values.

### `AIResourceOciProcessor`

When `spec.location.type` is `oci`, validates that `spec.location.target`
is a well-formed `oci://registry/repository[:tag|@digest]` URI. Validation
is format-only — the processor makes no outbound registry or HTTP calls.

## Schema Fields

An `AIResource` entity uses `apiVersion: backstage.io/v1beta1` and
`kind: AIResource`. The following `spec` fields are relevant:

| Field                  | Required | Description                                                                                      |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| `spec.type`            | yes      | The type of AI asset (e.g. `model`)                                                              |
| `spec.lifecycle`       | yes      | Lifecycle stage (e.g. `experimental`, `production`)                                              |
| `spec.owner`           | yes      | Owning entity reference (e.g. `team-data-science`)                                               |
| `spec.scope`           | no       | RHDH extension. Accepted values: `organization`, `product`, `team`. Omitting the field is valid. |
| `spec.location.type`   | yes      | Source type — `git` or `oci`                                                                     |
| `spec.location.target` | yes      | Location URI. For `git`: a repository URL. For `oci`: an `oci://` URI (see below).               |

### `spec.scope` Values

| Value          | Description                                           |
| -------------- | ----------------------------------------------------- |
| `organization` | The AI asset is shared across the entire organization |
| `product`      | The AI asset is scoped to a specific product          |
| `team`         | The AI asset is scoped to a specific team             |

## Registering an AIResource Entity

AIResource entities are registered through the standard RHDH catalog
interfaces — no AIResource-specific registration flow is required.

### Git-backed entities

1. Create a `catalog-info.yaml` with `kind: AIResource` and
   `spec.location.type: git`.
2. Add a `backstage.io/source-location` annotation pointing to the
   repository URL. The standard Backstage `UrlReaderProcessor` uses this
   annotation for ingestion.
3. Register the file via the RHDH catalog URL registration UI or include
   it in a catalog location for auto-discovery.

See [`examples/ai-resource-git.yaml`](../../examples/ai-resource-git.yaml)
for a complete example.

### OCI-backed entities

1. Create a `catalog-info.yaml` with `kind: AIResource` and
   `spec.location.type: oci`.
2. Set `spec.location.target` to an `oci://` URI pointing to the OCI
   artifact (e.g. `oci://quay.io/my-org/my-model:latest`).
3. Register the file via the RHDH catalog URL registration UI or include
   it in a catalog location for auto-discovery.

See [`examples/ai-resource-oci.yaml`](../../examples/ai-resource-oci.yaml)
for a complete example.

## OCI Validation-Only Behavior

The `AIResourceOciProcessor` validates the `spec.location.target` format
when `spec.location.type` is `oci`. It checks:

- The target is a non-empty string with no leading or trailing whitespace.
- The target starts with the `oci://` scheme prefix.
- The URI contains at least a registry and a repository path
  (e.g. `oci://quay.io/org/model:tag`).

**The processor makes zero outbound network calls.** It does not contact
OCI registries, pull manifests, or verify that the referenced artifact
exists. The catalog indexes the OCI reference as metadata only.

This design is intentional for air-gap safety: RHDH deployments in
disconnected environments can register OCI-backed AI assets without
requiring network access to the artifact registry at ingestion time.
The OCI URI serves as a stable reference that downstream tooling can
resolve when registry access is available.

## Public API

| Export                          | Description                                             |
| ------------------------------- | ------------------------------------------------------- |
| `AIResourceExtensionsProcessor` | `CatalogProcessor` for RHDH AIResource extension fields |
| `AIResourceOciProcessor`        | `CatalogProcessor` for OCI location format validation   |
| `VALID_AI_RESOURCE_SCOPES`      | Readonly tuple of accepted scope values                 |
| `AIResourceScope`               | Type union of accepted scope values                     |
