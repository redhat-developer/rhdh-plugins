# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-resource-agent

A Backstage catalog backend module that registers the agent-shaped
`AiResource` catalog model and validates agent-specific fields at
ingestion.

This package is intentionally separate from
`catalog-backend-module-ai-resource-extensions`, which owns shared RHDH
extensions such as `spec.scope` and OCI `source-location` checks.

## What it registers

On init the module:

1. Adds the agent catalog model source (`agentAiResourceEntityModel`) for
   `kind: AiResource`, `spec.type: agent`
2. Registers `AiResourceAgentProcessor` for agent field validation during
   catalog processing

## Validation

### `AiResourceAgentProcessor`

Runs only for `kind: AiResource`. When `spec.type` is `'agent'`, validates
agent-specific fields and collects all violations into a single error.
Non-agent AiResource entities (`skill`, `rule`, `model`, …) are unaffected.

| Field                     | Rule                                        |
| ------------------------- | ------------------------------------------- |
| `spec.instructions`       | Optional; must be a string if present       |
| `spec.handoffs`           | Optional; must be an array if present       |
| `spec.tools`              | Optional; must be an array if present       |
| `spec.resetToolChoice`    | Optional; must be a boolean if present      |
| `spec.modelSettings`      | Optional; must be a plain object if present |
| `spec.toolUseBehavior`    | Optional; string or string array if present |
| `spec.outputSchema`       | Optional; string or plain object if present |
| `spec.handoffDescription` | Optional; must be a string if present       |
| `spec.model`              | Optional; must be a string if present       |

`handoffs` / `tools` accept opaque string arrays without entity-ref format
enforcement. Core entity fields such as `spec.owner` and `spec.lifecycle`
are not re-validated here.

Deeper schema typing (including array element types) is handled by the
companion `catalog-model-ai-resource-agent` package.

## Related packages

| Package                                                   | Responsibility                                     |
| --------------------------------------------------------- | -------------------------------------------------- |
| `catalog-model-ai-resource-agent`                         | Types, JSON schema, KindValidator                  |
| `catalog-backend-module-ai-resource-agent` (this package) | Model registration + agent processor               |
| `catalog-backend-module-ai-resource-extensions`           | RHDH `spec.scope` + OCI source-location validation |

## Examples

See [`examples/ai-resource-agents.yaml`](../../examples/ai-resource-agents.yaml)
for router + specialist agent catalog entities.

## Public API

| Export                                   | Description                                                 |
| ---------------------------------------- | ----------------------------------------------------------- |
| `catalogModuleAiResourceAgent` (default) | Backend module that registers the agent model and processor |
| `AiResourceAgentProcessor`               | `CatalogProcessor` for agent-specific field validation      |
