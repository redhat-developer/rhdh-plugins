## ADDED Requirements

### Requirement: Public npx-compatible skill discovery

The npx connector SHALL consume public Agent Skills v0.2 discovery indexes,
including RHESS, and process declared `skill-md` entries. It SHALL neither
invoke `npx` nor clone or crawl Git repositories. It SHALL refresh at startup
and on a non-overlapping Backstage schedule, defaulting to ten minutes.
Discovery entry `name` SHALL be the stable record key within the configured
source; changes to a Markdown display name SHALL NOT change that key.

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
origins, and redirect/destination validation from design D7. It SHALL cap each
artifact at 1 MiB and verify SHA-256 over its original bytes against the index
before decoding and normalizing frontmatter. Invalid supported entries,
retrieval errors, digest mismatches, and exceeded bounds SHALL make the snapshot
incomplete. Successfully processed records SHALL expose the validated discovery
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

#### Scenario: Successful empty discovery

- **WHEN** the entire index is retrieved and validated successfully and contains no supported skills
- **THEN** the endpoint returns `ready` with empty skills and failed-key arrays and a completion time
