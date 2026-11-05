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

import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import type express from 'express';
import Router from 'express-promise-router';

export function createRouter(
  snapshots: ReadonlyMap<string, SkillSnapshot>,
): express.Router {
  const router = Router();

  router.get('/skills/:sourceId', (req, res) => {
    const sourceId = req.params.sourceId;
    const snapshot = snapshots.get(sourceId);
    if (!snapshot) {
      res.status(404).json({ error: `Unknown source: ${sourceId}` });
      return;
    }
    res.json(snapshot);
  });

  return router;
}
