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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import express from 'express';
import Router from 'express-promise-router';
import type { SkillImageExtraction } from './services/types';

export type SkillImageProcessingStatus = 'loading' | 'ready' | 'failed';

export async function createRouter(
  logger: LoggerService,
  extractions: Map<string, SkillImageExtraction>,
  getProcessingStatus: () => SkillImageProcessingStatus = () => 'ready',
  getFailedImages: () => string[] = () => [],
  snapshots?: ReadonlyMap<string, SkillSnapshot>,
): Promise<express.Router> {
  const router = Router();
  router.use(express.json());

  router.get('/health', async (_req, res) => {
    logger.debug('Health check');
    res.status(200).json({ status: 'ok' });
  });

  // Authorization note: this endpoint is accessible to all authenticated
  // Backstage service-to-service callers.  The content served is skill
  // metadata (skill names, descriptions, markdown documentation) — not
  // registry credentials or secrets.  Backstage's default service auth
  // policy applies; /health is the only unauthenticated path.  If
  // fine-grained authorization is required in the future (e.g. per-skill
  // visibility), add a Backstage permission policy check here.
  router.get('/images', async (_req, res) => {
    const results = Array.from(extractions.entries()).map(
      ([imageRef, extraction]) => ({
        imageRef,
        skillImageYaml: extraction.skillImageYaml,
        skillsMd: extraction.skillsMd,
      }),
    );
    res.status(200).json({
      status: getProcessingStatus(),
      failedImages: getFailedImages(),
      images: results,
    });
  });

  // Authenticated GET /skills/:sourceId — serves the shared v1
  // SkillSnapshot for the requested source. The URL-encoded sourceId
  // is treated as one path segment per the design D2 REST contract.
  // Unknown source IDs return 404.
  router.get('/skills/:sourceId', async (req, res) => {
    const sourceId = req.params.sourceId;
    const snapshot = snapshots?.get(sourceId);
    if (!snapshot) {
      res.status(404).json({ error: `Unknown source: ${sourceId}` });
      return;
    }
    res.status(200).json(snapshot);
  });

  router.use(
    (
      error: Error,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      logger.error('Skill image connector request failed', error);
      if (res.headersSent) {
        next(error);
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    },
  );

  return router;
}
