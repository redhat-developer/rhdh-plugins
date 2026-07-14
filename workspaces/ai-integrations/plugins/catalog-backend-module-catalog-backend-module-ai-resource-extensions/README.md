# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-catalog-backend-module-ai-resource-extensions

A Backstage catalog backend module that validates RHDH-specific extension
fields on AIResource entities.

## Validation

### `spec.scope`

The `AIResourceScopeProcessor` validates the optional `spec.scope` field on
`AIResource` entities. When present, `spec.scope` must be one of:

- `organization`
- `product`
- `team`

Omitting `spec.scope` is valid. Invalid values produce an actionable error
naming the field, the received value, and the accepted values.

Non-AIResource entities pass through unchanged.

## Public API

| Export                     | Description                                    |
| -------------------------- | ---------------------------------------------- |
| `AIResourceScopeProcessor` | `CatalogProcessor` that validates `spec.scope` |
| `VALID_AI_RESOURCE_SCOPES` | Readonly tuple of accepted scope values        |
| `AIResourceScope`          | Type union of accepted scope values            |
