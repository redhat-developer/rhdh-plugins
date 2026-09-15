## ADDED Requirements

### Requirement: Public Quay skillimage discovery

The OCI provider SHALL discover repositories in a configured public Quay
organization using paginated discovery. It SHALL select the configured tag, or
`latest` when absent, resolve it to a digest, and fetch the manifest by that
digest. Image layers SHALL NOT be downloaded during catalog ingestion.

#### Scenario: Unmarked repository

- **WHEN** a discovered repository's manifest lacks required OCTO skillimage
  metadata annotations
- **THEN** the provider skips it as a non-skill and increments its skip counter

### Requirement: OCI skill entity emission

For an OCTO skillimage manifest, the provider SHALL emit one `AiResource` with
an OCI source location and a digest-pinned `rhdh.io/oci-skill-ref` derived from
the same resolved reference.

#### Scenario: Moving tag

- **WHEN** a configured tag is resolved during sync
- **THEN** metadata is read only from the resulting digest-pinned manifest and
  the emitted entity references that digest
