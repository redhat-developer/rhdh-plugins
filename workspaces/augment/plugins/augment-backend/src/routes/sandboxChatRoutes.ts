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

import { InputError } from '@backstage/errors';
import { handleSseStream } from './sseRouteHelpers';
import type { SandboxRouteCtx } from './sandboxRouteContext';

export function registerSandboxChatRoutes(ctx: SandboxRouteCtx): void {
  const { router, sandbox, logger, kagentiCfg, withRoute } = ctx;

  router.post(
    '/kagenti/sandbox/:namespace/chat',
    withRoute(
      'POST /kagenti/sandbox chat',
      'Failed to send sandbox chat',
      async (req, res) => {
        if (!req.body?.message || typeof req.body.message !== 'string') {
          throw new InputError('message is required and must be a string');
        }
        const result = await sandbox.sandboxChat(
          req.params.namespace,
          req.body.message,
          {
            sessionId: req.body.session_id,
            agentName: req.body.agent_name,
            skill: req.body.skill ?? kagentiCfg.sandbox.defaultSkill,
          },
        );
        res.json(result);
      },
    ),
  );

  router.post('/kagenti/sandbox/:namespace/chat/stream', (req, res) => {
    if (!req.body?.message || typeof req.body.message !== 'string') {
      res
        .status(400)
        .json({ error: 'message is required and must be a string' });
      return;
    }
    logger.debug('POST /kagenti/sandbox chat/stream');
    handleSseStream(res, logger, kagentiCfg, (onLine, signal) =>
      sandbox.sandboxChatStream(
        req.params.namespace,
        req.body.message,
        {
          sessionId: req.body.session_id,
          agentName: req.body.agent_name,
          skill: req.body.skill ?? kagentiCfg.sandbox.defaultSkill,
        },
        onLine,
        signal,
      ),
    );
  });

  router.get(
    '/kagenti/sandbox/:namespace/sessions/:sessionId/subscribe',
    (req, res) => {
      logger.debug(
        `GET /kagenti/sandbox subscribe session ${req.params.sessionId}`,
      );
      handleSseStream(res, logger, kagentiCfg, (onLine, signal) =>
        sandbox.subscribeSession(
          req.params.namespace,
          req.params.sessionId,
          onLine,
          signal,
        ),
      );
    },
  );
}
