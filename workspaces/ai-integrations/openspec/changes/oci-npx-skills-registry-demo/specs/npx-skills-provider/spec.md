## ADDED Requirements

### Requirement: Public npx-compatible skill discovery

The npx provider SHALL consume a public Agent Skills v0.2 discovery index and
process only declared `skill-md` entries. It SHALL support RHESS and other
sources implementing that index contract without cloning or crawling Git
repositories.

#### Scenario: Archive entry

- **WHEN** an index declares an `archive` entry
- **THEN** the provider skips it and logs that archive ingestion is out of scope

### Requirement: Verified, safe artifact retrieval

The provider SHALL retrieve each artifact over HTTPS, enforce same-origin or
explicitly allowlisted origins, reject redirects outside the allowlist, cap an
artifact at 1 MiB, and verify its SHA-256 digest before entity emission. Its
`rhdh.io/npx-skill-ref` SHALL retain the verified artifact reference and digest.

#### Scenario: Digest mismatch

- **WHEN** an artifact's SHA-256 differs from the discovery index value
- **THEN** the provider logs and rejects the new artifact while retaining the
  last-known-good entity
