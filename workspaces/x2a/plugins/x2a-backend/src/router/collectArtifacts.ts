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

import express from 'express';
import { z } from 'zod';
import { InputError, NotFoundError } from '@backstage/errors';
import {
  MigrationPhase,
  Artifact,
  JobStatusEnum,
  Telemetry,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import type { RouterDeps } from './types';

const agentMetricsSchema = z.object({
  name: z.string(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  durationSeconds: z.number(),
  metrics: z.record(z.any()).optional(),
  toolCalls: z.record(z.number()).optional(),
});

const telemetrySchema = z.object({
  summary: z.string(),
  phase: z.string(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  agents: z.record(agentMetricsSchema).optional(),
});

const artifactSchema = z.object({
  id: z.string(),
  type: z.enum(['migration_plan', 'module_migration_plan', 'migrated_sources']),
  value: z.string(),
});

const collectArtifactsRequestSchema = z.object({
  status: z.enum(['success', 'error']),
  errorDetails: z.string().optional(),
  jobId: z.string().uuid('Job ID must be a valid UUID'),
  artifacts: z.array(artifactSchema),
  telemetry: telemetrySchema.optional(),
});

export interface CollectArtifactsRequestBody {
  status: 'success' | 'error';
  errorDetails?: string;
  jobId: string;
  artifacts: Artifact[];
  telemetry?: Telemetry;
}

export function registerCollectArtifactsRoutes(
  router: express.Router,
  deps: RouterDeps,
): void {
  const { x2aDatabase, kubeService, logger } = deps;

  router.post(
    '/projects/:projectId/collectArtifacts',
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      try {
        const { projectId } = req.params;
        const moduleId = req.query.moduleId as string | undefined;
        const phase = req.query.phase as MigrationPhase;
        // TODO: Implement request signature validation for security
        // The x2aconvertor should sign the request body with the callbackToken:
        //   signature = HMAC-SHA256(callbackToken, JSON.stringify(requestBody))
        // Include signature in X-Callback-Signature header
        // Validate: crypto.timingSafeEqual(expectedSig, providedSig)
        // This prevents unauthorized job updates and request tampering
        logger.info(
          `Processing collectArtifacts for projectId=${projectId}, moduleId=${moduleId}, phase=${phase}`,
        );

        if (phase === 'init' && moduleId) {
          throw new InputError('moduleId must not be provided for init phase');
        }

        if (phase !== 'init' && !moduleId) {
          throw new InputError(`moduleId is required for ${phase} phase`);
        }

        const validatedRequest = validateRequest(req.body);

        const job = await x2aDatabase.getJob({ id: validatedRequest.jobId });
        if (!job) {
          throw new NotFoundError(
            `Job with ID ${validatedRequest.jobId} not found`,
          );
        }

        if (job.projectId !== projectId) {
          throw new NotFoundError(
            `Job ${validatedRequest.jobId} does not belong to project ${projectId}`,
          );
        }

        if (job.phase !== phase) {
          throw new InputError(
            `Job phase mismatch: expected ${phase}, got ${job.phase}`,
          );
        }

        if (phase !== 'init' && job.moduleId !== moduleId) {
          throw new InputError(
            `Job moduleId mismatch: expected ${moduleId}, got ${job.moduleId}`,
          );
        }

        const status: JobStatusEnum =
          validatedRequest.status === 'success' ? 'success' : 'error';
        const logs = await fetchJobLogs(kubeService, logger, job.k8sJobName);

        await x2aDatabase.updateJob({
          id: validatedRequest.jobId,
          status,
          finishedAt: new Date(),
          errorDetails: validatedRequest.errorDetails || null,
          log: logs,
          artifacts: validatedRequest.artifacts,
          telemetry: validatedRequest.telemetry || null,
        });

        logger.info(
          `Successfully processed collectArtifacts for job ${validatedRequest.jobId}`,
        );
        res.json({ message: 'Artifacts collected successfully' });
      } catch (err) {
        next(err);
      }
    },
  );
}

function validateRequest(requestBody: unknown): CollectArtifactsRequestBody {
  let validatedBody: CollectArtifactsRequestBody;
  try {
    validatedBody = collectArtifactsRequestSchema.parse(
      requestBody,
    ) as CollectArtifactsRequestBody;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors
        .map(e => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      throw new InputError(`Invalid request body: ${messages}`);
    }
    throw error;
  }

  if (validatedBody.status === 'error' && !validatedBody.errorDetails) {
    throw new InputError('errorDetails field is required when status is Error');
  }

  return validatedBody;
}

async function fetchJobLogs(
  kubeService: RouterDeps['kubeService'],
  logger: RouterDeps['logger'],
  k8sJobName: string | null | undefined,
): Promise<string | null> {
  if (!k8sJobName) {
    logger.info('k8sJobName is null, skipping log retrieval');
    return null;
  }

  try {
    logger.info(`Fetching logs for k8s job: ${k8sJobName}`);
    const logs = await kubeService.getJobLogs(k8sJobName, false);
    return typeof logs === 'string' ? logs : null;
  } catch (error) {
    logger.error(
      `Failed to fetch k8s logs for job ${k8sJobName}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return null;
  }
}
