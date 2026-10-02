# ai-skills-common

Shared v1 skill record and snapshot contract for RHDH skill connectors
and the common catalog provider.

This library owns schemas, validation, and pure helpers. It performs
no network, scheduler, database, or Catalog operations.

## Overview

The `ai-skills-common` package defines the versioned normalized REST contract
(`SkillRecord`, `SkillSnapshot`) that OCI and npx skill connectors expose
at `GET /skills/:sourceId`. The common catalog provider validates and
consumes these snapshots to produce `AiResource` entities.

## Types

| Type             | Description                                                       |
| ---------------- | ----------------------------------------------------------------- |
| `SkillRecord`    | Base normalized v1 skill record with required and optional fields |
| `OciSkillRecord` | OCI-source record with optional `extensions.oci` container        |
| `NpxSkillRecord` | npx-source record with optional `extensions.npx` container        |
| `SkillSnapshot`  | Versioned snapshot containing records, status, and metadata       |
| `SnapshotSource` | Source identity (`id` and `type`)                                 |
| `SnapshotStatus` | `'loading' \| 'ready' \| 'partial' \| 'failed'`                   |

## Constants

| Constant                   | Value             | Description                                      |
| -------------------------- | ----------------- | ------------------------------------------------ |
| `MAX_SNAPSHOT_RECORDS`     | `1_000`           | Maximum number of records in a single snapshot   |
| `MAX_SNAPSHOT_BYTES`       | `5 * 1024 * 1024` | Maximum serialized snapshot size (5 MiB)         |
| `MAX_RESPONSE_BYTES`       | `5 * 1024 * 1024` | Maximum response read size for consumers (5 MiB) |
| `SUPPORTED_SCHEMA_VERSION` | `'1'`             | Supported schema version                         |

## Normalization

Pure metadata normalizers implementing design D3 native-field mappings
and precedence. These functions accept already-parsed, verified inputs
and return schema-valid `SkillRecord`s or explicit per-record
diagnostics. They perform no network, scheduler, database, or catalog
operations.

### Functions

| Function               | Description                                                |
| ---------------------- | ---------------------------------------------------------- |
| `normalizeOciMetadata` | Normalizes OCI SkillCard and Markdown frontmatter metadata |
| `normalizeNpxMetadata` | Normalizes npx discovery entry and Markdown frontmatter    |

### Input types

| Type                     | Description                                                 |
| ------------------------ | ----------------------------------------------------------- |
| `OciNativeInput`         | Combined OCI SkillCard and frontmatter for normalization    |
| `OciSkillCard`           | Parsed OCI SkillCard document                               |
| `OciSkillCardMetadata`   | Parsed OCI SkillCard metadata fields                        |
| `OciSkillCardSpec`       | Parsed OCI SkillCard spec fields                            |
| `OciMarkdownFrontmatter` | Parsed OCI Markdown frontmatter                             |
| `NpxNativeInput`         | Combined npx discovery entry and frontmatter                |
| `NpxDiscoveryEntry`      | Parsed npx discovery entry                                  |
| `NpxFrontmatter`         | Parsed npx Markdown frontmatter                             |
| `TrustedSourceInput`     | Trusted source identity/integrity fields from the connector |

### Result types

| Type                      | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `NormalizationResult<T>`  | Contains the normalized record (or null) and diagnostics |
| `NormalizationDiagnostic` | A single diagnostic with field name and message          |

### Constants

| Constant              | Value | Description                                   |
| --------------------- | ----- | --------------------------------------------- |
| `MAX_TAG_LENGTH`      | `63`  | Maximum tag length for Backstage catalog tags |
| `CATALOG_TAG_PATTERN` | regex | Backstage catalog tag validation pattern      |

### Behavior

- **D3 precedence**: Each field has an ordered list of candidates.
  The first non-empty, correctly typed value wins.
- **Tag processing**: Tags are trimmed, lowercased, deduplicated, and
  validated against `CATALOG_TAG_PATTERN`. Invalid or overlength tags
  are omitted with diagnostics.
- **Author normalization**: String authors are normalized to
  `[{ name: value }]`. Array authors require a non-empty `name`.
  Invalid entries are omitted with diagnostics.
- **Extension allowlisting**: Only `extensions.oci.namespace`,
  `extensions.oci.prompt`, and `extensions.npx.type` are preserved.
- **Diagnostics**: Non-string candidates at any priority level emit
  a diagnostic even when a valid lower-priority candidate is selected.

## Validation

- `validateSnapshot(snapshot)` — validates a complete v1 snapshot
  including schema version, source identity, status invariants,
  record fields, source-discriminated extensions, unique keys,
  disjoint failed keys, and count bounds.
- `validateSnapshotSize(snapshot)` — validates serialized byte size
  against the 5 MiB limit.
- `isValidDigest(digest)` — checks `sha256:<64 lowercase hex>` format.
- `isValidUtcTimestamp(value)` — checks for valid ISO 8601 UTC
  timestamps (strings ending in `Z` or `+00:00`).

## Snapshot construction

- `boundSnapshot(options)` — creates a bounded v1 snapshot with
  deterministic stable-key ordering and longest-prefix selection
  within count (1,000) and byte-size (5 MiB) limits.
- `sortRecordsByKey(records)` — sorts skill records by stable `key`
  in ascending Unicode code-point order.
- `createLoadingSnapshot(source)` — creates a loading snapshot for
  initial state.
- `createFailedSnapshot(source, observedAt)` — creates a failed
  snapshot.

## REST contract

Each connector exposes `GET /skills/:sourceId` relative to its
Backstage plugin base URL. The endpoint uses Backstage's default
backend service-to-service authentication. Responses contain a single
bounded `SkillSnapshot` v1 JSON body.

| Status | Meaning                      |
| ------ | ---------------------------- |
| 200    | Returns a `SkillSnapshot` v1 |
| 404    | Unknown `sourceId`           |

## Fixtures

The package exports valid and invalid OCI/npx fixtures for connector
and provider contract tests. Import them from the package root.

## Installation

```bash
yarn add @red-hat-developer-hub/backstage-plugin-ai-skills-common
```
