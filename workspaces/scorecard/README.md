# [Backstage](https://backstage.io) — Scorecard

This workspace contains the Scorecard plugin and a Backstage example app. The frontend is available in two packages: **app** (New Frontend System / NFS) and **app-legacy** (legacy frontend).

## Getting started

```sh
yarn install
```

- **app (NFS, default):** Run `yarn start` to start the NFS app and backend. Open [http://localhost:3000](http://localhost:3000), then go to Catalog and open an entity to use the Scorecard tab.
- **app-legacy:** Run `yarn start:legacy` to start the legacy frontend with the backend. Use the Scorecard tab on entity pages or the scorecard homepage card.

> **Notice:** The guest user has admin permissions in this application for quick setup. For better control, specify more users and groups in `app-config.local.yaml` and define a separate admin/admins permission instead of using the guest user. Using the guest user as admin is not recommended for permission management.
