# @red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk

SDK for AI asset entity providers in the Backstage catalog.

Exports annotation constants, validation utilities, interface contracts, and adapter types for the AI catalog entity model.

## Installation

```bash
yarn add @red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk
```

## Annotation constants

```ts
import {
  AI_ASSET_CATEGORY_ANNOTATION,
  AI_ASSET_VERSION_ANNOTATION,
  AI_ASSET_SOURCE_ANNOTATION,
} from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';
```

## Implementing an entity provider

```ts
import type { AIAssetEntityProvider } from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';

class MyProvider implements AIAssetEntityProvider {
  async connect() {
    /* set up HTTP client */
  }
  async *entities() {
    /* yield catalog entities */
  }
  getProviderName() {
    return 'my-provider';
  }
  getProviderId() {
    return 'default';
  }
}
```

## Validation

```ts
import { validateAIAssetEntity } from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';

validateAIAssetEntity(entity); // throws on invalid annotations
```

## Version normalization

```ts
import { normalizeAIAssetVersion } from '@red-hat-developer-hub/backstage-plugin-boost-entity-provider-sdk';

normalizeAIAssetVersion('1.2.3'); // '1.2.3'
normalizeAIAssetVersion('20260708'); // '0.0.0-20260708'
normalizeAIAssetVersion('a1b2c3d'); // '0.0.0-a1b2c3d'
```
