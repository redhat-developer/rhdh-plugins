# @red-hat-developer-hub/backstage-plugin-ai-catalog-entity-provider-sdk

SDK for AI asset entity providers in the Backstage catalog.

Exports annotation constants and version normalization for the AI catalog entity model.

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
