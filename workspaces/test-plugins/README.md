# test-plugins

Workspace for RHDH test / fixture plugins used to exercise other plugins in
isolation (for example `@red-hat-developer-hub/backstage-plugin-global-header-test`).

## Packages

| Package                                                      | Role                                       |
| ------------------------------------------------------------ | ------------------------------------------ |
| `@red-hat-developer-hub/backstage-plugin-global-header-test` | Fixture UI for global-header contributions |

## Development

```bash
cd workspaces/test-plugins
yarn install
yarn start
```

Or start a single plugin:

```bash
yarn workspace @red-hat-developer-hub/backstage-plugin-global-header-test start
```
