# ogx-entity-provider Specification

> **Status: Implemented** — Current RHDH 2.1 release source of truth.
>
> **Scope:** The independently deployable OGX model and agent entity
> providers, including their configuration, annotations, version handling,
> TLS connection settings, and synchronization behavior.

## Purpose

This specification describes the shipped OGX entity provider: module
registration, configuration resolution, model and agent entity mapping,
annotation and version normalization, TLS connection configuration, and
scheduled full synchronization.

## Requirements

### Requirement: OGX Catalog module registration

The system SHALL register the OGX model and agent entity providers through a
Catalog backend module.

#### Scenario: Register both OGX providers

- **GIVEN** the Catalog backend loads the `ogx-entity-provider` module
- **WHEN** the module initializes
- **THEN** it registers one model entity provider and one agent entity provider
- **AND** both providers are available through the Catalog processing extension point

### Requirement: OGX configuration resolution

The system SHALL resolve OGX configuration from `boost.entityProviders.ogx`
before `boost.providers.ogx`, and SHALL use `http://localhost:8321` as the base
URL when neither configuration path provides an OGX base URL.

#### Scenario: Prefer the entity-provider configuration

- **GIVEN** both `boost.entityProviders.ogx` and `boost.providers.ogx` are present
- **WHEN** the OGX module reads configuration
- **THEN** it uses `boost.entityProviders.ogx`

#### Scenario: Use the legacy provider configuration as fallback

- **GIVEN** `boost.entityProviders.ogx` is absent
- **AND** `boost.providers.ogx` is present
- **WHEN** the OGX module reads configuration
- **THEN** it uses `boost.providers.ogx`

#### Scenario: Use the local default endpoint

- **GIVEN** neither supported OGX configuration path provides a base URL
- **WHEN** the OGX module reads configuration
- **THEN** it uses `http://localhost:8321`

#### Scenario: Read TLS settings from either configuration path

- **GIVEN** `caData` or `skipTLSVerify` is set under the OGX configuration in use
- **WHEN** the OGX module reads configuration
- **THEN** both settings are read from that path
- **AND** the same settings are supported on the `boost.providers.ogx` fallback path
- **AND** each is left unset when the configuration does not provide it

### Requirement: OGX configuration schema

The plugin SHALL declare its configuration schema so that Backstage validates
the OGX configuration keys and enforces their visibility when the module is
loaded independently of `boost-backend`.

#### Scenario: Declare the OGX configuration contract

- **GIVEN** the `ogx-entity-provider` package is installed
- **WHEN** Backstage loads the configuration schema
- **THEN** the package contributes a schema covering `boost.entityProviders.ogx`
  and `boost.providers.ogx`
- **AND** `apiKey` is marked with `@visibility secret`
- **AND** `caData` is marked with `@visibility backend`
- **AND** `baseUrl` and `skipTLSVerify` are marked `@configScope yaml-only`

### Requirement: TLS connection configuration

The model provider SHALL apply the configured TLS settings when requesting the
OGX model endpoint. `skipTLSVerify` SHALL take precedence over `caData`. The
dispatcher SHALL be created once and reused across refresh cycles.

#### Scenario: Use default TLS behavior when nothing is configured

- **GIVEN** neither `caData` nor `skipTLSVerify` is set
- **WHEN** the model provider fetches the OGX model endpoint
- **THEN** it issues the request without a custom dispatcher
- **AND** the runtime default certificate verification applies

#### Scenario: Verify against a custom CA

- **GIVEN** `caData` contains a PEM-encoded certificate or bundle
- **AND** `skipTLSVerify` is not set
- **WHEN** the model provider fetches the OGX model endpoint
- **THEN** it issues the request with a dispatcher carrying that CA
- **AND** certificate verification remains enabled

#### Scenario: Disable certificate verification

- **GIVEN** `skipTLSVerify` is true
- **WHEN** the model provider fetches the OGX model endpoint
- **THEN** it issues the request with certificate verification disabled
- **AND** it logs a warning that this is intended for development environments only

#### Scenario: Prefer skipTLSVerify over caData

- **GIVEN** both `caData` and `skipTLSVerify` are set
- **WHEN** the model provider fetches the OGX model endpoint
- **THEN** certificate verification is disabled
- **AND** the configured `caData` is not applied

#### Scenario: Report malformed CA data without blocking the request

- **GIVEN** `caData` does not contain matching PEM certificate markers
- **WHEN** the model provider fetches the OGX model endpoint
- **THEN** it logs an error naming the expected PEM markers
- **AND** it still applies the configured `caData` and issues the request

#### Scenario: Reuse the dispatcher and warn only once

- **GIVEN** a TLS setting is configured
- **WHEN** the model provider refreshes repeatedly
- **THEN** the dispatcher is created on the first refresh and reused afterwards
- **AND** the `skipTLSVerify` warning is logged only once

#### Scenario: Preserve existing request behavior under TLS settings

- **GIVEN** a TLS setting is configured
- **AND** an API key is configured
- **WHEN** the model provider fetches the OGX model endpoint
- **THEN** the Bearer authorization header is still sent
- **AND** a non-2xx response is still treated as a failed fetch

### Requirement: Model-server entity emission

The model provider SHALL request the OGX `/v1/models` endpoint and emit one
`AiModelServerAPI` entity with type `ai-model-server`, server type `openai-v1`,
and the models returned by OGX.

#### Scenario: Emit the OGX model server

- **GIVEN** the OGX model endpoint returns a valid model list
- **WHEN** the model provider refreshes
- **THEN** it emits one model-server entity
- **AND** the entity contains the returned available models
- **AND** its category is `model-server`
- **AND** its source is `ogx`
- **AND** its version is normalized, defaulting to `0.0.0-unknown` when absent

### Requirement: Agent entity emission

The agent provider SHALL emit configured OGX agents as `AiResource` entities
with type `agent`.

#### Scenario: Emit configured agents

- **GIVEN** one or more OGX agents are configured
- **WHEN** the agent provider refreshes
- **THEN** it emits one agent entity for each configured agent
- **AND** each entity maps the configured lifecycle, owner, instructions, handoffs,
  handoff description, and RAG setting
- **AND** each entity has category `agent` and source `ogx`
- **AND** each entity has a normalized version, defaulting to `0.0.0-unknown` when
  unavailable

### Requirement: Refresh and model-fetch failure behavior

The providers SHALL refresh through scheduled full mutations. Intervals from
`boost.entityProviders.ogx` override the 60-second model and 300-second agent
defaults. A failed model fetch SHALL preserve the last successfully emitted
model entity.

#### Scenario: Use the configured refresh intervals

- **GIVEN** model and agent refresh intervals are configured under
  `boost.entityProviders.ogx`
- **WHEN** the OGX module creates the providers
- **THEN** the model provider uses the configured model interval
- **AND** the agent provider uses the configured agent interval

#### Scenario: Preserve a cached model entity after a failed refresh

- **GIVEN** the model provider has previously emitted a model entity
- **AND** a later request to `/v1/models` fails
- **WHEN** the model provider refreshes
- **THEN** the previously emitted model entity remains available

#### Scenario: Handle the first failed model refresh

- **GIVEN** the model provider has not emitted a model entity
- **AND** the first request to `/v1/models` fails
- **WHEN** the model provider refreshes
- **THEN** it emits an empty result without requiring a previously cached entity
