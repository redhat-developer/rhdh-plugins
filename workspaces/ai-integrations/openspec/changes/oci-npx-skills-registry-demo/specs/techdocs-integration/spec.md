## ADDED Requirements

### Requirement: OCI skill documentation URL matching

The URL-reader plugin SHALL match OCI skill documentation URLs from trusted
configured or Backstage-discovered connector destinations, extending the
existing model-card URL-reader pattern. It SHALL match the exact trusted origin
and connector base pathname followed by `/skilldocs/<sourceId>/<digest>`. It
SHALL append the route to the full connector base, including any `/api/<pluginId>`
prefix, encoding source ID and digest individually as path segments. Matching
SHALL decode each segment once, validate the manifest digest, and reject extra
segments, query strings, fragments, URL credentials, and paths outside the trusted
base. Connector redirects SHALL be errors; service tokens SHALL NOT be forwarded
to redirect destinations. It SHALL NOT infer arbitrary credential destinations
from URL substrings. Existing model-card URL matching and behavior SHALL be
preserved.

#### Scenario: Skill documentation URL matches

- **WHEN** a `backstage.io/techdocs-ref` annotation contains `url:<connector-base>/skilldocs/<sourceId>/<digest>`
- **AND** the connector base URL matches a trusted configured destination
- **THEN** the URL reader matches and handles the request

#### Scenario: Discovered plugin base pathname is preserved

- **WHEN** discovery returns `https://rhdh.example/api/skill-image-connector`
- **THEN** the provider and reader use `/api/skill-image-connector/skilldocs/<sourceId>/<digest>`
- **AND** a root-level `/skilldocs/` URL or another plugin path on the same origin is not matched
- **AND** source IDs containing reserved characters round-trip as one encoded segment

#### Scenario: Unknown connector origin is not matched

- **WHEN** a `backstage.io/techdocs-ref` annotation contains a `/skilldocs/` path but the origin does not match any trusted configured connector destination
- **THEN** the URL reader does not match the request
- **AND** it does not attempt to fetch from an untrusted destination

#### Scenario: Malformed encoded route segment

- **WHEN** a skill documentation URL contains invalid percent encoding in its source ID or digest segment
- **THEN** the reader predicate returns no match without throwing
- **AND** no connector token is requested or sent

#### Scenario: Direct reads enforce trusted destinations

- **WHEN** a caller invokes `readUrl` directly with an off-origin or off-base skill documentation URL
- **THEN** the reader rejects the URL before requesting or sending a service token

#### Scenario: Skill route resembles a model-card URL

- **WHEN** a skill documentation route also contains substrings matching legacy model-card configuration
- **THEN** it must satisfy skill documentation destination and route validation
- **AND** it cannot fall through to model-card credential handling

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

#### Scenario: Unauthorized access to skill documentation

- **WHEN** a request to `/skilldocs/:sourceId/:digest` lacks valid Backstage backend credentials
- **THEN** the connector rejects the request with an authentication error
- **AND** the URL reader does not return documentation content

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

### Requirement: Content equivalence across extraction layouts

The URL reader SHALL produce equivalent documentation for the same Markdown
content extracted from supported annotated-layer and tar/tar+gzip layouts. Each
documentation URL SHALL identify its own image's verified manifest digest;
equivalent Markdown does not require identical manifests or manifest digests.

#### Scenario: Annotated-layer Markdown produces equivalent documentation

- **WHEN** an OCI skill image uses an annotated raw Markdown layer
- **THEN** the resulting TechDocs documentation is equivalent to a tar/tar+gzip layout containing the same Markdown
- **AND** each documentation URL contains its own image's verified manifest digest, which may differ between layouts
- **AND** the reader trusts authenticated connector storage for the Markdown binding and does not compare a Markdown hash with the manifest digest

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

#### Scenario: Size-limited Markdown content

- **WHEN** extracted Markdown content is within the design D7 per-layer decompressed size limit (5 MiB)
- **THEN** the URL reader processes and renders the full document
- **AND** the connector's extraction bounds prevent oversized content from reaching the endpoint

### Requirement: Digest-based cache and ETag semantics

The URL reader SHALL pass through the connector's `ETag` response header for
TechDocs digest-based caching, as specified in design D8. When the caller
provides an etag, the URL reader SHALL forward it as an `If-None-Match`
request header to the connector endpoint, completing the bidirectional
conditional-request protocol. A successful skill documentation response without
a nonblank ETag SHALL be rejected as a connector protocol error; the reader SHALL
NOT replace the missing validator with an empty or fabricated value.

#### Scenario: ETag passthrough for caching

- **WHEN** the connector returns an `ETag` header with the Markdown response
- **THEN** the URL reader passes the ETag through to the TechDocs builder for cache management
- **AND** subsequent requests with `If-None-Match` matching the ETag result in 304 from the connector

#### Scenario: If-None-Match forwarding to connector

- **WHEN** the caller provides an etag for a skill documentation request
- **THEN** the URL reader forwards the etag as an `If-None-Match` request header to the connector endpoint
- **AND** the connector evaluates the conditional request and returns 304 Not Modified if the ETag matches

#### Scenario: Successful Markdown response lacks its ETag

- **WHEN** a successful skill documentation response omits its ETag or supplies only whitespace
- **THEN** the reader raises a protocol error
- **AND** it does not return a successful MkDocs project with an empty validator
