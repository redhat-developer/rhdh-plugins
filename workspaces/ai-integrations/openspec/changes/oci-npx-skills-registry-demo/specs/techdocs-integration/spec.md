## ADDED Requirements

### Requirement: OCI skill documentation URL matching

The URL-reader plugin SHALL match OCI skill documentation URLs from trusted
configured or Backstage-discovered connector destinations, extending the
existing model-card URL-reader pattern. It SHALL match URLs whose path starts
with `/skilldocs/` and whose origin matches a trusted connector destination
derived from configuration. It SHALL NOT infer arbitrary credential destinations
from URL substrings. Existing model-card URL matching and behavior SHALL be
preserved.

#### Scenario: Skill documentation URL matches

- **WHEN** a `backstage.io/techdocs-ref` annotation contains `url:<connector-base>/skilldocs/<sourceId>/<digest>`
- **AND** the connector base URL matches a trusted configured destination
- **THEN** the URL reader matches and handles the request

#### Scenario: Unknown connector origin is not matched

- **WHEN** a `backstage.io/techdocs-ref` annotation contains a `/skilldocs/` path but the origin does not match any trusted configured connector destination
- **THEN** the URL reader does not match the request
- **AND** it does not attempt to fetch from an untrusted destination

#### Scenario: Model-card URLs continue to match

- **WHEN** a `backstage.io/techdocs-ref` annotation contains a model-card URL (`/modelcard/` path)
- **THEN** the existing model-card URL reader continues to match and handle the request
- **AND** the skill documentation extension does not interfere with model-card behavior

### Requirement: Service-token authentication to connector

The URL reader SHALL authenticate to the OCI connector using Backstage
service-to-service tokens, as specified in design D8. It SHALL call
`auth.getPluginRequestToken` with `targetPluginId` set to the receiving
connector plugin's registered `pluginId`, consistent with the model-card URL
reader's service-token pattern. It SHALL send the token in the
`Authorization: Bearer <token>` header.

#### Scenario: Service token targets the connector plugin

- **WHEN** the URL reader fetches OCI skill documentation from a connector
- **THEN** it calls `auth.getPluginRequestToken` with `targetPluginId` matching the connector's `pluginId` from its `createBackendPlugin` registration
- **AND** the resulting token is sent as `Authorization: Bearer <token>`
- **AND** no static admin token fallback is used

#### Scenario: Correct targetPluginId from configuration

- **WHEN** the URL reader matches a skill documentation URL
- **THEN** the `targetPluginId` is derived from the trusted connector configuration, not from parsing URL substrings
- **AND** the connector's auth middleware accepts the token

### Requirement: Error propagation from connector

The URL reader SHALL propagate HTTP errors from the connector endpoint without
masking failures as successful empty documentation, as specified in design D8.

#### Scenario: Connector returns 404

- **WHEN** the connector's `/skilldocs/:sourceId/:digest` endpoint returns 404
- **THEN** the URL reader raises `NotFoundError`
- **AND** TechDocs displays an appropriate "documentation not found" state

#### Scenario: Connector returns 304 Not Modified

- **WHEN** the connector returns 304 in response to a conditional request
- **THEN** the URL reader raises `NotModifiedError`
- **AND** TechDocs uses its cached version of the documentation

#### Scenario: Connector returns a server error

- **WHEN** the connector returns 500 or another server error
- **THEN** the URL reader propagates the error
- **AND** it does not return an empty or placeholder document

#### Scenario: Connector is unreachable

- **WHEN** the URL reader cannot connect to the connector
- **THEN** it raises an error with the connection failure context
- **AND** it does not return successful empty documentation

### Requirement: Minimal MkDocs project generation

The URL reader SHALL produce a minimal MkDocs project containing `mkdocs.yml`
and `docs/index.md` for the TechDocs builder, as specified in design D8.

#### Scenario: MkDocs project for skill documentation

- **WHEN** the URL reader successfully retrieves Markdown from the connector
- **THEN** it writes `mkdocs.yml` at the project root with a suitable `site_name` derived from the skill context and a `nav` entry pointing to `index.md`
- **AND** it writes `docs/index.md` containing the retrieved Markdown content
- **AND** the TechDocs builder (`mkdocs build`) can process the output without errors

#### Scenario: Frontmatter is preserved

- **WHEN** the retrieved Markdown contains already validated YAML frontmatter
- **THEN** the URL reader includes the frontmatter as-is in `docs/index.md`
- **AND** it does not strip, re-parse, or modify the frontmatter

#### Scenario: Single document only

- **WHEN** the URL reader processes OCI skill documentation
- **THEN** it renders only the single extracted Markdown document
- **AND** bundled assets, relative-file resolution, and multi-page documentation are out of scope for this increment

### Requirement: Digest-based cache and ETag semantics

The URL reader SHALL pass through the connector's `ETag` response header for
TechDocs digest-based caching, as specified in design D8.

#### Scenario: ETag passthrough for caching

- **WHEN** the connector returns an `ETag` header with the Markdown response
- **THEN** the URL reader passes the ETag through to the TechDocs builder for cache management
- **AND** subsequent requests with `If-None-Match` matching the ETag result in 304 from the connector

#### Scenario: Annotated-layer Markdown produces equivalent documentation

- **WHEN** an OCI skill image uses an annotated raw Markdown layer
- **THEN** the resulting TechDocs documentation is equivalent to a tar/tar+gzip layout containing the same Markdown
- **AND** the documentation URL uses the same manifest digest regardless of extraction layout

#### Scenario: Unauthorized access to skill documentation

- **WHEN** a request to `/skilldocs/:sourceId/:digest` lacks a valid service token
- **THEN** the connector rejects the request with an authentication error
- **AND** the URL reader does not return documentation content

#### Scenario: Size-limited Markdown content

- **WHEN** extracted Markdown content is within the design D7 per-layer decompressed size limit (5 MiB)
- **THEN** the URL reader processes and renders the full document
- **AND** the connector's extraction bounds prevent oversized content from reaching the endpoint
