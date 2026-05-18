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
import {
  InputError,
  NotFoundError,
  AuthenticationError,
} from '@backstage/errors';
import {
  MigrationPhase,
  Artifact,
  JobStatus,
  Telemetry,
  Phase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { CallbackToken } from '@red-hat-developer-hub/backstage-plugin-x2a-node';

import type { RouterDeps } from './types';
import { executePhaseActions } from './phaseActions';

const agentMetricsSchema = z.object({
  name: z.string(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  durationSeconds: z.number(),
  inputTokens: z.number().optional(),
  outputTokens: z.number().optional(),
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
  type: z.enum([
    'migration_plan',
    'module_migration_plan',
    'migrated_sources',
    'project_metadata',
    'ansible_project',
  ]),
  value: z.string(),
});

const collectArtifactsRequestSchema = z.object({
  status: z.enum(['success', 'error']),
  errorDetails: z.string().optional(),
  jobId: z.string().uuid('Job ID must be a valid UUID'),
  artifacts: z.array(artifactSchema).optional(),
  telemetry: telemetrySchema.optional(),
  commitId: z.string().optional(),
});

export interface CollectArtifactsRequestBody {
  status: 'success' | 'error';
  errorDetails?: string;
  jobId: string;
  artifacts?: Artifact[];
  telemetry?: Telemetry;
  commitId?: string;
}

interface JobWithToken {
  id: string;
  projectId: string;
  moduleId?: string;
  phase: MigrationPhase;
  callbackToken?: string;
  k8sJobName?: string | null;
  startedAt?: Date;
}

class AuthenticationHandler {
  constructor(private readonly logger: RouterDeps['logger']) {}

  validateSignature(
    rawBody: Buffer,
    providedSignature: string | undefined,
    callbackToken: CallbackToken,
    jobId: string,
  ): void {
    if (!providedSignature) {
      this.logAuthFailure(jobId, 'missing_signature', rawBody);
      throw new AuthenticationError('Authentication failed');
    }

    const isValid = callbackToken.validateSignature(rawBody, providedSignature);

    if (!isValid) {
      this.logAuthFailure(
        jobId,
        'invalid_signature',
        rawBody,
        providedSignature,
      );
      throw new AuthenticationError('Authentication failed');
    }

    this.logger.info(
      `Signature validated for job ${jobId} (bodyLen: ${rawBody.length})`,
    );
  }

  validateJobAge(job: JobWithToken, maxAgeSeconds: number): void {
    if (!job.startedAt) {
      throw new AuthenticationError('Authentication failed');
    }

    const jobStartTime = new Date(job.startedAt).getTime();
    const now = Date.now();
    const ageSeconds = (now - jobStartTime) / 1000;

    if (ageSeconds < 0 || ageSeconds > maxAgeSeconds) {
      this.logger.warn(
        `Job ${job.id} age validation failed: ${ageSeconds}s (max: ${maxAgeSeconds}s)`,
      );
      throw new AuthenticationError('Authentication failed');
    }
  }

  private logAuthFailure(
    jobId: string,
    reason: string,
    rawBody: Buffer,
    signature?: string,
  ): void {
    this.logger.warn(
      `Auth failed for job ${jobId}: ${reason} (sig: ${signature?.substring(0, 8) || 'none'}, bodyLen: ${rawBody.length})`,
    );
  }
}

class RequestValidator {
  constructor(private readonly logger: RouterDeps['logger']) {}

  validatePhaseParams(
    phase: MigrationPhase,
    moduleId: string | undefined,
  ): void {
    if (Phase.from(phase).isProjectPhase() && moduleId) {
      throw new InputError('moduleId must not be provided for init phase');
    }

    if (Phase.from(phase).isModulePhase() && !moduleId) {
      throw new InputError(`moduleId is required for ${phase} phase`);
    }
  }

  validateRequestBody(requestBody: unknown): CollectArtifactsRequestBody {
    try {
      const validated = collectArtifactsRequestSchema.parse(requestBody);
      return validated as CollectArtifactsRequestBody;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        const errorMsg = `Invalid request body: ${messages}`;
        this.logger.error(`collectArtifacts validation error: ${errorMsg}`);
        this.logger.debug(`Request body: ${JSON.stringify(requestBody)}`);
        throw new InputError(errorMsg);
      }
      throw error;
    }
  }

  validateJobContext(
    job: JobWithToken,
    projectId: string,
    phase: MigrationPhase,
    moduleId: string | undefined,
    jobId: string,
  ): void {
    if (job.projectId !== projectId) {
      throw new NotFoundError(
        `Job ${jobId} does not belong to project ${projectId}`,
      );
    }

    if (job.phase !== phase) {
      throw new InputError(
        `Job phase mismatch: expected ${phase}, got ${job.phase}`,
      );
    }

    if (Phase.from(phase).isModulePhase() && job.moduleId !== moduleId) {
      throw new InputError(
        `Job moduleId mismatch: expected ${moduleId}, got ${job.moduleId}`,
      );
    }
  }

  validateStatusRequirements(
    validatedRequest: CollectArtifactsRequestBody,
  ): void {
    if (validatedRequest.status === 'error' && !validatedRequest.errorDetails) {
      throw new InputError(
        'errorDetails field is required when status is Error',
      );
    }
  }
}

const DEFAULT_MAX_JOB_AGE_SECONDS = 10800;

export function registerCollectArtifactsRoutes(
  router: express.Router,
  deps: RouterDeps,
): void {
  const { x2aDatabase, kubeService, logger, config } = deps;
  const authHandler = new AuthenticationHandler(logger);
  const requestValidator = new RequestValidator(logger);
  const maxJobAgeSeconds =
    config.getOptionalNumber('x2a.collectArtifacts.maxJobAgeSeconds') ??
    DEFAULT_MAX_JOB_AGE_SECONDS;

  router.post(
    '/projects/:projectId/collectArtifacts',
    express.raw({ type: 'application/json', limit: '10mb' }),
    async (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      try {
        const { projectId } = req.params;
        const moduleId = req.query.moduleId as string | undefined;
        const phase = req.query.phase as MigrationPhase;
        const rawBody = req.body as Buffer;

        logger.info(
          `collectArtifacts: projectId=${projectId}, moduleId=${moduleId}, phase=${phase}`,
        );

        requestValidator.validatePhaseParams(phase, moduleId);

        const parsedBody = JSON.parse(rawBody.toString('utf-8'));
        logger.debug(
          `collectArtifacts parsed body: ${JSON.stringify(parsedBody)}`,
        );

        const validatedRequest =
          requestValidator.validateRequestBody(parsedBody);
        requestValidator.validateStatusRequirements(validatedRequest);

        const job = await x2aDatabase.getJob({ id: validatedRequest.jobId });
        if (!job) {
          throw new NotFoundError(
            `Job with ID ${validatedRequest.jobId} not found`,
          );
        }

        const jobWithToken = job as unknown as JobWithToken;
        if (!jobWithToken.callbackToken) {
          logger.error(`Job ${validatedRequest.jobId} missing callbackToken`);
          throw new AuthenticationError('Authentication failed');
        }

        const callbackToken = CallbackToken.from(jobWithToken.callbackToken);
        const providedSignature = req.headers['x-callback-signature'] as
          | string
          | undefined;

        authHandler.validateSignature(
          rawBody,
          providedSignature,
          callbackToken,
          validatedRequest.jobId,
        );

        authHandler.validateJobAge(jobWithToken, maxJobAgeSeconds);

        requestValidator.validateJobContext(
          jobWithToken,
          projectId,
          phase,
          moduleId,
          validatedRequest.jobId,
        );

        const result = await processJobCompletion(
          validatedRequest,
          phase,
          projectId,
          x2aDatabase,
          kubeService,
          logger,
          jobWithToken,
        );

        logger.info(`Job ${validatedRequest.jobId} processed successfully`);
        res.json(result);
      } catch (err) {
        next(err);
      }
    },
  );
}

async function processJobCompletion(
  validatedRequest: CollectArtifactsRequestBody,
  phase: MigrationPhase,
  projectId: string,
  x2aDatabase: RouterDeps['x2aDatabase'],
  kubeService: RouterDeps['kubeService'],
  logger: RouterDeps['logger'],
  job: JobWithToken,
): Promise<{ message: string }> {
  let jobStatus = JobStatus.from(
    validatedRequest.status === 'success' ? 'success' : 'error',
  );
  let errorDetails = validatedRequest.errorDetails || null;

  if (jobStatus.isSuccess()) {
    jobStatus = await executePhaseActionsWithErrorHandling(
      phase,
      projectId,
      validatedRequest,
      x2aDatabase,
      logger,
    );

    if (jobStatus.isError()) {
      errorDetails = 'Phase actions failed';
    }
  }

  const logs = await fetchJobLogs(kubeService, logger, job.k8sJobName);

  await x2aDatabase.updateJob({
    id: validatedRequest.jobId,
    status: jobStatus.value,
    finishedAt: new Date(),
    errorDetails,
    log: logs,
    artifacts: validatedRequest.artifacts || [],
    telemetry: validatedRequest.telemetry || null,
    commitId: validatedRequest.commitId,
  });

  return { message: 'Artifacts collected successfully' };
}

async function executePhaseActionsWithErrorHandling(
  phase: MigrationPhase,
  projectId: string,
  validatedRequest: CollectArtifactsRequestBody,
  x2aDatabase: RouterDeps['x2aDatabase'],
  logger: RouterDeps['logger'],
): Promise<JobStatus> {
  try {
    await executePhaseActions(phase, {
      projectId,
      artifacts: validatedRequest.artifacts ?? [],
      x2aDatabase,
      logger,
    });
    return JobStatus.SUCCESS;
  } catch (error) {
    logger.error(
      `Phase actions failed for job ${validatedRequest.jobId}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return JobStatus.ERROR;
  }
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
