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

**Who cannot see a card (`unless`).** A node can have an optional `unless` block. It uses the same shape as `if` (`users`, `groups`, `permissions`) but acts as a **denylist**—if any condition matches, the widget is hidden.

- `unless` is checked **before** `if`. Deny wins: if both match, the widget is hidden.
- Rules inside `unless` also use **OR** logic—matching any user, group, or permission triggers the exclusion.
- On a group node, `unless` prunes the entire subtree without evaluating children.
- If `unless` is missing or empty, it never excludes.

**Tags (`tags`).** A leaf node can have an optional `tags` array of strings (for example `['admin', 'developer']`). Tags are used for RBAC conditional policy filtering with the `HAS_TAG` permission rule.

- Tags are passed through to the API response so the RBAC layer can filter on them.
- Widgets **without** tags bypass tag-based RBAC filtering entirely—they are always included when the RBAC decision is `CONDITIONAL`.
- Tags have no effect on config-time `if`/`unless` checks. They only matter at the RBAC layer.

At startup the backend finds every permission name used in `if` and `unless` blocks across the tree. Each request checks only those names in one batch.

**Leaves vs groups.** A **leaf** needs `id` and `ref`. A **group** needs `children` and must not use `id` or `ref`. The full rules are in `src/defaultWidgets/loadDefaultWidgets.ts`.

### `app-config.yaml` example

```yaml
homepage:
  defaultWidgets:
    # --- Simple card with tags ---
    - id: onboarding
      ref: 'rhdh-onboarding-section'
      tags: [public]
      layout:
        xl: { w: 12, h: 6 }
        lg: { w: 12, h: 6 }

    # --- Card visible to developers, tagged for RBAC filtering ---
    - id: template-list
      ref: 'rhdh-template-section'
      tags: [developer]
      if:
        groups: [group:default/developers]
      layout:
        xl: { w: 12, h: 5 }

    # --- Card visible to developers but hidden from interns (unless) ---
    - id: quickaccess-card
      ref: quickaccess-card
      tags: [developer]
      if:
        groups: [group:default/developers]
      unless:
        groups: [group:default/interns]
      layout:
        xl: { w: 6, h: 8, x: 6 }

    # --- Group with children (shared visibility) ---
    - if:
        groups: [group:default/admins]
      children:
        - id: rbac
          ref: RBAC
          tags: [admin]
          layout:
            xl: { w: 12, h: 6 }

    # --- Group hidden from a specific user via unless ---
    - if:
        groups: [group:default/admins]
      unless:
        users: [user:default/alice]
      children:
        - id: audit-log
          ref: platform-audit
          tags: [admin]
          layout:
            xl: { w: 12, h: 6 }

    # --- Entire subtree hidden from viewers ---
    - unless:
        groups: [group:default/viewers]
      children:
        - id: dev-tools
          ref: dev-tools-card
          tags: [developer]
          layout:
            xl: { w: 12, h: 4 }
```

### Three filtering layers

```
Config (if/unless)  -->  Permission check (ALLOW/DENY/CONDITIONAL)  -->  Conditional rules (HAS_TAG/HAS_WIDGET_ID)
     Layer 1                        Layer 2                                        Layer 3
```

- **Layer 1** always runs—identity and group based (`if`/`unless`).
- **Layer 2**—RBAC returns ALLOW (pass all), DENY (block all), or CONDITIONAL (apply Layer 3).
- **Layer 3**—rule-based filtering on survivors from Layer 1 using `HAS_TAG` and/or `HAS_WIDGET_ID`.

### Permission rules

The plugin registers two permission rules for the `homepage-default-widget` resource type:

| Rule            | Params                | Description                                            |
| --------------- | --------------------- | ------------------------------------------------------ |
| `HAS_WIDGET_ID` | `widgetIds: string[]` | Matches widgets whose `id` is in the list              |
| `HAS_TAG`       | `tags: string[]`      | Matches widgets that have at least one overlapping tag |

These rules can be used in RBAC conditional policies (via file or the RBAC UI) to control which widgets a role can see. Widgets without tags bypass `HAS_TAG` filtering entirely.
