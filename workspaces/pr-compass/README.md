# PR Compass

This workspace contains PR Compass plugins and a Backstage example app using the New Frontend System (`packages/app`).

PR Compass is a personal triage board of ranked open pull requests awaiting the signed-in developer's review.

## Plugins

| Plugin                                                     | Package                                                      | Description                                                                     |
| ---------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| [pr-compass-backend](plugins/pr-compass-backend/README.md) | `@red-hat-developer-hub/backstage-plugin-pr-compass-backend` | Backend API and services for retrieving pull requests from registered providers |
| [pr-compass-node](plugins/pr-compass-node/README.md)       | `@red-hat-developer-hub/backstage-plugin-pr-compass-node`    | The `PullRequestProvider` interface and its extension point                     |
| [pr-compass-common](plugins/pr-compass-common/README.md)   | `@red-hat-developer-hub/backstage-plugin-pr-compass-common`  | Shared types and permissions                                                    |

## Documentation

Installation, configuration, permissions, and the API are documented in the [backend plugin README](plugins/pr-compass-backend/README.md).

## Development

For local development with mock data, see the plugin development guides: [backend](plugins/pr-compass-backend/DEVELOPING.md).

The workspace includes a dev app (`packages/app`) and dev backend (`packages/backend`) for local development.

> **Notice:** The guest user has admin permissions in this application for quick setup. For better control, specify more users and groups in `app-config.local.yaml` and define a separate admin/admins permission instead of using the guest user. Using the guest user as admin is not recommended for permission management.

```bash
# Install dependencies
yarn install

# Start the dev app + backend
yarn start
# Frontend: http://localhost:3000
# Backend: http://localhost:7007

# Run tests
yarn test:all
```
