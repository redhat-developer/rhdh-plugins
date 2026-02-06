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

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { LoggerService } from '@backstage/backend-plugin-api';
import { InputError, NotFoundError } from '@backstage/errors';
import {
  MigrationPhase,
  Artifact,
  Job,
  PhaseArtifact,
  JobStatusEnum,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

/**
 * Minimal interface for database service methods used by this handler
 */
interface DatabaseService {
  getJob(params: { id: string }): Promise<Job | undefined>;
  updateJob(params: {
    id: string;
    status?: JobStatusEnum;
    finishedAt?: Date | null;
    errorDetails?: string | null;
    log?: string | null;
    artifacts?: Artifact[];
  }): Promise<Job | undefined>;
}

/**
 * Minimal interface for Kubernetes service methods used by this handler
 */
interface KubernetesService {
  getJobLogs(
    k8sJobName: string,
    streaming: boolean,
  ): Promise<string | NodeJS.ReadableStream>;
}

/**
 * Request body for collectArtifacts callback
 * Note: Uses generated PhaseArtifact type, but defines request structure locally
 * since the OpenAPI endpoint hasn't been added to the spec yet.
 */
export interface CollectArtifactsRequestBody {
  status: 'Success' | 'Error';
  error?: string;
  jobId: string;
  artifacts: PhaseArtifact;
}

/**
 * Response type for collectArtifacts endpoint
 */
export interface CollectArtifactsResponse {
  message: string;
}

/**
 * Zod schema for validating agent metrics
 */
const agentMetricsSchema = z.object({
  name: z.string(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  durationSeconds: z.number(),
  metrics: z.record(z.any()).optional(),
  toolCalls: z.record(z.number()).optional(),
});

/**
 * Zod schema for validating telemetry data
 */
const telemetrySchema = z.object({
  summary: z.string(),
  phase: z.string(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
  agents: z.record(agentMetricsSchema).optional(),
});

/**
 * Zod schema for validating phase artifacts
 */
const phaseArtifactSchema = z.object({
  telemetry: telemetrySchema.optional(),
  externalLinks: z.record(z.string()).optional(),
});

/**
 * Zod schema for validating the request body
 */
const collectArtifactsRequestSchema = z.object({
  status: z.enum(['Success', 'Error']),
  error: z.string().optional(),
  jobId: z.string().uuid('Job ID must be a valid UUID'),
  artifacts: phaseArtifactSchema,
});

/**
 * Handler for collecting artifacts from Kubernetes job callbacks
 */
export class CollectArtifactsHandler {
  private readonly logger: LoggerService;
  private readonly x2aDatabase: DatabaseService;
  private readonly kubeService: KubernetesService;

  constructor(options: {
    logger: LoggerService;
    x2aDatabase: DatabaseService;
    kubeService: KubernetesService;
  }) {
    this.logger = options.logger;
    this.x2aDatabase = options.x2aDatabase;
    this.kubeService = options.kubeService;
  }

  /**
   * Main handler for collectArtifacts endpoint
   */
  async handleCollectArtifacts(
    projectId: string,
    moduleId: string | undefined,
    phase: MigrationPhase,
    requestBody: unknown,
  ): Promise<CollectArtifactsResponse> {
    this.logger.info(
      `Processing collectArtifacts for projectId=${projectId}, moduleId=${moduleId}, phase=${phase}`,
    );

    try {
      // Validate request body and phase-module relationship
      const validatedRequest = this.validateRequest(requestBody, {
        moduleId,
        phase,
      });

      // Verify job exists and belongs to the project
      const job = await this.x2aDatabase.getJob({ id: validatedRequest.jobId });
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

      // Verify job phase matches request phase
      if (job.phase !== phase) {
        throw new InputError(
          `Job phase mismatch: expected ${phase}, got ${job.phase}`,
        );
      }

      // Verify job moduleId matches request moduleId (for non-init phases)
      if (phase !== 'init' && job.moduleId !== moduleId) {
        throw new InputError(
          `Job moduleId mismatch: expected ${moduleId}, got ${job.moduleId}`,
        );
      }

      // Update job with artifacts and status
      await this.updateJobWithArtifacts(
        validatedRequest.jobId,
        validatedRequest.status === 'Success' ? 'success' : 'error',
        validatedRequest.error,
        validatedRequest.artifacts,
        job.k8sJobName,
      );

      this.logger.info(
        `Successfully processed collectArtifacts for job ${validatedRequest.jobId}`,
      );

      return { message: 'Artifacts collected successfully' };
    } catch (error) {
      // Re-throw validation errors (InputError, NotFoundError)
      // These should result in 4xx responses
      if (error instanceof InputError || error instanceof NotFoundError) {
        throw error;
      }

      // Log unexpected errors
      this.logger.error(
        `Unexpected error in collectArtifacts: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }

    // @TODO here we need to see what we're going to do with different phases like:
    // init: update the modules available from the current status.
    // ModulePhase: update the health and project status?
    // Not sure if we should send a event here and the thing should be triggered.
  }

  /**
   * Validates the request body and query parameters
   */
  private validateRequest(
    requestBody: unknown,
    queryParams: { moduleId?: string; phase: MigrationPhase },
  ): CollectArtifactsRequestBody {
    // Validate phase-moduleId rules
    if (queryParams.phase === 'init' && queryParams.moduleId !== undefined) {
      throw new InputError(
        'moduleId must not be provided for init phase requests',
      );
    }

    if (queryParams.phase !== 'init' && queryParams.moduleId === undefined) {
      throw new InputError(
        `moduleId is required for ${queryParams.phase} phase requests`,
      );
    }

    // Validate request body with Zod
    // Note: Zod validates string dates (from JSON), but PhaseArtifact expects Date objects.
    // Using 'as any' since structure is correct and dates remain as strings (which works for our use case).
    let validatedBody: CollectArtifactsRequestBody;
    try {
      validatedBody = collectArtifactsRequestSchema.parse(requestBody) as any;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.errors
          .map(e => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        throw new InputError(`Invalid request body: ${messages}`);
      }
      throw error;
    }

    // Validate error field is present when status is Error
    if (validatedBody.status === 'Error' && !validatedBody.error) {
      throw new InputError('error field is required when status is Error');
    }

    return validatedBody;
  }

  /**
   * Updates the job with artifacts, logs, and status
   * Note: Fetching k8s logs is non-critical (graceful failure)
   * but database update is critical (will throw on error)
   */
  private async updateJobWithArtifacts(
    jobId: string,
    status: JobStatusEnum,
    errorMessage: string | undefined,
    artifacts: PhaseArtifact,
    k8sJobName: string | null | undefined,
  ): Promise<void> {
    // Fetch k8s logs (graceful failure - returns null on error)
    const logs = await this.fetchAndStoreJobLogs(k8sJobName);

    // Serialize artifacts to database format
    const serializedArtifacts = this.serializeArtifacts(artifacts);

    // Update job in database (critical - will throw on error)
    await this.x2aDatabase.updateJob({
      id: jobId,
      status,
      finishedAt: new Date(),
      errorDetails: errorMessage || null,
      log: logs,
      artifacts: serializedArtifacts,
    });

    this.logger.info(`Job ${jobId} updated successfully with status ${status}`);
  }

  /**
   * Fetches job logs from Kubernetes
   * Returns null on error or if k8sJobName is null
   */
  private async fetchAndStoreJobLogs(
    k8sJobName: string | null | undefined,
  ): Promise<string | null> {
    // Return null if k8sJobName is not available
    if (!k8sJobName) {
      this.logger.info('k8sJobName is null, skipping log retrieval');
      return null;
    }

    try {
      this.logger.info(`Fetching logs for k8s job: ${k8sJobName}`);
      const logs = await this.kubeService.getJobLogs(k8sJobName, false);
      // getJobLogs returns string when streaming=false
      return typeof logs === 'string' ? logs : null;
    } catch (error) {
      // Graceful failure - log error but don't throw
      this.logger.error(
        `Failed to fetch k8s logs for job ${k8sJobName}: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Serializes PhaseArtifact to Artifact[] for database storage
   */
  private serializeArtifacts(artifacts: PhaseArtifact): Artifact[] {
    const result: Artifact[] = [];

    // Serialize telemetry
    if (artifacts.telemetry) {
      result.push({
        id: randomUUID(),
        type: 'telemetry',
        value: JSON.stringify(artifacts.telemetry),
      });
    }

    // Serialize external links
    if (artifacts.externalLinks) {
      for (const [name, url] of Object.entries(artifacts.externalLinks)) {
        result.push({
          id: randomUUID(),
          type: 'externalLink',
          value: JSON.stringify({ name, url }),
        });
      }
    }

    return result;
  }
}

// TODO: Implement request signature validation for security
// The x2aconvertor should sign the request body with the callbackToken:
//   signature = HMAC-SHA256(callbackToken, JSON.stringify(requestBody))
// Include signature in X-Callback-Signature header
// Validate: crypto.timingSafeEqual(expectedSig, providedSig)
// This prevents unauthorized job updates and request tampering
