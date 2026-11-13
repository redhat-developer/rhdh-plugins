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

import type {
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import type { SkillSnapshot } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import { isValidDigest } from '@red-hat-developer-hub/backstage-plugin-ai-skills-common';
import express from 'express';
import Router from 'express-promise-router';
import type { SkillImageExtraction } from './services/types';
import {
  MAX_RECONCILE_BODY_SIZE,
  MAX_RETAINED_DIGESTS,
} from './services/types';

export type SkillImageProcessingStatus = 'loading' | 'ready' | 'failed';

/** Per-source snapshot metadata for revision tracking. */
export interface SourceSnapshotMeta {
  /** Durable monotonic revision string, or undefined before first publication. */
  revision?: string;
  /** Status of the current snapshot. */
  status: SkillSnapshot['status'];
}

/** Reconciliation handler that owns the per-source lock. */
export type ReconcileHandler = (
  sourceId: string,
  revision: string,
  retainedDigests: string[],
) => Promise<{ status: 204 } | { status: 400 | 404 | 409; error: string }>;

export async function createRouter(
  logger: LoggerService,
  extractions: Map<string, SkillImageExtraction>,
  getProcessingStatus: () => SkillImageProcessingStatus = () => 'ready',
  getFailedImages: () => string[] = () => [],
  snapshots?: ReadonlyMap<string, SkillSnapshot>,
  getSkillDocContent?: (
    sourceId: string,
    digest: string,
  ) => Promise<string | undefined> | string | undefined,
  snapshotMetas?: ReadonlyMap<string, SourceSnapshotMeta>,
  reconcileHandler?: ReconcileHandler,
  httpAuth?: HttpAuthService,
  catalogProviderPluginId?: string,
): Promise<express.Router> {
  const router = Router();

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
  // D8: Adds X-Skilldocs-Revision header on completed snapshots.
  router.get('/skills/:sourceId', async (req, res) => {
    const sourceId = req.params.sourceId;
    const snapshot = snapshots?.get(sourceId);
    if (!snapshot) {
      res.status(404).json({ error: `Unknown source: ${sourceId}` });
      return;
    }

    // D8: Add durable revision header on completed (non-loading) snapshots
    const meta = snapshotMetas?.get(sourceId);
    if (meta?.revision) {
      res.setHeader('X-Skilldocs-Revision', meta.revision);
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
      res.status(404).json({ error: 'Not found' });
      return;
    }

    // Look up the Markdown content for this source and digest
    const content = await getSkillDocContent?.(sourceId, digest);
    if (content === undefined) {
      res.status(404).json({ error: 'Content not available' });
      return;
    }

    // ETag derived from the manifest digest (the digest is the content
    // identity per D8)
    const etag = `"${digest}"`;
    res.setHeader('ETag', etag);

    // Conditional request: If-None-Match (RFC 7232 §3.2).
    // Express's req.fresh uses the `fresh` module which handles
    // comma-separated entity-tag lists and the wildcard `*`.
    if (req.fresh) {
      res.status(304).end();
      return;
    }

    res.setHeader('Content-Type', 'text/markdown');
    res.status(200).send(content);
  });

  // D8: POST /skilldocs/:sourceId/reconcile — provider-authorized
  // reconciliation acknowledgment. Requires service authentication
  // from the configured catalogProviderPluginId. See D8 for the full
  // protocol specification.
  if (reconcileHandler && httpAuth) {
    router.post(
      '/skilldocs/:sourceId/reconcile',
      express.json({ limit: MAX_RECONCILE_BODY_SIZE }),
      async (req, res) => {
        const sourceId = req.params.sourceId;

        // Reject blank, '.', and '..' source IDs
        if (!sourceId || sourceId === '.' || sourceId === '..') {
          res.status(404).json({ error: 'Unknown source' });
          return;
        }

        // Authentication and authorization
        try {
          const credentials = await httpAuth.credentials(req, {
            allow: ['service'],
          });

          // Authorize: only the configured catalogProviderPluginId may call
          const principal = credentials.principal as {
            subject: string;
          };
          if (
            !catalogProviderPluginId ||
            principal.subject !== `plugin:${catalogProviderPluginId}`
          ) {
            res.status(403).json({
              error:
                'Unauthorized: caller is not the configured catalog provider',
            });
            return;
          }
        } catch {
          res.status(403).json({ error: 'Unauthorized' });
          return;
        }

        // Validate body structure
        const body = req.body;
        if (!body || typeof body !== 'object') {
          res.status(400).json({ error: 'Request body must be a JSON object' });
          return;
        }

        const { revision, retainedDigests } = body;

        // Validate revision
        if (typeof revision !== 'string' || !/^[0-9]+$/.test(revision)) {
          res.status(400).json({
            error: 'revision must be a decimal string',
          });
          return;
        }

        // Validate retainedDigests
        if (!Array.isArray(retainedDigests)) {
          res.status(400).json({
            error: 'retainedDigests must be an array',
          });
          return;
        }

        if (retainedDigests.length > MAX_RETAINED_DIGESTS) {
          res.status(400).json({
            error: `retainedDigests may contain at most ${MAX_RETAINED_DIGESTS} entries`,
          });
          return;
        }

        // Validate each digest is a canonical sha256 digest
        for (const d of retainedDigests) {
          if (typeof d !== 'string' || !isValidDigest(d)) {
            res.status(400).json({
              error: `Invalid digest in retainedDigests: ${String(d)}`,
            });
            return;
          }
        }

        // Check for duplicates in retainedDigests
        const uniqueDigests = new Set(retainedDigests);
        if (uniqueDigests.size !== retainedDigests.length) {
          res.status(400).json({
            error: 'retainedDigests contains duplicate entries',
          });
          return;
        }

        // Delegate to the handler
        const result = await reconcileHandler(
          sourceId,
          revision,
          retainedDigests,
        );

        if (result.status === 204) {
          res.status(204).end();
        } else {
          res.status(result.status).json({ error: result.error });
        }
      },
    );
  }

  router.use(
    (
      error: Error,
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      // Handle body-parser PayloadTooLargeError for reconcile endpoint
      if ('type' in error && (error as any).type === 'entity.too.large') {
        res.status(413).json({ error: 'Request body too large' });
        return;
      }
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
