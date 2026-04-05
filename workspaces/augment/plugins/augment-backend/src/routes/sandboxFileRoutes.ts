/*
 * Copyright Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { SandboxRouteCtx } from './sandboxRouteContext';

export function registerSandboxFileRoutes(ctx: SandboxRouteCtx): void {
  const { router, sandbox, withRoute } = ctx;

  router.get(
    '/kagenti/sandbox/:namespace/files/:agent',
    withRoute(
      'GET /kagenti/sandbox files',
      'Failed to browse files',
      async (req, res) => {
        const path = (req.query.path as string) || '/';
        const result = await sandbox.browseFiles(
          req.params.namespace,
          req.params.agent,
          path,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/files/:agent/list',
    withRoute(
      'GET /kagenti/sandbox file list',
      'Failed to list directory',
      async (req, res) => {
        const path = (req.query.path as string) || '/';
        const result = await sandbox.listDirectory(
          req.params.namespace,
          req.params.agent,
          path,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/files/:agent/content',
    withRoute(
      'GET /kagenti/sandbox file content',
      'Failed to get file content',
      async (req, res) => {
        const path = req.query.path as string;
        const result = await sandbox.getFileContent(
          req.params.namespace,
          req.params.agent,
          path,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/files/:agent/:contextId',
    withRoute(
      'GET /kagenti/sandbox context files',
      'Failed to browse context files',
      async (req, res) => {
        const path = (req.query.path as string) || '/';
        const result = await sandbox.browseContextFiles(
          req.params.namespace,
          req.params.agent,
          req.params.contextId,
          path,
        );
        res.json(result);
      },
    ),
  );

  router.get(
    '/kagenti/sandbox/:namespace/stats/:agent',
    withRoute(
      'GET /kagenti/sandbox storage stats',
      'Failed to get storage stats',
      async (req, res) => {
        const result = await sandbox.getStorageStats(
          req.params.namespace,
          req.params.agent,
        );
        res.json(result);
      },
    ),
  );
}
