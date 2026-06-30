# boost

Welcome to the boost frontend plugin!

## Getting started

### Full app (recommended)

The plugin is registered in `packages/app`. From the workspace root:

```bash
yarn start
```

Navigate to [/ai-catalog](http://localhost:3000/ai-catalog).

### Isolated development

For faster iteration on the frontend plugin alone, run from this directory:

```bash
yarn start
```

This uses the dev app in [`dev/`](./dev/) with quicker startup and hot reloads; it also lands on `/ai-catalog`. The backend plugin can be developed in isolation from `plugins/boost-backend` via `yarn dev` at the workspace root.

## Architecture

This plugin is built with Backstage's [frontend system](https://backstage.io/docs/frontend-system/architecture/index). See the [plugin builder documentation](https://backstage.io/docs/frontend-system/building-plugins/index) for extension patterns.
