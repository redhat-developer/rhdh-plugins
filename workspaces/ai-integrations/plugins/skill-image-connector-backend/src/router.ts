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
import { isValidDigest } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
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
  getSkillDocContent?: (sourceId: string, digest: string) => string | undefined,
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

  // Authenticated GET /skilldocs/:sourceId/:digest — serves extracted
  // skill Markdown addressed by source ID and verified manifest digest
  // (D8). Returns Content-Type: text/markdown with an ETag derived from
  // the digest, and supports If-None-Match conditional requests (304).
  // Unknown source IDs, unknown digests, and unavailable content return
  // 404. Blank, '.', and '..' source IDs are rejected.
  router.get('/skilldocs/:sourceId/:digest', async (req, res) => {
    const sourceId = req.params.sourceId;
    const digest = req.params.digest;

    // Reject blank, '.', and '..' source IDs (D8)
    if (!sourceId || sourceId === '.' || sourceId === '..') {
      res.status(404).json({ error: 'Invalid source ID' });
      return;
    }

    // Validate digest format: sha256:<64 lowercase hex digits>
    if (!isValidDigest(digest)) {
      res.status(404).json({ error: 'Invalid digest format' });
      return;
    }

    // Unknown source returns 404
    if (!snapshots?.has(sourceId)) {
      res.status(404).json({ error: `Unknown source: ${sourceId}` });
      return;
    }

    // Look up the Markdown content for this source and digest
    const content = getSkillDocContent?.(sourceId, digest);
    if (content === undefined) {
      res.status(404).json({ error: 'Content not available' });
      return;
    }

    // ETag derived from the manifest digest (the digest is the content
    // identity per D8)
    const etag = `"${digest}"`;

    // Conditional request: If-None-Match
    const ifNoneMatch = req.headers['if-none-match'];
    if (ifNoneMatch === etag || ifNoneMatch === `W/${etag}`) {
      res.status(304).end();
      return;
    }

    res.setHeader('ETag', etag);
    res.setHeader('Content-Type', 'text/markdown');
    res.status(200).send(content);
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
