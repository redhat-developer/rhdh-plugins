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
import { fetchSourceBuffer } from './services/fetchSource';
import { verifyDigest } from './services/processArtifacts';
import type { NpxSourceConfig } from './services/types';

export function createRouter(
  snapshots: ReadonlyMap<string, SkillSnapshot>,
  sources: readonly NpxSourceConfig[],
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

  router.get('/skilldocs/:sourceId/:digest', async (req, res) => {
    const { sourceId, digest } = req.params;
    const source = sources.find(config => config.id === sourceId);
    const record = snapshots
      .get(sourceId)
      ?.skills.find(skill => skill.digest === digest);
    if (!source || !record) {
      res.sendStatus(404);
      return;
    }

    // The ETag identifies bytes already verified during import. A reader
    // holding that build can reuse it without contacting the registry.
    const etag = `"${digest}"`;
    if (req.get('If-None-Match') === etag) {
      res.set('ETag', etag).status(304).end();
      return;
    }

    // The snapshot determines the destination. Reuse discovery's limits and
    // check the bytes again because the upstream artifact URL may be mutable.
    const markdown = await fetchSourceBuffer(
      record.sourceUri,
      source,
      'artifact',
    );
    if (!verifyDigest(markdown, digest)) {
      res
        .status(409)
        .send('Skill Markdown no longer matches the imported digest');
      return;
    }
    res.set('ETag', etag).type('text/markdown').send(markdown);
  });

  return router;
}
