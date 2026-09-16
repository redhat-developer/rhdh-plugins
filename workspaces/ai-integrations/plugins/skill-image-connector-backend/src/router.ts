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
import express from 'express';
import Router from 'express-promise-router';
import type { SkillImageExtraction } from './services/types';

export type SkillImageProcessingStatus = 'loading' | 'ready' | 'failed';

export async function createRouter(
  logger: LoggerService,
  extractions: Map<string, SkillImageExtraction>,
  getProcessingStatus: () => SkillImageProcessingStatus = () => 'ready',
  getFailedImages: () => string[] = () => [],
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
