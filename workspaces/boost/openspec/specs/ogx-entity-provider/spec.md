# ogx-entity-provider Specification

## Purpose

TBD - created by archiving change ogx-entity-provider. Update Purpose after archive.

## Requirements

### Requirement: OGX Catalog module registration

The system SHALL register the OGX model and agent entity providers through a
Catalog backend module.

#### Scenario: Register both OGX providers

- GIVEN the Catalog backend loads the `ogx-entity-provider` module
- WHEN the module initializes
- THEN it registers one model entity provider and one agent entity provider
- AND both providers are available through the Catalog processing extension point

### Requirement: OGX configuration resolution

The system SHALL resolve OGX configuration from `boost.entityProviders.ogx`
before `boost.providers.ogx`, and SHALL use `http://localhost:8321` as the base
URL when neither configuration path provides an OGX base URL.

#### Scenario: Prefer the entity-provider configuration

- GIVEN both `boost.entityProviders.ogx` and `boost.providers.ogx` are present
- WHEN the OGX module reads configuration
- THEN it uses `boost.entityProviders.ogx`

#### Scenario: Use the legacy provider configuration as fallback

- GIVEN `boost.entityProviders.ogx` is absent
- AND `boost.providers.ogx` is present
- WHEN the OGX module reads configuration
- THEN it uses `boost.providers.ogx`

#### Scenario: Use the local default endpoint

- GIVEN neither supported OGX configuration path provides a base URL
- WHEN the OGX module reads configuration
- THEN it uses `http://localhost:8321`

### Requirement: Model-server entity emission

The model provider SHALL request the OGX `/v1/models` endpoint and emit one
`AiModelServerAPI` entity with type `ai-model-server`, server type `openai-v1`,
and the models returned by OGX.

#### Scenario: Emit the OGX model server

- GIVEN the OGX model endpoint returns a valid model list
- WHEN the model provider refreshes
- THEN it emits one model-server entity
- AND the entity contains the returned available models
- AND its category is `model-server`
- AND its source is `ogx`
- AND its version is normalized, defaulting to `0.0.0-unknown` when absent

### Requirement: Agent entity emission

The agent provider SHALL emit configured OGX agents as `AiResource` entities
with type `agent`.

#### Scenario: Emit configured agents

- GIVEN one or more OGX agents are configured
- WHEN the agent provider refreshes
- THEN it emits one agent entity for each configured agent
- AND each entity maps the configured lifecycle, owner, instructions, handoffs,
  handoff description, and RAG setting
- AND each entity has category `agent` and source `ogx`
- AND each entity has a normalized version, defaulting to `0.0.0-unknown` when
  unavailable

### Requirement: Refresh and model-fetch failure behavior

The providers SHALL refresh through scheduled full mutations using their
configured intervals. A failed model fetch SHALL preserve the last successfully
emitted model entity.

#### Scenario: Use the configured refresh intervals

- GIVEN model and agent refresh intervals are configured
- WHEN the OGX module creates the providers
- THEN the model provider uses the configured model interval
- AND the agent provider uses the configured agent interval

#### Scenario: Preserve a cached model entity after a failed refresh

- GIVEN the model provider has previously emitted a model entity
- AND a later request to `/v1/models` fails
- WHEN the model provider refreshes
- THEN the previously emitted model entity remains available

#### Scenario: Handle the first failed model refresh

- GIVEN the model provider has not emitted a model entity
- AND the first request to `/v1/models` fails
- WHEN the model provider refreshes
- THEN it emits an empty result without requiring a previously cached entity
