# @red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk

SDK for AI asset entity providers in the Backstage catalog.

Exports annotation constants, validation utilities, entity-provider interfaces, and the delta sync framework for the AI catalog entity model.

The provider interfaces, validators, category vocabulary, and delta helpers were
recovered for RHDH 2.2 reconciliation under
[RHIDP-18760](https://redhat.atlassian.net/browse/RHIDP-18760) and reconciled
under [RHIDP-18762](https://redhat.atlassian.net/browse/RHIDP-18762) to the
agreed 2.2 minimum baseline. The category vocabulary covers the five minimum
categories (`agent`, `skill`, `mcp-server`, `ai-model`, `model-server`) plus
retained `rule` compatibility. `skill-bundle` is excluded from the active
vocabulary.

Provider SDK helpers remain unregistered with live providers. Consuming providers
own durable cursor persistence, first/full refresh, source-cursor recovery, and
the choice to request deltas. Metadata/per-kind SDK design, incremental-sync
design, and provider adoption remain deferred. See the
[recovery manifest](../../specifications/RHIDP-18760-recovery-manifest.md).

## Installation

```bash
yarn add @red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk
```

## Annotation constants

Every entity emitted by an AI asset provider must carry three required annotations:

| Constant                       | Value                       | Description                             |
| ------------------------------ | --------------------------- | --------------------------------------- |
| `AI_ASSET_CATEGORY_ANNOTATION` | `rhdh.io/ai-asset-category` | Asset category                          |
| `AI_ASSET_VERSION_ANNOTATION`  | `rhdh.io/ai-asset-version`  | Semver-normalized version string        |
| `AI_ASSET_SOURCE_ANNOTATION`   | `rhdh.io/ai-asset-source`   | Provider/registry provenance identifier |

```ts
import {
  AI_ASSET_CATEGORY_ANNOTATION,
  AI_ASSET_VERSION_ANNOTATION,
  AI_ASSET_SOURCE_ANNOTATION,
} from '@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk';
```

## Category validation

The `AIAssetCategory` type defines the allowed AI asset categories as a string union: `agent`, `skill`, `rule`, `mcp-server`, `ai-model`, `model-server`. The `AI_ASSET_CATEGORIES` constant provides the full list for display and validation.

Agent contract documentation, examples, and fixtures use `kind: AiResource`, `spec.type: agent`. The former `Component` / `ai-agent` mapping is historical, not an active fallback.

```ts
import {
  AI_ASSET_CATEGORIES,
  type AIAssetCategory,
} from '@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk';

const category: AIAssetCategory = 'agent';
console.log(AI_ASSET_CATEGORIES); // ['agent', 'skill', ...]
```

### Upgrading from SDK 1.x

SDK 1.2.1 exported `skill-bundle` as a public `AIAssetCategory` member.
The 2.0 release removes it from the public type, category list, and validation
schema. Remove `skill-bundle` from consumer typed values and provider annotation
inputs before upgrading. SDK validation rejects entities with that category.

Already-ingested catalog entities carrying
`rhdh.io/ai-asset-category: skill-bundle` also fail when passed through SDK 2.x
validation. Correct their source/provider output to an appropriate supported
category and re-ingest them, or retire the unsupported entities. Upgrading the
SDK does not automatically migrate or delete existing catalog entities.

## Entity validation

The `validateAIAssetEntity` function checks that an entity carries the required AI asset annotations with valid values. The `AIAssetValidator` class implements the Backstage `CatalogProcessor` interface for integration with the catalog processing pipeline.

```ts
import {
  validateAIAssetEntity,
  AIAssetValidator,
} from '@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk';
```

## Entity-provider interface

The `AIAssetEntityProvider` interface defines the contract for providers that emit AI asset catalog entities from external registries. It supports both full-refresh (`entities()`) and incremental delta sync (`delta()`) patterns.

```ts
import type { AIAssetEntityProvider } from '@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk';
```

## Delta sync framework

`DeltaSyncManager` wraps Backstage's `applyMutation({ type: 'delta' })` API and manages cursor persistence via the `CursorStore` interface. `CursorStore` is an interface; `InMemoryCursorStore` is provided for development and testing. Consuming providers own durable persistence, first/full refresh, source-cursor recovery, and the choice to request deltas. Clearing a cursor only deletes stored cursor state — it does not initiate a full refresh.

```ts
import {
  DeltaSyncManager,
  InMemoryCursorStore,
} from '@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk';
```

## Version normalization

The `normalizeAIAssetVersion` utility normalizes version strings from external registries into a semver-compatible format:

| Input          | Output           | Rule                |
| -------------- | ---------------- | ------------------- |
| `1.2.3`        | `1.2.3`          | Semver pass-through |
| `2.0.0-beta.1` | `2.0.0-beta.1`   | Semver pass-through |
| `20260708`     | `0.0.0-20260708` | Date (compact)      |
| `2026-07-08`   | `0.0.0-20260708` | Date (dashed)       |
| `a1b2c3d`      | `0.0.0-a1b2c3d`  | Commit hash         |
| `latest`       | `0.0.0-unknown`  | Fallback + warning  |

```ts
import { normalizeAIAssetVersion } from '@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk';

normalizeAIAssetVersion('1.2.3'); // '1.2.3'
normalizeAIAssetVersion('20260708'); // '0.0.0-20260708'
normalizeAIAssetVersion('a1b2c3d'); // '0.0.0-a1b2c3d'
normalizeAIAssetVersion('unknown-fmt', {
  entityRef: 'airesource:default/my-agent',
  warn: msg => logger.warn(msg),
}); // '0.0.0-unknown'
```
