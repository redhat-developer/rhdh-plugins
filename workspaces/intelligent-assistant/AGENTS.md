# Intelligent Assistant Plugin for RHDH

## Build & Test Commands

- Install: `yarn install`
- Build: `yarn build:all`
- Test all: `yarn test:all`
- Test single file: `yarn test -- path/to/test.ts`
- E2E tests: `yarn test:e2e`
- Lint: `yarn lint`
- Lint single file: `yarn lint --fix path/to/file.ts`
- Type check: `yarn tsc`
- Dev: `yarn start`

## Key Conventions

- UI uses PatternFly components for the chat interface, not MUI
- The frontend uses the new Backstage frontend plugin API (NFS)

## Architecture (only non-obvious parts)

- `packages/app` uses the new Backstage frontend plugin API
- Backend uses Knex for database access; migrations live in `plugins/intelligent-assistant-backend/migrations/`
- `packages/` is strictly for the dev environment; do not add application code there

## PR Conventions

- All commits must have an `Assisted-by: <model>` footer below the sign offs
