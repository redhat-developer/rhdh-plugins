# Design

## Module and provider registration

The implementation is a Catalog backend module with plugin ID `catalog` and
module ID `ogx-entity-provider`. It registers one model entity provider and one
agent entity provider with the Catalog processing extension point. Both
providers use the Backstage scheduler for periodic refreshes.

The default model refresh interval is 60 seconds and the default agent refresh
interval is 300 seconds. These intervals are configurable through
`boost.entityProviders.ogx`.

## Configuration resolution

The module first reads `boost.entityProviders.ogx`. If that configuration is
not present, it falls back to `boost.providers.ogx`. If neither is present,
the OGX base URL defaults to `http://localhost:8321`.

The primary configuration supports the base URL, optional API key, model and
agent refresh intervals, default agent settings, maximum agent turns, and the
configured agent list. The legacy `boost.providers.ogx` fallback does not read
the refresh interval fields, so the default intervals apply on that path.

## Model-server entities

The model provider requests `${baseUrl}/v1/models` and optionally sends the
configured API key as a Bearer token. It emits one `AiModelServerAPI` entity
with type `ai-model-server`, server type `openai-v1`, and the models returned by
OGX.

The entity identifies its category as `model-server`, its source as `ogx`, and
uses the SDK's normalized version value. When OGX does not provide a version,
the normalized value is `0.0.0-unknown`.

## Agent entities

The agent provider emits the configured agents as `AiResource` entities with
type `agent`. It maps the configured lifecycle, owner, instructions, handoffs,
handoff description, and RAG setting into the entity representation.

Agent entities identify their category as `agent`, their source as `ogx`, and
use a normalized version value, defaulting to `0.0.0-unknown` when no version is
available in the provider input.

## Refresh and failure behavior

Each provider performs a full mutation on refresh. A failed model fetch retains
the previously cached model entity; if no model entity has been emitted yet,
the first failed fetch emits an empty result. Agent refreshes emit the current
configured agent list.

The providers communicate with OGX directly. They do not depend on a Boost
backend plugin or any Boost backend HTTP routes.
