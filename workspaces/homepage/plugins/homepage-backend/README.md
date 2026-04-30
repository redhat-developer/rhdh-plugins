# homepage

Backend for the dynamic homepage. It reads default widget settings from config and exposes them over HTTP. The frontend uses this to show cards, and can hide cards per **user**, **group**, or **permission**.

## Installation

This plugin is installed via the `@red-hat-developer-hub/backstage-plugin-homepage-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-homepage-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(import('@red-hat-developer-hub/backstage-plugin-homepage-backend'));
```

## Development

Run `yarn start` in this package to work on the backend only.

Run `yarn start` from the repo root to run the full app with the frontend.

## Default widgets (`homepage.defaultWidgets`)

You list widgets under `homepage` in `app-config.yaml`. The backend checks this file when it starts. Bad config stops startup.

For each request to `GET /api/homepage/default-widgets`, the backend looks at the signed-in user and returns JSON `{ "items": [...] }`. That list is **only the card rows** (leaves), in order. Each item has `id`, `ref`, and optional `props` and `layout`.

**Groups and `children`.** You can group cards under a parent that has `children` only (no `id` or `ref` on that parent). The parent can use `if` to hide the whole group. Cards inside the group are normal leaves with `id` and `ref`. The parent row is not returned in `items`—only the cards.

**Who can see a card (`if`).** A node can have an optional `if` with `users`, `groups`, and/or `permissions`.

- If `if` is missing, or every list inside it is empty, **everyone** sees that node.
- If you set any list, the user must match **at least one** rule:
  - **users:** their user ref (for example `user:default/jane`) is in the list.
  - **groups:** they belong to a listed group. Membership comes from the catalog. If the user is not in the catalog, group rules do not match.
  - **permissions:** the permissions service **allows** any listed permission name.

Rules inside `if` use **OR** logic. If the parent fails its `if`, nothing under it is shown.

At startup the backend finds every permission name used in the tree. Each request checks only those names in one batch.

**Leaves vs groups.** A **leaf** needs `id` and `ref`. A **group** needs `children` and must not use `id` or `ref`. The full rules are in `src/defaultWidgets/loadDefaultWidgets.ts`.

### `app-config.yaml` example

```yaml
homepage:
  defaultWidgets:
    # --- Simple cards (leaves) ---
    # id = mountpoint id for the card; ref = which widget to render.
    - id: onboarding
      ref: 'rhdh-onboarding-section'
      layout:
        xl: { w: 12, h: 6 }
        lg: { w: 12, h: 6 }
    - id: quickaccess-card
      ref: quickaccess-card
      layout:
        xl: { w: 6, h: 8, x: 6 }

    # --- Group with children (shared visibility) ---
    # The group row has `if` and `children` only. All listed cards are hidden
    # unless the user passes the group's `if` (here: member of admins).
    - if:
        groups: [group:default/admins]
      children:
        - id: rbac
          ref: RBAC
          layout:
            xl: { w: 12, h: 6 }

    # --- group with several children ---
    # Use one parent to apply the same visibility to multiple cards.
    # - if:
    #     groups: [group:default/platform-team]
    #   children:
    #     - id: metrics-card
    #       ref: platform-metrics
    #       layout:
    #         xl: { w: 6, h: 8 }
    #     - id: logs-card
    #       ref: platform-logs
    #       layout:
    #         xl: { w: 6, h: 8 }
    #     # Each child can still have its own `if` for finer rules.
    #     - id: audit-card
    #       ref: platform-audit
    #       if:
    #         users: [user:default/auditor]

    # --- Commented: single card gated by permission ---
    # - id: admin-insights
    #   ref: admin-insights-card
    #   if:
    #     permissions: ['homepage.default-widgets.read']
```
