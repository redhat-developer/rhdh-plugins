# AI Catalog Metadata and Provenance

> **Status: Draft** — Pre-implementation specification for annotation
> semantics, kind-to-category mapping, Location entity lifecycle, and source
> correlation rules. The working baseline is provisional; frontend stakeholder
> feedback is pending.

## EXISTING Requirements

### Requirement: rhdh.io/ai-asset-category annotation semantics

All AI asset entities MUST carry the `rhdh.io/ai-asset-category` annotation
with one of the six accepted values. The five minimum feature categories are
`agent`, `skill`, `mcp-server`, `ai-model`, and `model-server`. The existing
`rule` value remains accepted for compatibility.

This requirement restates the current contract from
[annotation-scheme/spec.md](../../../ai-catalog-entity-model/specs/annotation-scheme/spec.md)
and the current SDK validation in
`ai-catalog-entity-provider-sdk/src/annotations.ts`.

#### Scenario: Category annotation is required on AI asset entities

- **GIVEN** an entity carries any `rhdh.io/ai-asset-*` annotation
- **WHEN** the CatalogProcessor validates the entity
- **THEN** the entity MUST have `rhdh.io/ai-asset-category` set to one of: `agent`, `skill`, `rule`, `mcp-server`, `ai-model`, `model-server`

#### Scenario: Category annotation is not required on non-AI entities

- **GIVEN** an entity carries no `rhdh.io/ai-asset-*` annotation
- **WHEN** the CatalogProcessor validates the entity
- **THEN** the category annotation validator does not reject the entity

### Requirement: rhdh.io/ai-asset-version annotation semantics

All AI asset entities MUST carry the `rhdh.io/ai-asset-version` annotation
with a non-empty string value. Normalization rules are specified separately by
[RHIDP-18845](https://redhat.atlassian.net/browse/RHIDP-18845); this
requirement covers only the presence and non-emptiness constraint.

#### Scenario: Version annotation is required on AI asset entities

- **GIVEN** an entity carries any `rhdh.io/ai-asset-*` annotation
- **WHEN** the CatalogProcessor validates the entity
- **THEN** the entity MUST have `rhdh.io/ai-asset-version` set to a non-empty string

### Requirement: rhdh.io/ai-asset-source annotation semantics

The current SDK requires `rhdh.io/ai-asset-source` to be a non-empty string.
Existing providers use connector/source labels as recorded in the inventory.
The stronger future source-Location contract below applies to adopting
providers; it does not describe validation implemented by the current SDK.
Connector/source identifiers remain extensible, not a fixed connector enum.

#### Scenario: Source annotation is required on AI asset entities

- **GIVEN** an entity carries any `rhdh.io/ai-asset-*` annotation
- **WHEN** the CatalogProcessor validates the entity
- **THEN** the entity MUST have `rhdh.io/ai-asset-source` set to a non-empty string

### Requirement: Kind/spec.type to category mapping

The integrations consume specific APIs or configured records with known catalog
representations. Preserve each integration's documented native kind/`spec.type`
and semantic category; no generic classification, closest-category fallback, or
new record-skipping policy is introduced. These reference mappings follow the
entity-model design, including its permitted connector-domain variations. The
current browse taxonomy is defined in
`ai-catalog-common/src/aiAssetTaxonomy.ts` (`AI_ASSET_SPEC_TYPES`).

#### Scenario: AiResource with spec.type agent maps to category agent

- **GIVEN** an entity has `kind: AiResource` and `spec.type: agent`
- **WHEN** a provider populates `rhdh.io/ai-asset-category`
- **THEN** the value MUST be `agent`

#### Scenario: AiResource with spec.type skill maps to category skill

- **GIVEN** an entity has `kind: AiResource` and `spec.type: skill`
- **WHEN** a provider populates `rhdh.io/ai-asset-category`
- **THEN** the value MUST be `skill`

#### Scenario: AiResource with spec.type rule maps to category rule

- **GIVEN** an entity has `kind: AiResource` and `spec.type: rule`
- **WHEN** a provider populates `rhdh.io/ai-asset-category`
- **THEN** the value MUST be `rule`

#### Scenario: AiModelServerAPI with spec.type ai-model-server maps to category model-server

- **GIVEN** an entity has `kind: AiModelServerAPI` and `spec.type: ai-model-server`
- **WHEN** a provider populates `rhdh.io/ai-asset-category`
- **THEN** the value MUST be `model-server`

#### Scenario: API with spec.type mcp-server maps to category mcp-server

- **GIVEN** an entity has `kind: API` and `spec.type: mcp-server`
- **WHEN** a provider populates `rhdh.io/ai-asset-category`
- **THEN** the value MUST be `mcp-server`

#### Scenario: Resource with spec.type ai-model maps to category ai-model

- **GIVEN** an entity has `kind: Resource` and `spec.type: ai-model`
- **WHEN** a provider populates `rhdh.io/ai-asset-category`
- **THEN** the value MUST be `ai-model`

## ADDED Requirements

### Requirement: Source identity and Location correlation

For providers adopting this contract, `rhdh.io/ai-asset-source` MUST contain the
canonical full entity reference `location:<namespace>/<name>` of the Location
representing the asset's configured logical source and ingestion path. The
Location MUST carry `rhdh.io/ai-source-ref` equal to that reference. This key is
source-record metadata, not a fourth required AI asset annotation. Source
Locations MUST remain outside AI asset classification and three-annotation
validation.

Both annotations and the Location's actual canonical reference MUST agree.
Consumers resolve that reference through catalog lookup, not provider-specific
connector-label parsing. Assets and versions from one logical source share its
Location; providers can own multiple source Locations. Legacy `ogx` and
`oci/quay-prod` labels are inputs to RHIDP-18849/RHIDP-18850 migration profiles,
not values already conforming to this target contract. Validation integration
belongs to RHIDP-18847; it is not implemented by this planning change.

#### Scenario: Asset source resolves to its source Location

- **GIVEN** an adopting provider emits an asset from OCI source `quay-prod`
- **WHEN** a consumer resolves its `rhdh.io/ai-asset-source`
- **THEN** it reads `location:default/ai-source-oci-quay-prod`
- **AND** lookup by that reference identifies a `kind: Location`
- **AND** that Location's `rhdh.io/ai-source-ref` equals the asset source value
- **AND** the correlation value equals the Location's own canonical entity reference

#### Scenario: Multiple assets and versions share one source record

- **GIVEN** multiple assets or asset versions originate from the same configured logical source
- **WHEN** the provider builds their metadata and source record
- **THEN** their source annotations identify the same Location entity
- **AND** the provider emits one source Location for that logical source

#### Scenario: Source and asset namespaces differ

- **GIVEN** an asset in namespace `team-a` originates from a source Location in namespace `sources`
- **WHEN** the provider builds its source annotation
- **THEN** the value includes `location:sources/` followed by the source Location's canonical name
- **AND** lookup uses the source namespace rather than the asset namespace

#### Scenario: Malformed or non-Location source reference

- **GIVEN** an adopting provider builds a source value without an explicit namespace or with a non-Location kind
- **WHEN** its planned source metadata contract is validated
- **THEN** validation reports the invalid source reference
- **AND** it does not reinterpret the value as a connector label or endpoint URL

#### Scenario: Source record correlation is missing or inconsistent

- **GIVEN** an adopting provider builds a source Location with a missing `rhdh.io/ai-source-ref` or one differing from its canonical reference
- **WHEN** the planned source-record contract is validated
- **THEN** validation identifies the missing or inconsistent correlation annotation
- **AND** it does not substitute a management annotation or a matching service URL

#### Scenario: Source record is validated separately from an AI asset

- **GIVEN** a source Location carries `rhdh.io/ai-source-ref` and no `rhdh.io/ai-asset-*` annotations
- **WHEN** the planned SDK/provider integration validates the source record
- **THEN** it applies the source-Location contract
- **AND** it does not require AI asset category or version annotations
- **AND** it does not pass the Location to the standalone AI-asset validation helper

#### Scenario: Source Location is not yet visible after ingestion

- **GIVEN** an asset carries a valid source reference and its Location has not yet been processed into the catalog
- **WHEN** a consumer attempts to resolve the source
- **THEN** the consumer reports the reference as unresolved
- **AND** it does not silently associate the asset with a different Location

This scenario imposes no processing order or deletion policy. Missing-source
recovery and retained-content mechanics remain with RHIDP-18848 and adoption
profiles.

### Requirement: Source metadata safe exposure

Source metadata MUST exclude credentials and use safe configured identities.
This covers names, annotations, optional links, and diagnostics. Authentication stays in
backend configuration. Optional service links MAY include internal URLs when
appropriate for the catalog's audience and normal visibility policy; there is
no blanket prohibition on internal endpoints and no new authorization model.
Location `spec` has no discovery targets under this contract.

#### Scenario: Credential-free source metadata and diagnostics

- **GIVEN** a backend connection uses an authenticated URL and secret credentials
- **WHEN** the provider builds source names, annotations, optional links, and diagnostics
- **THEN** those published values contain no API keys, passwords, client secrets, or authentication tokens
- **AND** any service link excludes authentication-bearing userinfo, query parameters, and fragments

#### Scenario: Source annotations use catalog identity

- **WHEN** an adopting provider builds the asset source and Location correlation annotations
- **THEN** both contain the matching canonical Location entity reference
- **AND** neither uses an endpoint URL in place of that reference

#### Scenario: Optional service link does not drive ingestion

- **GIVEN** an exposure-appropriate credential-free backend-service URL
- **WHEN** the provider includes it in the source Location's `metadata.links`
- **THEN** the link identifies the service for catalog users
- **AND** the Location still has `spec: {}` without discovery targets
- **AND** the link does not itself trigger catalog reading of that service

### Requirement: Management annotation consistency

Emitted AI assets and source Locations MUST carry valid
`backstage.io/managed-by-location` and
`backstage.io/managed-by-origin-location` references. Each has Backstage's
`<type>:<target>` form with nonempty type and target, not a bare Location name.
These references retain their processing/origin meanings and are distinct from
our canonical source entity references. They do not themselves create target
reads or parent/child relations between independently emitted entities.

For direct programmatic emission with no delegation, the two management
references SHOULD match. Descriptor imports and delegated processing MUST
retain their actual origin; the source-correlation contract does not overwrite
that provenance with a proxy interaction endpoint.

#### Scenario: Both management annotations are present

- **WHEN** a provider emits an AI asset or source Location
- **THEN** both Backstage management/origin annotations are nonempty
- **AND** each value has valid `<type>:<target>` location-reference syntax

#### Scenario: Direct programmatic provenance

- **GIVEN** a programmatic provider directly emits an entity without delegated discovery
- **WHEN** it sets the entity's management annotations
- **THEN** the management and origin references match

#### Scenario: Descriptor import retains actual origin

- **GIVEN** an agent is discovered through a catalog descriptor import and later used through OGX
- **WHEN** its AI source correlation is recorded under the adoption profile
- **THEN** its source records that discovery path
- **AND** its existing Backstage processing/origin provenance is preserved
- **AND** OGX interaction alone does not replace its discovery source

### Requirement: Mutation ownership is distinct from source correlation

Providers MUST scope full mutations to their complete provider-owned entity set. Mutation
`locationKey` protects against conflicting definitions sharing an entity
reference; it is not a separate full-mutation bucket or a catalog entity link.
Source annotations grant neither mutation ownership nor cross-provider merging.
Detailed incremental reconciliation remains with RHIDP-18846.

#### Scenario: Distinct location keys protect an existing entity

- **GIVEN** an existing entity has a nonempty mutation locationKey
- **WHEN** another provider submits the same entity reference with a different locationKey
- **THEN** the incoming definition conflicts with the existing entity
- **AND** its metadata does not silently replace the existing source/version metadata

#### Scenario: Full mutation accounts for all owned source partitions

- **GIVEN** one provider identity owns entities and Locations for two configured sources
- **WHEN** it submits a full mutation as its complete entity set
- **THEN** the set accounts for both source partitions and their source Locations
- **AND** it does not submit one source's partial result as the provider's complete set

#### Scenario: Observed OGX management annotation differs from locationKey

- **GIVEN** the current OGX model provider
- **WHEN** it emits its model-server entity
- **THEN** its locationKey is `ogx-model-entity-provider`
- **AND** its management annotation is `ogx-model-entity-provider:ogx-model-server`

The observed example is inventory evidence, not a prescribed future identity
algorithm. Backstage also allows replacement when an existing entity has no
locationKey; sharing a key alone does not establish safe multi-writer ownership.

### Requirement: Provider-owned targetless source Locations

Adopting providers MUST emit one Location per configured logical source/path,
including sources with zero assets. The provider owns those source records
through its mutation set; Location API registration and `locations` table rows
are not prerequisites. Each source Location MUST have `spec: {}` with no
`spec.type`, `spec.target`, or `spec.targets`. Optional service URLs belong in
`metadata.links`, not discovery targets. Assets and Locations emitted directly
by the provider are separate roots; correlation does not introduce automatic
parent/child relationships or cascading deletion.

This uses the documented [minimal Location shape](https://backstage.io/docs/features/software-catalog/descriptor-format/#kind-location).
No custom target-reader implementation is prescribed. Providers retain
responsibility for remote retrieval. Current providers do not emit these source
records; concrete identity/migration details remain with RHIDP-18849/18850.

#### Scenario: One provider consumes multiple logical sources

- **GIVEN** one SkillsCatalogProvider consumes OCI sources `quay-prod` and `quay-staging`
- **WHEN** it builds source records and asset metadata
- **THEN** it emits two Locations with distinct canonical references
- **AND** each asset references its actual configured source's Location
- **AND** equal endpoint URLs do not merge distinct configured source identities

#### Scenario: Proxy query and configured agent discovery are separate sources

- **GIVEN** models are retrieved through an OGX API and agents are discovered through configuration
- **WHEN** the adopting integrations build their source records
- **THEN** the model and agent discovery paths have distinct source Locations
- **AND** they do not infer an OGX agent REST discovery endpoint

#### Scenario: Hidden proxy remotes are not invented

- **GIVEN** a proxy exposes a configured source but no identifiable upstream remote provenance
- **WHEN** a provider constructs source metadata
- **THEN** it records the known configured ingestion source/path
- **AND** it does not fabricate Location records claiming unknown upstream identities

#### Scenario: Location identity survives connection changes

- **GIVEN** a configured source retains its stable identity scoped by provider configuration and ingestion path
- **WHEN** the provider restarts or its endpoint/credentials change
- **THEN** the source Location retains its canonical reference
- **AND** assets continue to reference that Location

#### Scenario: Source record does not trigger descriptor reading

- **GIVEN** a provider emits a valid source Location with `spec: {}` and valid management annotations
- **WHEN** standard catalog processing handles that Location
- **THEN** it processes successfully without invoking `readLocation` for a target on that record
- **AND** it emits no additional assets from the source Location

#### Scenario: Configured source has a healthy empty result

- **GIVEN** a source remains configured and owned by the provider
- **WHEN** a successful scan returns zero assets
- **THEN** the source Location remains present

#### Scenario: Configured source is unavailable

- **GIVEN** a source remains configured and owned by the provider
- **WHEN** its first retrieval fails or a later retrieval is incomplete or unavailable
- **THEN** its source record is retained or emitted as a configured source Location
- **AND** retrieval failure alone does not retire the source

Detailed deletion/recovery mechanics belong to RHIDP-18848 and adoption
profiles. Explicit retirement must account for correlated assets and
retained-content obligations before removing the source Location; a removed
provider cannot be assumed to execute a final empty mutation. These deferred
responsibilities are not runtime acceptance scenarios for this story.
These source-record guarantees do not determine whether failed or
incomplete retrieval permits removal of previously ingested assets. Location
has no native `spec.owner` behavior assumed by this contract; mutation ownership
is separate from asset or administrative display ownership.

### Requirement: Deterministic identity and duplicate ingestion prevention

Providers MUST construct deterministic source/asset identities. Distinct logical
sources that coexist need non-colliding references scoped to their configured
provider/source boundaries. Intentional overlapping ingestion requires a chosen
ingestion owner, not automatic merging or shared ownership inferred from URLs,
annotations, or equal location keys. Profiles define exact naming and migration.

#### Scenario: Same source asset keeps its identity across refreshes

- **GIVEN** two refresh cycles under the same provider/source identity
- **WHEN** the source reports the same asset
- **THEN** both cycles produce the same kind, namespace, and metadata.name
- **AND** an update under the same ownership does not create a second entity

#### Scenario: Distinct provider-owned sources coexist

- **GIVEN** two providers own distinct configured source records with non-colliding asset references
- **WHEN** both submit their source Locations and assets
- **THEN** both sources and their assets coexist
- **AND** each asset references its own source Location
- **AND** neither provider gains ownership of the other's entities through correlation

### Requirement: Semantic metadata preserves native representation

Known provider mappings MUST populate the semantic category alongside native
kind/`spec.type`. AI source correlation resolves the configured source Location;
Backstage management annotations retain processing provenance. This requirement
does not mandate annotation-based browse filtering or a new conflict validator.
Those current behaviors and pending frontend recommendations are recorded in
[design Decision 7](../../design.md#decision-7-frontend-feedback-status).

#### Scenario: Known native model-server mapping is preserved

- **GIVEN** a provider emits a known model server as `AiModelServerAPI` / `ai-model-server`
- **WHEN** it populates the common AI metadata
- **THEN** `rhdh.io/ai-asset-category` is `model-server`
- **AND** kind and spec.type retain their native model-server values

#### Scenario: Source correlation does not replace processing provenance

- **GIVEN** an asset references `location:default/ai-source-ogx-prod-east`
- **AND** it has valid Backstage management/origin location references
- **WHEN** a consumer resolves its AI source provenance
- **THEN** catalog lookup uses the canonical AI source entity reference
- **AND** management/origin annotations retain their separate processing meanings

### Requirement: Missing required metadata remains invalid

AI assets MUST carry all three required annotations; current SDK validation rejects missing annotations. The target source
contract adds reference/correlation semantics without inventing an upstream
classification fallback or automatic skipping policy. Each integration consumes
known source records; general classification of unknown source types is not a
requirement of this change.

#### Scenario: AI asset has no version annotation

- **GIVEN** an entity carries category `agent` but no version annotation
- **WHEN** the current CatalogProcessor validates its AI annotations
- **THEN** validation rejects the entity and identifies the missing version annotation

#### Scenario: AI asset has no source annotation

- **GIVEN** an entity carries category `agent` and a valid version but no source annotation
- **WHEN** the current CatalogProcessor validates its AI annotations
- **THEN** validation rejects the entity and identifies the missing source annotation

The existing SDK normalizer returns `0.0.0-unknown` for missing or unrecognized
version input, as documented in the inherited
[annotation specification](../../../../../specifications/annotation-specification.md).
That is current behavior, not a newly selected future fallback. RHIDP-18845
owns future normalization, scheme, comparison, and original-value requirements.
