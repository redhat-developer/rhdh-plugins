# translations

Welcome to the translation backend plugin!

This plugin provides a simple backend service in RHDH that serves translation files by returning their JSON content. It exposes an endpoint (/api/translation) and reads the specified JSON translation files.

## Installation

This plugin is installed via the `@red-hat-developer-hub/backstage-plugin-translations-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-translations-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-translations-backend'),
);
```

## Getting started

Your plugin has been added to the backend app in this repository, meaning you'll be able to access it by running `yarn
start-backend` in the root directory, and then navigating to [/api/translation](http://localhost:7007/api/translation).

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn start` from the root directory.
