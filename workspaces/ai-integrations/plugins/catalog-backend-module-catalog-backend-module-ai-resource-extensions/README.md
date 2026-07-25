# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-catalog-backend-module-ai-resource-extensions

A Backstage catalog backend module that validates RHDH-specific extension
fields on AIResource entities.

## Validation

The module registers a single catalog processor —
`AIResourceExtensionsProcessor` — for `AIResource` entities.
Non-AIResource entities pass through unchanged.

### `AIResourceExtensionsProcessor`

Validates RHDH extension fields on `AIResource` entities. All constraint
violations are collected and reported in a single error rather than
stopping at the first failure.

#### `spec.scope`

When present, `spec.scope` must be one of:

- `organization`
- `product`
- `team`

Omitting `spec.scope` is valid. Invalid values produce an actionable error
naming the field, the received value, and the accepted values.

#### `backstage.io/source-location` (OCI)

When `backstage.io/source-location` uses the location-ref form
`url:oci://…`, validates that the OCI target is a well-formed
`oci://registry/repository[:tag|@digest]` URI. Validation is format-only —
the processor makes no outbound registry or HTTP calls.

Bare `oci://…` annotations (without the `url:` prefix) are rejected with
an actionable error explaining the required `url:oci://…` format. The
`url:` prefix is required because bare `oci://…` parses as location type
`oci` with a non-URL target, which would break future UrlReader integration.

Non-OCI source-locations (e.g. `url:https://…`) are not subject to OCI
format rules and pass through without validation.

## Schema Fields

An `AIResource` entity uses `apiVersion: backstage.io/v1beta1` and
`kind: AIResource`. The following fields are relevant:

| Field                          | Enforced by this module | Description                                                                                      |
| ------------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------ |
| `spec.type`                    | no¹                     | The type of AI asset (e.g. `model`)                                                              |
| `spec.lifecycle`               | no¹                     | Lifecycle stage (e.g. `experimental`, `production`)                                              |
| `spec.owner`                   | no¹                     | Owning entity reference (e.g. `team-data-science`)                                               |
| `spec.scope`                   | optional, validated     | RHDH extension. Accepted values: `organization`, `product`, `team`. Omitting the field is valid. |
| `backstage.io/source-location` | when target is `oci://` | Standard Backstage annotation. For OCI assets use `url:oci://…` (see below).                     |

¹ These fields are typical for Backstage entities but are **not** validated or
required by the processors in this module. Entities missing these fields will
pass through without error.

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

1. Create a `catalog-info.yaml` with `kind: AIResource`.
2. Set `backstage.io/source-location` to the repository URL using the
   standard location-ref form (e.g. `url:https://github.com/my-org/my-repo`)
   so consumers can locate the source repository.
3. Register the entity YAML via the RHDH catalog URL registration UI or
   include it in a catalog location for auto-discovery.

See [`examples/ai-resource-git.yaml`](../../examples/ai-resource-git.yaml)
for a complete example.

### OCI-backed entities

1. Create a `catalog-info.yaml` with `kind: AIResource`.
2. Set `backstage.io/source-location` to an OCI reference using the
   location-ref form `url:oci://…`
   (e.g. `url:oci://quay.io/my-org/my-model:latest`).

   **Important:** use the `url:oci://…` form — not bare `oci://…`. The
   `url:` prefix is required by the Backstage location-ref convention.

3. Register the file via the RHDH catalog URL registration UI or include
   it in a catalog location for auto-discovery.

See [`examples/ai-resource-oci.yaml`](../../examples/ai-resource-oci.yaml)
for a complete example.

## OCI Validation-Only Behavior

The `AIResourceExtensionsProcessor` validates the `backstage.io/source-location`
annotation when the location-ref target uses the `oci://` scheme. It checks:

- The annotation uses the `url:oci://…` location-ref form (not bare `oci://…`).
- The OCI target is a non-empty string with no leading or trailing whitespace.
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
| `VALID_AI_RESOURCE_SCOPES`      | Readonly tuple of accepted scope values                 |
| `AIResourceScope`               | Type union of accepted scope values                     |
