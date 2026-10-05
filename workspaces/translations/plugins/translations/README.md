# translations

## NFS JSON translations

Install `translationsApiModule` in the app's `features` list and install the
translations backend plugin. The module retains NFS `TranslationBlueprint`
resources, then merges the JSON catalog served by `/api/translations` over
each requested translation reference and locale. JSON files in RHDH's
repository-root `translations` directory, as well as files mounted there, are
discovered by the backend on startup;
`i18n.overrides` files take highest priority. Add a new language to the NFS
`app.extensions` language selector through `availableLanguages`.

```ts
import translationsApiModule from '@red-hat-developer-hub/backstage-plugin-translations/translations-api-module';

const app = createApp({ features: [translationsApiModule] });
```

Welcome to the translations plugin!

_This plugin was created through the Backstage CLI_

## Getting started

Your plugin has been added to the example app in this repository, meaning you'll be able to access it by running `yarn start` in the root directory, and then navigating to [/translations](http://localhost:3000/translations).

You can also serve the plugin in isolation by running `yarn start` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](./dev) directory.
