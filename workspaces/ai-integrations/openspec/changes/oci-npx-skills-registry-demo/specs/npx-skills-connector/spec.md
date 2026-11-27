## ADDED Requirements

### Requirement: Public npx-compatible skill discovery

The npx connector SHALL consume public Agent Skills v0.2 discovery indexes,
including RHESS, and process declared `skill-md` entries. It SHALL neither
invoke `npx` nor clone or crawl Git repositories. It SHALL refresh at startup
and on a non-overlapping Backstage schedule, defaulting to ten minutes.
Discovery entry `name` SHALL be the stable record key within the configured
source; changes to a Markdown display name SHALL NOT change that key.
An entry name longer than 1 KiB in UTF-8 SHALL be rejected as incomplete
discovery without copying the oversized key into the failed-key list.

#### Scenario: Archive entry

- **WHEN** an index declares an `archive` entry
- **THEN** the connector skips it and logs that archive ingestion is out of scope
- **AND** that skip alone does not make the snapshot incomplete

#### Scenario: Duplicate source keys

- **WHEN** two index entries declare the same name
- **THEN** the connector excludes both conflicting records and reports the key as failed
- **AND** the attempt produces a `partial` snapshot

### Requirement: Verified and bounded artifact retrieval

The connector SHALL enforce HTTPS, index-origin or explicitly allowlisted
origins, and redirect URL validation from design D7.
It SHALL cap each artifact at 1 MiB and verify SHA-256 over its original bytes
against the index before decoding and normalizing frontmatter. Invalid supported
entries, retrieval errors, digest mismatches, and exceeded bounds SHALL make the
snapshot incomplete. Successfully processed records SHALL expose the validated discovery
entry's artifact URL as `sourceUri` and the verified artifact digest; frontmatter
SHALL NOT override either field.

#### Scenario: Digest mismatch

- **WHEN** an artifact's SHA-256 differs from the discovery index value
- **THEN** the connector omits the new record and reports its key in a `partial` snapshot
- **AND** other valid skills are still returned

#### Scenario: Redirect escapes allowed origins

- **WHEN** an artifact response redirects to an origin outside the allowlist
- **THEN** the connector rejects the redirect before retrieving the destination body
- **AND** it reports that skill as failed

### Requirement: Normalized npx REST snapshots

The connector SHALL expose authenticated `GET /skills/:sourceId` with source
type `npx`, the shared v1 response schema, design D3 metadata precedence, and
D6 snapshot publication rules. It SHALL NOT produce `AiResource` entities,
catalog annotations, catalog defaults, or catalog mutations. Unknown source IDs
SHALL return 404.

#### Scenario: Successful skill normalization

- **WHEN** a verified artifact provides frontmatter name, description, and `metadata.version`
- **THEN** the response maps those values to normalized name, description, and version
- **AND** it retains the discovery entry name as the stable key
- **AND** it records the entry type as `extensions.npx.type`

#### Scenario: Connector is still loading

- **WHEN** the first discovery attempt has not completed
- **THEN** the endpoint returns `loading`, empty skills and failed-key arrays, and `observedAt: null`

#### Scenario: Total discovery failure

- **WHEN** discovery returns no entries and no index page could be parsed
- **THEN** the connector publishes a `failed` snapshot
- **AND** no artifact processing is attempted

#### Scenario: Unhandled exception during discovery or processing

- **WHEN** an unexpected exception is thrown by discovery or artifact processing
- **THEN** the connector catches it and publishes a `failed` snapshot
- **AND** the error is logged

#### Scenario: Successful empty discovery

- **WHEN** the entire index is retrieved and validated successfully and contains no supported skills
- **THEN** the endpoint returns `ready` with empty skills and failed-key arrays and a completion time

### Requirement: Registry base for CLI discovery

The snapshot endpoint SHALL advertise the registry base in `X-Npx-Skill-Registry`
when the configured index URL ends in `/.well-known/agent-skills/index.json`
and has no query string. It SHALL preserve the registry's path prefix.

#### Scenario: Well-known index under a registry path

- **WHEN** the index URL is `https://registry.example/team/.well-known/agent-skills/index.json`
- **THEN** `GET /skills/:sourceId` returns `X-Npx-Skill-Registry: https://registry.example/team`

#### Scenario: Custom index URL

- **WHEN** the configured index uses a custom path or includes a query string
- **THEN** the snapshot response omits the registry header

### Requirement: Digest-verified npx skill documentation

The connector SHALL expose authenticated `GET /skilldocs/:sourceId/:digest`.
It SHALL resolve the artifact URL from the configured source's current snapshot
and apply the same origin, redirect, and size limits used during import.

#### Scenario: Markdown matches the imported digest

- **WHEN** the snapshot contains the requested digest and the fetched bytes match its SHA-256
- **THEN** the connector returns the original bytes as `text/markdown` with the quoted digest as the ETag

#### Scenario: Reader has the current document

- **WHEN** the digest is in the source snapshot and `If-None-Match` equals its quoted ETag
- **THEN** the connector returns 304 and the ETag without fetching the artifact again

#### Scenario: Unknown source or revision

- **WHEN** the source is unknown or its current snapshot has no record with that digest
- **THEN** the connector returns 404 before fetching any artifact

#### Scenario: Upstream Markdown changed after import

- **WHEN** the fetched bytes have a different SHA-256 from the requested digest
- **THEN** the connector returns 409 without serving the changed Markdown
