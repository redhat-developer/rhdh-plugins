---
'@red-hat-developer-hub/backstage-plugin-lightspeed-backend': minor
---

**BREAKING** Replaces `fetch` function with built-in one and refactors source to fit the change. This change comes from [ADR014](https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr014-use-fetch.md) that now recommends the use of the global built-in `fetch` function since Node v20.

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
