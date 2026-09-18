## ADDED Requirements

### Requirement: One common catalog provider implementation

A common catalog provider SHALL consume normalized v1 snapshots from OCI and
npx connectors using the same implementation. Each source SHALL have independent
configuration, location keys, schedule, and durable reconciliation state. The
provider SHALL resolve `connectorPluginId` through Backstage discovery and obtain
a service token targeted to that receiving plugin ID. It SHALL poll
`GET /skills/:sourceId` on a non-overlapping Backstage schedule, defaulting to ten
minutes, and SHALL NOT retrieve registry artifacts or parse native skill files.

#### Scenario: Two source types

- **WHEN** OCI and npx source instances are configured
- **THEN** the common implementation consumes both through the shared REST contract
- **AND** an HTTP or authentication failure for one source does not stop the other

### Requirement: Upstream-compatible skill entity construction

The provider SHALL construct one `backstage.io/v1alpha1` `AiResource` with
`spec.type: skill` for each accepted record using design D3/D5. It SHALL use a
deterministic identity-derived `metadata.name`, published `metadata.title`,
configured namespace, and usable source owner/lifecycle hints or required
configured defaults. It SHALL set non-empty `rhdh.io/ai-asset-category: skill`,
`rhdh.io/ai-asset-version`, and `rhdh.io/ai-asset-source` annotations.
It SHALL set `backstage.io/source-location` and the appropriate OCI/npx reference
annotation using D5's exact serialization. It SHALL NOT project unmapped
connector metadata into new entity fields.

#### Scenario: Source metadata lacks owner and version

- **WHEN** a valid record has no owner hint or declared version
- **THEN** the entity uses configured `defaultOwner` and the digest-derived version fallback
- **AND** author metadata does not override the configured owner

#### Scenario: Correct location-reference prefixes

- **WHEN** OCI and npx records are mapped to entities
- **THEN** OCI source locations start with `url:oci://` and npx source locations start with `url:https://`
- **AND** the custom references preserve the record's verified digest

#### Scenario: Display name changes

- **WHEN** a record keeps its source identity and key but changes its display name
- **THEN** the provider updates the existing entity's title without creating a new entity name

### Requirement: Source validation and ownership isolation

The provider SHALL validate the complete snapshot before mutating its source's
entities, including schema, configured source ID/type, unique keys, bounds,
status consistency, and OCI URI/digest agreement. A consumer-side validation
failure SHALL preserve that source's previous state. Duplicate configured source
assignments SHALL fail configuration validation. An identity hash collision
SHALL be diagnosed without overwriting another source tuple's entity.

#### Scenario: Malformed ready snapshot

- **WHEN** a connector returns `ready` but one record is invalid or the source ID differs from configuration
- **THEN** the provider rejects that source snapshot without additions, updates, or removals
- **AND** it continues processing other configured sources

### Requirement: Durable last-known-good reconciliation

The provider SHALL persist source tuples, last-known-good entities, digests, and
last-applied observation times through Backstage's database service. It SHALL
recover that state after restart and use source-scoped delta mutations.
`partial` snapshots SHALL permit successful-record upserts but no removals.
`loading`, `failed`, and connector errors SHALL cause no mutations. Only a valid
`ready` snapshot SHALL authorize removal of previously owned keys absent from
that snapshot. Observations older than the persisted one SHALL be ignored;
repeated observations SHALL be idempotent. Before applying a catalog mutation,
the provider SHALL transactionally persist the pending delta and intended next
ownership state/observation time separately from committed progress. After the
mutation succeeds, it SHALL atomically commit that next state and clear the
pending record. Pending deltas SHALL be replayed and committed before newer
connector snapshots are consumed.

#### Scenario: One skill fails during refresh

- **WHEN** a `partial` snapshot contains an updated skill and omits a previously known failed skill
- **THEN** the updated skill is upserted and the missing skill's last-known-good entity is retained
- **AND** no other absent entities are removed from that source

#### Scenario: Successful empty snapshot

- **WHEN** a valid `ready` snapshot contains no skills
- **THEN** the provider removes only entities previously owned by that source

#### Scenario: Restart followed by source outage

- **WHEN** the provider restarts with persisted entities and its connector is loading or unavailable
- **THEN** it recovers and retains the previous entities and reconciliation state

#### Scenario: Mutation failure and replay

- **WHEN** a catalog mutation fails or the process stops before saving progress
- **THEN** that snapshot is retried without advancing the durable observation time
- **AND** replaying a previously applied delta does not duplicate entities or remove another source's entities

#### Scenario: Connector advances after an interrupted addition

- **WHEN** an entity is added to the catalog but the process stops before committing its ownership state
- **AND** the connector's next `ready` snapshot omits that skill
- **THEN** recovery replays the persisted pending delta and commits its ownership first
- **AND** reconciliation of the newer snapshot removes the now-tracked entity
