# test-plugins

Workspace for RHDH test / fixture plugins used to exercise other plugins in
isolation (for example theme and UI component fixtures formerly hosted in the
theme workspace).

## Packages

| Package                                             | Role                                    |
| --------------------------------------------------- | --------------------------------------- |
| `@red-hat-developer-hub/backstage-plugin-bcc-test`  | Backstage Core Components fixture pages |
| `@red-hat-developer-hub/backstage-plugin-bui-test`  | Backstage UI (BUI) fixture pages        |
| `@red-hat-developer-hub/backstage-plugin-mui4-test` | Material UI v4 fixture pages            |
| `@red-hat-developer-hub/backstage-plugin-mui5-test` | Material UI v5 fixture pages            |
| `@red-hat-developer-hub/backstage-plugin-qe-theme`  | QE dynamic theme loading fixture        |

## Development

```bash
cd workspaces/test-plugins
yarn install
yarn start
```

Or start a single plugin:

```bash
yarn workspace @red-hat-developer-hub/backstage-plugin-bcc-test start
```
