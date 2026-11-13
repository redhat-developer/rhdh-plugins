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
connector metadata into new entity fields. Each discovered tag confirmed to be
a valid OCI skill image SHALL produce its own entity using its repository/tag
key, even when another tag has identical content or declared version. Confirmed
non-skills SHALL produce no entity.

For OCI skill entities, the provider SHALL set `backstage.io/techdocs-ref` to
`url:<discovered-connector-base>/skilldocs/<sourceId>/<digest>` as specified in
design D5/D8. The `<discovered-connector-base>` SHALL be resolved through
Backstage discovery using the configured `connectorPluginId`. The `<sourceId>`
SHALL be the configured source ID and the `<digest>` SHALL be the verified
manifest digest from the record. The provider SHALL NOT download or extract
skill content to construct this annotation. npx skill entities SHALL NOT
receive a `backstage.io/techdocs-ref` annotation in this increment.

#### Scenario: Source metadata lacks owner and version

- **WHEN** a valid record has no owner hint or declared version
- **THEN** the entity uses configured `defaultOwner` and the digest-derived version fallback
- **AND** author metadata does not override the configured owner

#### Scenario: Nonblank but invalid owner hint falls back to default

- **WHEN** a valid record has an owner hint that is not a valid Backstage entity reference (e.g., contains spaces or special characters)
- **THEN** the entity uses the configured `defaultOwner` instead of the invalid hint
- **AND** the invalid hint is silently replaced without rejecting the record

#### Scenario: Nonblank but invalid lifecycle hint falls back to default

- **WHEN** a valid record has a lifecycle hint that is not a valid catalog string (e.g., contains spaces or special characters)
- **THEN** the entity uses the configured `defaultLifecycle` instead of the invalid hint
- **AND** the invalid hint is silently replaced without rejecting the record

#### Scenario: OCI URI digest mismatch rejects entire snapshot

- **WHEN** a ready snapshot contains a record whose OCI URI digest does not match the record's declared digest
- **THEN** the provider rejects the entire snapshot without additions, updates, or removals
- **AND** previously emitted entities from that source are preserved

#### Scenario: Correct location-reference prefixes

- **WHEN** OCI and npx records are mapped to entities
- **THEN** OCI source locations start with `url:oci://` and npx source locations start with `url:https://`
- **AND** the custom references preserve the record's verified digest

#### Scenario: Display name changes

- **WHEN** a record keeps its source identity and key but changes its display name
- **THEN** the provider updates the existing entity's title without creating a new entity name

#### Scenario: OCI entity has techdocs-ref annotation

- **WHEN** an OCI skill record is mapped to an entity
- **THEN** the entity has `backstage.io/techdocs-ref` set to `url:<discovered-connector-base>/skilldocs/<sourceId>/<digest>`
- **AND** the annotation uses the discovery-resolved connector base URL, not a hardcoded address
- **AND** the provider does not download or extract Markdown to construct the annotation

#### Scenario: npx entity has no techdocs-ref annotation

- **WHEN** an npx skill record is mapped to an entity
- **THEN** the entity does not have a `backstage.io/techdocs-ref` annotation

#### Scenario: Several valid skill-image tags in one repository

- **WHEN** one repository has two tags containing valid skills and one tag containing a confirmed non-skill
- **THEN** the provider creates two entities with distinct identity-derived names
- **AND** the non-skill tag produces no entity
- **AND** identical manifest digests or declared skill versions do not collapse the two valid tagged records

#### Scenario: Same-digest tag aliases share techdocs-ref URL

- **WHEN** two OCI tags in the same repository resolve to the same manifest digest
- **THEN** both entities have the same `backstage.io/techdocs-ref` URL because they share the same digest
- **AND** each entity retains its own distinct identity-derived name and repository/tag key

#### Scenario: A tag moves to new content

- **WHEN** an existing repository/tag key resolves to new valid content
- **THEN** the provider updates that tag's existing entity and integrity references
- **AND** the entity's `backstage.io/techdocs-ref` updates to reflect the new manifest digest
- **AND** it does not replace the entity identity or mutate a different tag's entry

#### Scenario: Retained entity preserves techdocs-ref

- **WHEN** a `partial` snapshot omits a previously known OCI skill
- **THEN** the retained entity keeps its existing `backstage.io/techdocs-ref` annotation
- **AND** TechDocs continues to render using the connector's retained Markdown content

### Requirement: Source validation and ownership isolation

The provider SHALL validate the complete snapshot before mutating its source's
entities, including schema, configured source ID/type, unique keys, bounds,
status consistency, OCI URI/digest agreement, and npx source-reference validity. A consumer-side validation
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

For OCI sources, the provider SHALL follow D8's acknowledgment
protocol after a ready mutation and ownership commit. Persist the response's
`X-Skilldocs-Revision` in pending state and the resulting acknowledgment alongside
committed state. Its retained-digest set SHALL describe the source's committed
entities, not merely acquired records. Source configuration SHALL identify the
sole provider assignment for retention; duplicates are rejected. npx sources do
not participate in this protocol.

#### Scenario: Provider namespace changes with unchanged skill content

- **WHEN** configured namespace changes while a skill's digest and connector observation timestamp remain unchanged
- **THEN** a ready reconciliation upserts the configured identity and removes the old identity using its persisted full reference
- **AND** replay after restart uses the original persisted removal target

#### Scenario: Partial observation during namespace migration

- **WHEN** a partial snapshot is reconciled after changing the provider namespace
- **THEN** successful records may be upserted in the new namespace
- **AND** old identities remain owned and retained until a ready reconciliation authorizes their removal

#### Scenario: Legacy pending removal has no original identity

- **WHEN** a pending removal without a full entity reference cannot be matched unambiguously to committed ownership
- **THEN** the provider preserves the pending delta and blocks newer observations for that source
- **AND** it does not construct a removal target from the current namespace

#### Scenario: Existing development tables are adopted by migrations

- **WHEN** the provider starts with compatible reconciliation tables created before migration tracking was introduced
- **THEN** its module-scoped migration records the baseline without deleting committed or pending rows
- **AND** it does not change the Catalog plugin's migration history

#### Scenario: Documentation acknowledgment follows catalog commit

- **WHEN** a ready OCI snapshot is successfully reconciled and ownership is durably committed
- **AND** catalog queries confirm the affected processed entities expose their committed documentation URLs and removed entities are absent
- **THEN** the provider sends its persisted revision and committed retained-digest set to the connector's reconcile endpoint using a service token targeted to `skill-image-connector`
- **AND** failed mutations, invalid snapshots, partial snapshots, loading, and failed acquisition send no release acknowledgment

#### Scenario: Unchanged ready observation still acknowledges

- **WHEN** an eligible ready OCI snapshot carries a revision but produces unchanged entities or repeats an observation
- **THEN** the provider persists an acknowledgment and verifies catalog visibility before delivery
- **AND** the connector handles repeated identical acknowledgments idempotently

#### Scenario: Catalog processing lags provider mutation

- **WHEN** the provider mutation and ownership commit succeed but catalog processing still exposes an old TechDocs URL or an entity awaiting removal
- **THEN** the provider retains the durable acknowledgment without sending it
- **AND** it queries the catalog on bounded scheduled runs until all affected entities expose their expected committed TechDocs URLs and removed entities are absent
- **AND** catalog errors, processing failures, and timeouts preserve old Markdown and retry on the next run
- **AND** restart recovers the expected entity references and URLs with the pending acknowledgment before any release

#### Scenario: Crash or error during acknowledgment

- **WHEN** the provider crashes after catalog mutation but before committing ownership or sending its acknowledgment
- **THEN** it first recovers pending mutations, commits ownership, and retries the durable acknowledgment before consuming newer snapshots
- **AND** transport, auth, and server errors retain the acknowledgment for retry
- **AND** 409 discards only the superseded acknowledgment and permits a new poll, without changing catalog state or authorizing cleanup

#### Scenario: Deferred acknowledgment prevents release context replacement

- **WHEN** catalog processing has not satisfied an existing acknowledgment's expected URLs or removals and the connector advances its snapshot
- **THEN** the provider preserves the existing acknowledgment and skips newer polling for that source
- **AND** other sources continue independently

#### Scenario: Crash replay preserves the original release obligations

- **WHEN** a ready OCI mutation is interrupted before ownership and acknowledgment commit
- **THEN** replay uses the complete release and visibility context persisted before that mutation
- **AND** source configuration changes do not reconstruct or weaken those obligations

#### Scenario: Partial crash recovery cannot release documentation

- **WHEN** an interrupted partial OCI delta is replayed
- **THEN** ownership can recover without creating a release acknowledgment from a response revision header

#### Scenario: Legacy pending revision lacks release context

- **WHEN** a pre-release OCI pending delta has a revision but lacks complete acknowledgment context
- **THEN** the provider preserves that delta and blocks newer polling for its source with an investigation diagnostic
- **AND** it does not infer whether that delta came from a ready or partial observation

#### Scenario: Existing entities need the TechDocs annotation

- **WHEN** an OCI entity lacks its expected TechDocs annotation and the next ready observation has unchanged digest and timestamp
- **THEN** the provider upserts the expected annotation before allowing release acknowledgment

#### Scenario: External provider operation stalls

- **WHEN** a snapshot acquisition step (discovery, authentication, or fetch/body consumption), the complete visibility verification phase (authentication and catalog queries), or the complete acknowledgment delivery phase (discovery, authentication, and POST) exceeds its respective 30-second deadline or the scheduler cancels the run
- **THEN** the provider bounds that operation and preserves unresolved release obligations

#### Scenario: Authenticated connector request redirects

- **WHEN** a snapshot or acknowledgment request returns a redirect
- **THEN** the provider rejects the redirect without forwarding its service token

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

#### Scenario: Pending recovery fails while another source is available

- **WHEN** replaying a source's pending delta or committing its recovered ownership fails
- **THEN** the exact pending delta and previous committed observation remain recoverable
- **AND** the provider does not consume a newer snapshot for that source until recovery succeeds
- **AND** independently configured sources may continue reconciling

#### Scenario: Connector advances after an interrupted addition

- **WHEN** an entity is added to the catalog but the process stops before committing its ownership state
- **AND** the connector's next `ready` snapshot omits that skill
- **THEN** recovery replays the persisted pending delta and commits its ownership first
- **AND** reconciliation of the newer snapshot removes the now-tracked entity
