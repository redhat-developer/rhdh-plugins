# AI Integration Plugins for RHDH

## Build & Test Commands

- Install: `yarn install`
- Build: `yarn build:all`
- Test all: `yarn test:all`
- Test single file: `yarn test -- path/to/test.ts`
- Lint: `yarn lint:all`
- Lint single file: `yarn lint --fix path/to/file.ts`
- Type check: `yarn tsc`
- Dev environment: `yarn dev`

## Key Conventions

- Follows standard Backstage plugin structure: frontend plugin, backend plugin, and common shared library
- Backend module (e.g. `catalog-backend-module-model-catalog`) extend Backstage catalog plugin

## Architecture (only non-obvious parts)

- `packages/` in each plugin is strictly for the dev environment; do not add application code there
- `ai-experience-common` holds shared types and API definitions used by both frontend and backend

## PR Conventions

- All commits must have an `Assisted-by: <model>` footer below the sign offs
