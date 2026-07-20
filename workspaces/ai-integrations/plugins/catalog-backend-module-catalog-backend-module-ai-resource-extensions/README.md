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

## Public API

| Export                          | Description                                             |
| ------------------------------- | ------------------------------------------------------- |
| `AIResourceExtensionsProcessor` | `CatalogProcessor` for RHDH AIResource extension fields |
| `AIResourceOciProcessor`        | `CatalogProcessor` for OCI location format validation   |
| `VALID_AI_RESOURCE_SCOPES`      | Readonly tuple of accepted scope values                 |
| `AIResourceScope`               | Type union of accepted scope values                     |
