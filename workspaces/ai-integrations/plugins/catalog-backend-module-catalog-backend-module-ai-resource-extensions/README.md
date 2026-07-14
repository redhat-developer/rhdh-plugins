# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-catalog-backend-module-ai-resource-extensions

A Backstage catalog backend module that validates RHDH-specific extension
fields on AIResource entities.

## Validation

The `AIResourceExtensionsProcessor` validates RHDH extension fields on
`AIResource` entities. Non-AIResource entities pass through unchanged.

### `spec.scope`

When present, `spec.scope` must be one of:

- `organization`
- `product`
- `team`

Omitting `spec.scope` is valid. Invalid values produce an actionable error
naming the field, the received value, and the accepted values.

## Public API

| Export                          | Description                                             |
| ------------------------------- | ------------------------------------------------------- |
| `AIResourceExtensionsProcessor` | `CatalogProcessor` for RHDH AIResource extension fields |
| `VALID_AI_RESOURCE_SCOPES`      | Readonly tuple of accepted scope values                 |
| `AIResourceScope`               | Type union of accepted scope values                     |
