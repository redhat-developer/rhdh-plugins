# @red-hat-developer-hub/backstage-plugin-app-defaults

RHDH app modules for the **new frontend system**, registered against `pluginId: 'app'`.

## Usage

- **Dynamic loading**: default export is the `appDrawerModule` `FrontendModule` suitable for `@backstage/frontend-dynamic-feature-loader`.
- **Static**: import from `@red-hat-developer-hub/backstage-plugin-app-defaults` for `appDrawerModule` and `appDefaultsModule`.

### App Integration

```typescript
import { createApp } from '@backstage/frontend-defaults';
import { appDrawerModule } from '@red-hat-developer-hub/backstage-plugin-app-defaults';

export default createApp({
  features: [
    appDrawerModule,
    // ...other plugins and modules
  ],
});
```
