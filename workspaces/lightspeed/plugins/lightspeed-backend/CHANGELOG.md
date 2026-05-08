# @red-hat-developer-hub/backstage-plugin-lightspeed-backend

## 2.7.0

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.7.0

## 2.6.8

### Patch Changes

- 02f64dc: add return statement to /v1/feedback error handler to prevent unhandled error fallthrough
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.8

## 2.6.7

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.7

## 2.6.6

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.6

## 2.6.5

### Patch Changes

- 96041ee: update default LCORE host from 0.0.0.0 to 127.0.0.1
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.5

## 2.6.4

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.4

## 2.6.3

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.3

## 2.6.2

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.
- Updated dependencies [5148408]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.2

## 2.6.1

### Patch Changes

- 3dfbbee: Update multer to v2.1.1
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.1

## 2.6.0

### Minor Changes

- c346ec1: updated config.d.ts to reflect app-config.yaml notebooks settings. Update notebooks system prompting

### Patch Changes

- cd803ed: harden proxy passthrough by adding allowlist for routes
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.6.0

## 2.5.1

### Patch Changes

- 5d17950: Retain Lightspeed chat and tool-call state when the chat UI remounts (for example when switching display mode between embedded and overlay), so the active thread and tool metadata are not dropped while messages are still streaming or before history refetches.
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.5.1

## 2.5.0

### Patch Changes

- d9df5b8: Add notebook chat with streaming support, document management, and UI improvements.
  - Backend: add SSE transform to normalize Responses API format to legacy streaming format so notebook chat streams token-by-token like the chat tab.
  - Frontend: add notebook chat view with conversation messages, document sidebar with per-document delete, and topic summary display.
  - Fix stale document list when re-opening a notebook by setting query staleTime to 0.
  - Hide model selector on the Notebooks tab while keeping the settings ellipsis menu visible.
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.5.0

## 2.4.0

### Minor Changes

- 161c1f2: ai-notebooks route name is now notebooks. Added a route to fetch single notebooks session by id

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.4.0

## 2.3.0

### Minor Changes

- dff8f34: All lightspeed query is now called with rhdh-docs vector_store. Notebooks app-config only now requires queryDefaults model and provider
  All files uploaded to lightspeed-stack will be converted to .txt

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.3.0

## 2.2.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.2.1

## 2.2.0

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.2.0

## 2.1.0

### Minor Changes

- cc98168: Migrated AI Notebooks from direct Llama Stack server to Lightspeed-Core integration

### Patch Changes

- 4379c1a: change casing of notebooks to lowercase
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.1.0

## 2.0.0

### Major Changes

- 7db4bed: Implement AI Notebooks session, document, and query service

### Minor Changes

- 024d5a8: Added MCP Server management backend APIs with per-user preferences, on-demand validation, and new permissions (lightspeed.mcp.read, lightspeed.mcp.manage)
- 0277bd0: Added the MCP servers selector/settings feature in Lightspeed with backend
  integration for listing servers, per-user token updates, and validation.

  In the settings panel, users can review server status, enable or disable
  eligible servers, configure personal tokens, and get inline token validation
  feedback. Token validation now runs automatically after typing stops and shows
  success (`Connection successful`) or error (`Authorization failed. Try again.`)
  before save.

- 01241c2: Backstage version bump to v1.49.2
  moved existing app to app-legacy
  app now runs the NFS model

### Patch Changes

- a98cbba: Encrypt MCP user tokens at rest using AES-256-GCM when backend.auth.keys is configured, fix Bearer prefix for direct MCP server validation
- c45aa19: Add stop button to interrupt a streaming conversation
- 7f44387: remove bearer from mcp header to adhere to LCORE standard
- Updated dependencies [024d5a8]
- Updated dependencies [7db4bed]
- Updated dependencies [01241c2]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@2.0.0

## 1.4.0

### Minor Changes

- 18aa761: **BREAKING** Replaces `fetch` function with built-in one and refactors source to fit the change. This change comes from [ADR014](https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr014-use-fetch.md) that now recommends the use of the global built-in `fetch` function since Node v20.

  The changes are contained for the `lightspeed-backend` plugin, the `node-fetch` direct dependency is removed from `package.json` and makes the following changes to the `router.ts` source:

  ```diff
  import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
  import { NotAllowedError } from '@backstage/errors';
  import { createPermissionIntegrationRouter } from '@backstage/plugin-permission-node';

  import express, { Router } from 'express';
  import { createProxyMiddleware } from 'http-proxy-middleware';
  -import fetch from 'node-fetch';

  import {
    lightspeedChatCreatePermission,
    lightspeedChatDeletePermission,
    lightspeedChatReadPermission,
    lightspeedPermissions,
  } from '@red-hat-developer-hub/backstage-plugin-lightspeed-common';

  +import { Readable } from 'node:stream';
  +
  import { userPermissionAuthorization } from './permission';
  import {
    DEFAULT_HISTORY_LENGTH,
    QueryRequestBody,
    RouterOptions,
  } from './types';
  import { validateCompletionsRequest } from './validation';
  ```

  Response piping has changed for the result of the built-in `fetch`:

  ```diff
  if (!fetchResponse.ok) {
    // Read the error body
    const errorBody = await fetchResponse.json();
    const errormsg = `Error from lightspeed-core server: ${errorBody.error?.message || errorBody?.detail?.cause || 'Unknown error'}`;
    logger.error(errormsg);

    // Return a 500 status for any upstream error
    response.status(500).json({
      error: errormsg,
    });
  +
  +  return
  }

  // Pipe the response back to the original response
  -fetchResponse.body.pipe(response);
  +if (fetchResponse.body) {
  +  const nodeStream = Readable.fromWeb(fetchResponse.body as any);
  +  nodeStream.pipe(response);
  +}
  ```

- 5ad82d7: Add support for multiple MCP servers with individual authentication headers

### Patch Changes

- 442ccf5: Updated dependency `msw` to `2.12.9`.
- b1417ce: Updated dependency `msw` to `2.12.8`.
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.4.0

## 1.3.0

### Minor Changes

- 0a7c742: Backstage version bump to v1.47.3

### Patch Changes

- Updated dependencies [0a7c742]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.3.0

## 1.2.3

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.2.3

## 1.2.2

### Patch Changes

- aaac497: Updated dependency `prettier` to `3.8.1`.
- Updated dependencies [aaac497]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.2.2

## 1.2.1

### Patch Changes

- 9c17c36: Updated dependency `prettier` to `3.8.0`.
- Updated dependencies [9c17c36]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.2.1

## 1.2.0

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.2.0

## 1.1.2

### Patch Changes

- ee71606: Updated dependency `msw` to `2.12.7`.
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.1.2

## 1.1.1

### Patch Changes

- b0c55d6: Updated dependency `msw` to `2.12.4`.
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.1.1

## 1.1.0

### Minor Changes

- 99f35d5: Backstage version bump to v1.45.2

### Patch Changes

- Updated dependencies [99f35d5]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.1.0

## 1.0.4

### Patch Changes

- 234cc73: Updated dependency `msw` to `2.12.2`.
- 40b80fe: Remove "lifecycle" keywords and "supported-versions" in package.json. Change "lifecycle" to active in catalog.yaml
- Updated dependencies [58e26ba]
- Updated dependencies [40b80fe]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.0.4

## 1.0.3

### Patch Changes

- e102a81: proxy PUT /v2/conversations/:conversation request
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.0.3

## 1.0.2

### Patch Changes

- c5fa204: Updated dependency `@types/express` to `4.17.25`.
  Updated dependency `msw` to `2.11.6`.
  Updated dependency `@patternfly/chatbot` to `6.4.1`.
  Updated dependency `@patternfly/react-core` to `6.4.0`.
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@1.0.2

## 1.0.1

### Patch Changes

- 4fcf3d4: update the question validation prompt

## 1.0.0

### Major Changes

- c6e4f39: migrate from road-core to lightspeed-core

### Patch Changes

- 2204143: Align lightspeed UI with LCS

## 0.6.0

### Minor Changes

- d922b04: Backstage version bump to v1.42.5

### Patch Changes

- 4786755: Updated dependency `msw` to `2.11.3`.
- 1bbd3c2: Updated dependency `@langchain/openai` to `^0.6.0`.
  Updated dependency `msw` to `2.11.1`.
- Updated dependencies [d922b04]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.4.0

## 0.5.7

### Patch Changes

- d703c31: introduce systemPrompt config for user to change and override default system prompt

## 0.5.6

### Patch Changes

- 0e00cb6: Upgrade backstage to 1.39.1
- Updated dependencies [0e00cb6]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.4

## 0.5.5

### Patch Changes

- 2ba3742: Add feedback API endpoints and controls in the UI to collect user feedback
- a79f849: Updated dependency `prettier` to `3.6.2`.
- Updated dependencies [a79f849]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.3

## 0.5.4

### Patch Changes

- 5d80736: Renamed permissions to align with the updated naming convention:
  - `lightspeed.conversations.read` → `lightspeed.chat.read`
  - `lightspeed.conversations.create` → `lightspeed.chat.create`
  - `lightspeed.conversations.delete` → `lightspeed.chat.delete`

- d51643f: Make Lightspeed service port configurable
- 7ca64e4: Updated dependency `msw` to `2.10.2`.
- Updated dependencies [5d80736]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.2

## 0.5.3

### Patch Changes

- 4db7d36: Updated dependency `msw` to `2.8.7`.
- 5f129c4: Updated dependency `@types/express` to `4.17.23`.

## 0.5.2

### Patch Changes

- 1704cd9: Updated dependency `msw` to `2.7.6`.
- a9e5f32: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.0`.
  Updated dependency `prettier` to `3.5.3`.
  Updated dependency `@redhat-developer/red-hat-developer-hub-theme` to `0.5.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.
  Updated dependency `@janus-idp/cli` to `3.5.0`.
- 174e08c: Updated dependency `node-fetch` to `2.7.0`.
- 571d93e: Updated dependency `@types/express` to `4.17.22`.
- Updated dependencies [a9e5f32]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.1

## 0.5.1

### Patch Changes

- d6bbaa9: Updated dependency `@langchain/openai` to `^0.5.0`.

## 0.5.0

### Minor Changes

- 0d6deb0: Updated @backstage/backend-test-utils to 1.3.0 and @backstage/repo-tools to 1.13.0

## 0.4.1

### Patch Changes

- 9fa7890: Updated dependency `msw` to `2.7.3`.

## 0.4.0

### Minor Changes

- 91a66a8: Backstage version bump to v1.35.1

### Patch Changes

- Updated dependencies [91a66a8]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.3.0

## 0.3.3

### Patch Changes

- 8001249: fix dynamic plugins packaging
- Updated dependencies [8001249]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.2.1

## 0.3.2

### Patch Changes

- dc61798: Updated dependency `@langchain/core` to `^0.3.0`.

## 0.3.1

### Patch Changes

- e0ef375: Updated dependency `@langchain/openai` to `^0.3.0`.

## 0.3.0

### Minor Changes

- e41a860: Backstage version bump to v1.34.2

### Patch Changes

- Updated dependencies [e41a860]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.2.0

## 0.2.2

### Patch Changes

- 5e4bdd2: Updated dependency `msw` to `2.7.0`.
- d59e940: Updated dependency `prettier` to `3.4.2`.
- 414250a: Updated dependency `msw` to `2.6.8`.
- Updated dependencies [d59e940]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.1.3

## 0.2.1

### Patch Changes

- Updated dependencies [5f6faba]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.1.2

## 0.2.0

### Minor Changes

- c113d1a: - add RBAC permission support
  - list all conversations for logged in users and generate conversation summary. [#2465](https://github.com/janus-idp/backstage-plugins/pull/2465)
  - add conversation create API endpoint. [#2403](https://github.com/janus-idp/backstage-plugins/pull/2403)
  - add streaming support in chat completion API. [#2238](https://github.com/janus-idp/backstage-plugins/pull/2238)
  - add conversation GET and DELETE API endpoints. [#2211](https://github.com/janus-idp/backstage-plugins/pull/2211)
  - Lightspeed backend plugin [#2115](https://github.com/janus-idp/backstage-plugins/pull/2115)

### Patch Changes

- Updated dependencies [c113d1a]
  - @red-hat-developer-hub/backstage-plugin-lightspeed-common@0.1.1

## 0.1.1

### Patch Changes

- 9fccf3f: Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).
