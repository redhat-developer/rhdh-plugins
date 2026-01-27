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
import {
  CoreV1Api,
  BatchV1Api,
  V1Pod,
  V1PodList,
  V1Secret,
  V1Job,
} from '@kubernetes/client-node';
import { makeK8sClient } from './makeK8sClient';
import { JobResourceBuilder } from './JobResourceBuilder';
import { X2AConfig, ProjectCredentials, JobCreateParams } from './types';

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

  static async create(options: { logger: LoggerService }) {
    const service = new KubeService(options.logger);
    await service.initialize();
    return service;
  }

  private constructor(logger: LoggerService, config: X2AConfig) {
    this.#logger = logger;
    this.#config = config;
    this.#namespace = config.kubernetes.namespace;

    const { coreV1Api, batchV1Api } = makeK8sClient(this.#logger);
    this.#coreV1Api = coreV1Api;
    this.#batchV1Api = batchV1Api;
  }

  /**
   * Creates a project secret with all necessary credentials
   */
  async createProjectSecret(
    projectId: string,
    credentials: ProjectCredentials,
  ): Promise<void> {
    this.#logger.info(`Creating project secret for project: ${projectId}`);

    const secret = JobResourceBuilder.buildProjectSecret(
      projectId,
      credentials,
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
   * Creates a Kubernetes job for running an X2A migration phase
   */
  async createJob(params: JobCreateParams): Promise<{ k8sJobName: string }> {
    this.#logger.info(
      `Creating job for project ${params.projectId}, phase: ${params.phase}`,
    );

    const job = JobResourceBuilder.buildJobSpec(params, this.#config);
    const k8sJobName = job.metadata?.name || '';

    try {
      await this.#batchV1Api.createNamespacedJob({
        namespace: this.#namespace,
        body: job,
      });
      this.#logger.info(`Created job: ${k8sJobName}`);
      return { k8sJobName };
    } catch (error: any) {
      this.#logger.error(`Failed to create job: ${error.message}`);
      throw error;
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
        // Load X2A configuration from app-config.yaml
        const x2aConfig = deps.config.get<X2AConfig>('x2a');

        return KubeService.create({
          logger: deps.logger,
          config: x2aConfig,
        });
      },
    }),
});
