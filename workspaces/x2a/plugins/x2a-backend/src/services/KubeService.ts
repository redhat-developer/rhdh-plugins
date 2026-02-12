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

import {
  coreServices,
  createServiceFactory,
  createServiceRef,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { Expand } from '@backstage/types';
import type {
  CoreV1Api,
  BatchV1Api,
  V1Pod,
  V1PodList,
  V1Secret,
  V1Job,
} from '@kubernetes/client-node';
import { makeK8sClient } from './makeK8sClient';
import { JobResourceBuilder } from './JobResourceBuilder';
import { X2AConfig } from '../../config';
import { JobCreateParams, AAPCredentials, GitRepo } from './types';
import {
  DEFAULT_LLM_MODEL,
  DEFAULT_KUBERNETES_NAMESPACE,
  DEFAULT_KUBERNETES_IMAGE,
  DEFAULT_KUBERNETES_IMAGE_TAG,
  DEFAULT_TTL_SECONDS_AFTER_FINISHED,
  DEFAULT_CPU_REQUEST,
  DEFAULT_MEMORY_REQUEST,
  DEFAULT_CPU_LIMIT,
  DEFAULT_MEMORY_LIMIT,
  DEFAULT_GIT_AUTHOR_NAME,
  DEFAULT_GIT_AUTHOR_EMAIL,
} from './constants';

/**
 * Job status information from Kubernetes
 */
export interface JobStatusInfo {
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
}

export class KubeService {
  readonly #logger: LoggerService;
  readonly #coreV1Api: CoreV1Api;
  readonly #batchV1Api: BatchV1Api;
  readonly #config: X2AConfig;
  readonly #namespace: string;

  static async create(options: { logger: LoggerService; config: X2AConfig }) {
    const service = new KubeService(options.logger, options.config);
    await service.initialize();
    return service;
  }

  private constructor(logger: LoggerService, config: X2AConfig) {
    this.#logger = logger;
    this.#config = config;
    this.#namespace = config.kubernetes.namespace;
    this.#coreV1Api = null as any; // Initialized in initialize()
    this.#batchV1Api = null as any; // Initialized in initialize()
  }

  private async initialize() {
    const { coreV1Api, batchV1Api } = await makeK8sClient(this.#logger);
    (this.#coreV1Api as any) = coreV1Api;
    (this.#batchV1Api as any) = batchV1Api;
  }

  /**
   * Creates or updates a project secret with long-lived credentials (LLM + AAP)
   * This secret persists across multiple jobs for the same project
   */
  async createProjectSecret(
    projectId: string,
    aapCredentials?: AAPCredentials,
  ): Promise<void> {
    this.#logger.info(`Creating project secret for project: ${projectId}`);

    const secret = JobResourceBuilder.buildProjectSecret(
      projectId,
      aapCredentials,
      this.#config,
    );

    try {
      await this.#coreV1Api.createNamespacedSecret({
        namespace: this.#namespace,
        body: secret,
      });
      this.#logger.info(`Created secret: ${secret.metadata?.name}`);
    } catch (error: any) {
      if (error.statusCode === 409 || error.code === 409) {
        this.#logger.warn(
          `Secret ${secret.metadata?.name} already exists, skipping creation`,
        );
      } else {
        this.#logger.error(`Failed to create secret: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Retrieves a project secret if it exists
   */
  async getProjectSecret(projectId: string): Promise<V1Secret | null> {
    const secretName = `x2a-project-secret-${projectId}`;
    this.#logger.info(`Getting project secret: ${secretName}`);

    try {
      const response = await this.#coreV1Api.readNamespacedSecret({
        name: secretName,
        namespace: this.#namespace,
      });
      return response;
    } catch (error: any) {
      if (error.statusCode === 404 || error.code === 404) {
        this.#logger.info(`Secret ${secretName} not found`);
        return null;
      }
      this.#logger.error(`Failed to get secret: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a project secret
   */
  async deleteProjectSecret(projectId: string): Promise<void> {
    const secretName = `x2a-project-secret-${projectId}`;
    this.#logger.info(`Deleting project secret: ${secretName}`);

    try {
      await this.#coreV1Api.deleteNamespacedSecret({
        name: secretName,
        namespace: this.#namespace,
      });
      this.#logger.info(`Deleted secret: ${secretName}`);
    } catch (error: any) {
      if (error.statusCode === 404 || error.code === 404) {
        this.#logger.warn(`Secret ${secretName} not found, nothing to delete`);
      } else {
        this.#logger.error(`Failed to delete secret: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Creates an ephemeral job secret with Git credentials
   * This secret will be auto-deleted when the job is deleted (via ownerReferences)
   */
  async createJobSecret(
    jobId: string,
    projectId: string,
    phase: string,
    gitCredentials: {
      sourceRepo: GitRepo;
      targetRepo: GitRepo;
    },
  ): Promise<void> {
    this.#logger.info(`Creating job secret for job: ${jobId}`);

    const secret = JobResourceBuilder.buildJobSecret(
      jobId,
      projectId,
      phase,
      gitCredentials,
    );

    try {
      await this.#coreV1Api.createNamespacedSecret({
        namespace: this.#namespace,
        body: secret,
      });
      this.#logger.info(`Created job secret: ${secret.metadata?.name}`);
    } catch (error: any) {
      this.#logger.error(`Failed to create job secret: ${error.message}`);
      throw error;
    }
  }

  /**
   * Creates a Kubernetes job for running an X2A migration phase
   * This method orchestrates the creation of both secrets and the job:
   * 1. Creates/updates project secret (LLM + AAP credentials)
   * 2. Creates ephemeral job secret (Git credentials)
   * 3. Creates the K8s job
   */
  async createJob(params: JobCreateParams): Promise<{ k8sJobName: string }> {
    this.#logger.info(
      `Creating job for project ${params.projectId}, phase: ${params.phase}`,
    );

    // Step 1: Create/update project secret (LLM + AAP)
    await this.createProjectSecret(params.projectId, params.aapCredentials);

    // Step 2: Create ephemeral job secret (Git credentials)
    await this.createJobSecret(params.jobId, params.projectId, params.phase, {
      sourceRepo: params.sourceRepo,
      targetRepo: params.targetRepo,
    });

    // Step 3: Create the Kubernetes job
    const job = JobResourceBuilder.buildJobSpec(params, this.#config);
    const k8sJobName = job.metadata?.name || '';

    try {
      const createdJob = await this.#batchV1Api.createNamespacedJob({
        namespace: this.#namespace,
        body: job,
      });
      this.#logger.info(`Created job: ${k8sJobName}`);

      // Set ownerReference on the job secret so it is garbage-collected when the Job is deleted
      const jobUid = createdJob.metadata?.uid;
      if (jobUid) {
        await this.setJobSecretOwnerReference(
          params.jobId,
          params.phase,
          k8sJobName,
          jobUid,
        );
      }

      return { k8sJobName };
    } catch (error: any) {
      this.#logger.error(`Failed to create job: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sets ownerReference on the job secret so it is garbage-collected when the Job is deleted.
   * This is non-fatal — if it fails, the job still works but the secret won't be auto-cleaned.
   */
  private async setJobSecretOwnerReference(
    jobId: string,
    phase: string,
    k8sJobName: string,
    jobUid: string,
  ): Promise<void> {
    const jobSecretName = `x2a-job-secret-${phase}-${jobId}`;

    try {
      const secret = await this.#coreV1Api.readNamespacedSecret({
        name: jobSecretName,
        namespace: this.#namespace,
      });

      secret.metadata = secret.metadata || {};
      secret.metadata.ownerReferences = [
        {
          apiVersion: 'batch/v1',
          kind: 'Job',
          name: k8sJobName,
          uid: jobUid,
          blockOwnerDeletion: true,
        },
      ];

      await this.#coreV1Api.replaceNamespacedSecret({
        name: jobSecretName,
        namespace: this.#namespace,
        body: secret,
      });

      this.#logger.info(
        `Set ownerReference on secret ${jobSecretName} -> job ${k8sJobName}`,
      );
    } catch (error: any) {
      this.#logger.warn(
        `Failed to set ownerReference on job secret ${jobSecretName}: ${error.message}. ` +
          `The job will still run but the secret may not be auto-cleaned.`,
      );
    }
  }

  /**
   * Gets the status of a Kubernetes job by checking its pods
   */
  async getJobStatus(k8sJobName: string): Promise<JobStatusInfo> {
    this.#logger.info(`Getting status for job: ${k8sJobName}`);

    try {
      // Get the job to check its status
      const job = await this.#batchV1Api.readNamespacedJob({
        name: k8sJobName,
        namespace: this.#namespace,
      });

      const jobStatus = job.status;

      // Check if job succeeded
      if (jobStatus?.succeeded && jobStatus.succeeded > 0) {
        return { status: 'success', message: 'Job completed successfully' };
      }

      // Check if job failed
      if (jobStatus?.failed && jobStatus.failed > 0) {
        return { status: 'error', message: 'Job failed' };
      }

      // Check if job is running (has active pods)
      if (jobStatus?.active && jobStatus.active > 0) {
        return { status: 'running', message: 'Job is running' };
      }

      // Job exists but hasn't started yet
      return { status: 'pending', message: 'Job is pending' };
    } catch (error: any) {
      if (error.statusCode === 404 || error.code === 404) {
        this.#logger.warn(`Job ${k8sJobName} not found`);
        return { status: 'error', message: 'Job not found' };
      }
      this.#logger.error(`Failed to get job status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets logs from a job's pod
   */
  async getJobLogs(
    k8sJobName: string,
    streaming = false,
  ): Promise<string | NodeJS.ReadableStream> {
    this.#logger.info(
      `Getting logs for job: ${k8sJobName}, streaming: ${streaming}`,
    );

    try {
      // Find the pod for this job
      const pods = await this.#coreV1Api.listNamespacedPod({
        namespace: this.#namespace,
        labelSelector: `job-name=${k8sJobName}`,
      });

      if (!pods.items || pods.items.length === 0) {
        this.#logger.warn(`No pods found for job: ${k8sJobName}`);
        return '';
      }

      const podName = pods.items[0].metadata?.name;
      if (!podName) {
        // This can happen if a pod is in the process of being created but hasn't been
        // fully initialized yet, or if the pod metadata is corrupted
        this.#logger.warn(`Pod has no name for job: ${k8sJobName}`);
        return '';
      }

      // Get logs from the pod
      const logs = await this.#coreV1Api.readNamespacedPodLog({
        name: podName,
        namespace: this.#namespace,
        follow: streaming,
      });

      return logs;
    } catch (error: any) {
      this.#logger.error(`Failed to get job logs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deletes a Kubernetes job
   */
  async deleteJob(k8sJobName: string): Promise<void> {
    this.#logger.info(`Deleting job: ${k8sJobName}`);

    try {
      await this.#batchV1Api.deleteNamespacedJob({
        name: k8sJobName,
        namespace: this.#namespace,
        propagationPolicy: 'Background', // Also delete associated pods
      });
      this.#logger.info(`Deleted job: ${k8sJobName}`);
    } catch (error: any) {
      if (error.statusCode === 404 || error.code === 404) {
        this.#logger.warn(`Job ${k8sJobName} not found, nothing to delete`);
      } else {
        this.#logger.error(`Failed to delete job: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Lists all jobs for a specific project
   */
  async listJobsForProject(projectId: string): Promise<V1Job[]> {
    this.#logger.info(`Listing jobs for project: ${projectId}`);

    try {
      const jobs = await this.#batchV1Api.listNamespacedJob({
        namespace: this.#namespace,
        labelSelector: `x2a.redhat.com/project-id=${projectId}`,
      });

      return jobs.items || [];
    } catch (error: any) {
      this.#logger.error(`Failed to list jobs: ${error.message}`);
      throw error;
    }
  }

  // Keep the original test method for backward compatibility
  async getPods(): Promise<{ items: V1Pod[] }> {
    this.#logger.info('getPods called');

    const res: V1PodList = await this.#coreV1Api.listNamespacedPod({
      namespace: this.#namespace,
    });

    return { items: res.items };
  }
}

export const kubeServiceRef = createServiceRef<Expand<KubeService>>({
  id: 'x2a-kubernetes',
  defaultFactory: async service =>
    createServiceFactory({
      service,
      deps: {
        logger: coreServices.logger,
        config: coreServices.rootConfig,
      },
      async factory(deps) {
        // Load X2A configuration from app-config.yaml with defaults
        const rawConfig = deps.config.getOptional<X2AConfig>('x2a');

        if (!rawConfig) {
          throw new Error(
            'X2A configuration is missing. Please add x2a section to app-config.yaml',
          );
        }

        // Apply defaults for all optional values
        const x2aConfig: X2AConfig = {
          kubernetes: {
            namespace:
              rawConfig?.kubernetes?.namespace ?? DEFAULT_KUBERNETES_NAMESPACE,
            image: rawConfig?.kubernetes?.image ?? DEFAULT_KUBERNETES_IMAGE,
            imageTag:
              rawConfig?.kubernetes?.imageTag ?? DEFAULT_KUBERNETES_IMAGE_TAG,
            ttlSecondsAfterFinished:
              rawConfig?.kubernetes?.ttlSecondsAfterFinished ??
              DEFAULT_TTL_SECONDS_AFTER_FINISHED,
            resources: {
              requests: {
                cpu:
                  rawConfig?.kubernetes?.resources?.requests?.cpu ??
                  DEFAULT_CPU_REQUEST,
                memory:
                  rawConfig?.kubernetes?.resources?.requests?.memory ??
                  DEFAULT_MEMORY_REQUEST,
              },
              limits: {
                cpu:
                  rawConfig?.kubernetes?.resources?.limits?.cpu ??
                  DEFAULT_CPU_LIMIT,
                memory:
                  rawConfig?.kubernetes?.resources?.limits?.memory ??
                  DEFAULT_MEMORY_LIMIT,
              },
            },
          },
          git: {
            author: {
              name: rawConfig?.git?.author?.name ?? DEFAULT_GIT_AUTHOR_NAME,
              email: rawConfig?.git?.author?.email ?? DEFAULT_GIT_AUTHOR_EMAIL,
            },
          },
          credentials: {
            llm: rawConfig?.credentials?.llm ?? {},
            aap: rawConfig?.credentials?.aap,
          },
        };

        // Ensure LLM_MODEL has a default value
        if (!x2aConfig.credentials.llm.LLM_MODEL) {
          x2aConfig.credentials.llm.LLM_MODEL = DEFAULT_LLM_MODEL;
        }

        // Boot-time validation: fail fast if critical configs are missing
        if (!x2aConfig.kubernetes.image) {
          throw new Error(
            'X2A configuration error: kubernetes.image is required',
          );
        }
        if (!x2aConfig.kubernetes.namespace) {
          throw new Error(
            'X2A configuration error: kubernetes.namespace is required',
          );
        }

        deps.logger.info(
          `X2A KubeService initialized with namespace: ${x2aConfig.kubernetes.namespace}, image: ${x2aConfig.kubernetes.image}:${x2aConfig.kubernetes.imageTag}`,
        );

        return KubeService.create({
          logger: deps.logger,
          config: x2aConfig,
        });
      },
    }),
});
