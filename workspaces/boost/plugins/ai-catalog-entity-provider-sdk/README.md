# @red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk

SDK for AI asset entity providers in the Backstage catalog.

Exports annotation constants, validation utilities, entity-provider interfaces, and the delta sync framework for the AI catalog entity model.

The provider interfaces, validators, category vocabulary, and delta helpers were
recovered for RHDH 2.2 reconciliation under
[RHIDP-18760](https://redhat.atlassian.net/browse/RHIDP-18760). They do not expand
the RHDH 2.1 release contract and are not registered with live providers by this
recovery. Their annotation policy, minimum categories, and synchronization
contract remain subject to the follow-on work in
[RHIDP-18761](https://redhat.atlassian.net/browse/RHIDP-18761) and
[RHIDP-18762](https://redhat.atlassian.net/browse/RHIDP-18762), followed by the
deferred SDK design decisions. See the
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

The `AIAssetCategory` type defines the allowed AI asset categories as a string union: `agent`, `skill`, `rule`, `skill-bundle`, `mcp-server`, `ai-model`, `model-server`. The `AI_ASSET_CATEGORIES` constant provides the full list for display and validation.

```ts
import {
  AI_ASSET_CATEGORIES,
  type AIAssetCategory,
} from '@red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk';

const category: AIAssetCategory = 'agent';
console.log(AI_ASSET_CATEGORIES); // ['agent', 'skill', ...]
```

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

`DeltaSyncManager` wraps Backstage's `applyMutation({ type: 'delta' })` API and manages cursor persistence via the `CursorStore` interface. `InMemoryCursorStore` is provided for development and testing.

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
  entityRef: 'component:default/my-agent',
  warn: msg => logger.warn(msg),
}); // '0.0.0-unknown'
```
