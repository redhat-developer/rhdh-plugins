# translations

Welcome to the translation backend plugin!

This plugin serves JSON translation files from the RHDH repository's `/translations` directory and files mounted in the RHDH pod. It exposes `/api/translations`. Paths listed in `i18n.overrides` take highest priority. The result is cached until the backend restarts.

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
start-backend` in the root directory, and then navigating to [/api/translations](http://localhost:7007/api/translations).

## Configuring JSON overrides

The backend discovers valid JSON files in the repository-root `/translations`
directory, including files mounted there. Shipped catalogs are merged in source
order, followed by customer files with other basenames. Paths in
`i18n.overrides` are applied after all discovered files, in the order listed;
use this setting when a file must take priority over another discovered file.

```yaml title="app-config.yaml"
i18n:
  overrides:
    - /opt/app-root/src/translations/custom-overrides.json
```

To add an override:

1. Create a JSON file whose top-level key is a translation reference ID, then
   add the locale and messages you want to override. Message keys use the same
   names as the translation reference.

   ```json
   {
     "plugin.homepage": {
       "en": {
         "header.welcome": "Welcome back! (custom override)"
       }
     }
   }
   ```

2. Place the file in the RHDH repository-root `translations/` directory for
   local development, or mount it at `/opt/app-root/src/translations/` in a
   deployment. Files in that directory are discovered automatically.

3. Add the file's path to `i18n.overrides` when it must override values from
   other discovered files. Use the path as seen by the backend process; for a
   ConfigMap mounted at the path above, configure
   `/opt/app-root/src/translations/custom-overrides.json`.

4. Restart the backend after changing the file. The translation response is
   cached until the backend restarts.

The repository demo config points to an explicit override in
`translations/app-config-overrides-demo.json`; its value takes precedence over
the automatically discovered demo file with the same key. In the local RHDH
workspace, the backend runs from `packages/backend`, so the configured path to
the root `translations/` directory starts with `../../translations/`.

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn start` from the root directory.
