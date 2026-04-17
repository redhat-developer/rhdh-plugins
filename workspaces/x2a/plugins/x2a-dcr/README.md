# @red-hat-developer-hub/backstage-plugin-x2a-dcr

A Backstage frontend plugin providing the OAuth2 consent page for the Dynamic Client Registration (DCR) flow.

> **Temporary plugin -- RHDH 1.9 only.**
> This plugin is a legacy-frontend reimplementation of the upstream [`@backstage/plugin-auth`](https://github.com/backstage/backstage/tree/master/plugins/auth).
> It will be replaced by `@backstage/plugin-auth` in RHDH 1.10+, which will be based on the New Frontend System.

## Why this plugin exists

The upstream `@backstage/plugin-auth` is written exclusively for the Backstage **New Frontend System** (NFS) and uses APIs (`PageBlueprint`, `createFrontendPlugin`, `@backstage/ui`) that are not available in the legacy frontend.

RHDH 1.9 still runs the legacy frontend, so a compatible implementation is needed to support the DCR consent flow. This plugin fills that gap by using the legacy `@backstage/core-plugin-api` (`createPlugin`, `createRoutableExtension`) and Material-UI v4 components.

## What it does

Provides the route `/oauth2/authorize/:sessionId` where users can approve or deny OAuth2 authorization requests created by the `auth-backend`.

The consent page:

1. Fetches session details from `GET {auth-backend}/v1/sessions/{sessionId}`
2. Displays the requesting application name, callback URL, and a security warning
3. Lets the user **Authorize** or **Cancel** the request
4. Submits the decision via `POST {auth-backend}/v1/sessions/{sessionId}/approve` (or `/reject`)
5. Redirects the user to the callback URL returned by the backend

## Installation

```bash
# From the workspace root
yarn workspace app add @red-hat-developer-hub/backstage-plugin-x2a-dcr
```

### Wiring in the legacy app (`packages/app/src/App.tsx`)

```tsx
import { DcrConsentPage } from '@red-hat-developer-hub/backstage-plugin-x2a-dcr';

// Inside <FlatRoutes>:
<Route path="/oauth2/*" element={<DcrConsentPage />} />;
```

### RHDH dynamic plugin deployment

The plugin is exported and packaged as an OCI image by `scripts/build-dynamic-plugins.sh`

At RHDH 1.9 runtime, configure the dynamic plugin loader to mount `DcrConsentPage` at `/oauth2`.

## Lifecycle

| RHDH version | Status                                                             |
| ------------ | ------------------------------------------------------------------ |
| 1.9          | **Active** -- use this plugin                                      |
| 1.10+        | **Obsolete** -- drop in favor of upstream `@backstage/plugin-auth` |
