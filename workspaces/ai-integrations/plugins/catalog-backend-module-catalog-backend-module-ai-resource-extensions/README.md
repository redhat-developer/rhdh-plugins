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

#### `spec.location.target` (OCI)

When `spec.location.type` is `oci`, validates that `spec.location.target`
is a well-formed `oci://registry/repository[:tag|@digest]` URI. Validation
is format-only — the processor makes no outbound registry or HTTP calls.

## Public API

| Export                          | Description                                             |
| ------------------------------- | ------------------------------------------------------- |
| `AIResourceExtensionsProcessor` | `CatalogProcessor` for RHDH AIResource extension fields |
| `VALID_AI_RESOURCE_SCOPES`      | Readonly tuple of accepted scope values                 |
| `AIResourceScope`               | Type union of accepted scope values                     |
