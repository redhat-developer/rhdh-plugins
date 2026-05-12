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

import { z } from 'zod';
import express from 'express';
import { InputError, NotFoundError } from '@backstage/errors';

import {
  type ModulePhase,
  JobStatus,
  Phase,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import {
  CallbackToken,
  calculateModuleStatus,
  listModulesWithReconciledStatuses,
  reconcileModuleJobs,
} from '@red-hat-developer-hub/backstage-plugin-x2a-node';

import type { RouterDeps } from './types';
import {
  assertProjectHasDirName,
  reconcileJobStatus,
  useEnforceProjectPermissions,
} from './common';
import { GitRepositoryResolver } from './GitRepositoryResolver';

export function registerModuleRoutes(
  router: express.Router,
  deps: RouterDeps,
): void {
  const {
    httpAuth,
    discoveryApi,
    x2aDatabase,
    kubeService,
    logger,
    config,
    permissionsSvc,
    catalog,
  } = deps;
  const gitRepoResolver = new GitRepositoryResolver(config);

  router.get('/projects/:projectId/modules', async (req, res) => {
    const endpoint = 'GET /projects/:projectId/modules';
    const { projectId } = req.params;
    logger.info(`${endpoint} request received: projectId=${projectId}`);

    await useEnforceProjectPermissions({
      req,
      readOnly: true,
      projectId,
      x2aDatabase,
      httpAuth,
      permissionsSvc,
      catalog,
    });

    const modules = await x2aDatabase.listModules({ projectId });
    await listModulesWithReconciledStatuses(modules, {
      kubeService,
      x2aDatabase,
      logger,
    });

    res.json(modules);
  });

  router.get('/projects/:projectId/modules/:moduleId', async (req, res) => {
    const endpoint = 'GET /projects/:projectId/modules/:moduleId';
    const { projectId, moduleId } = req.params;
    logger.info(
      `${endpoint} request received: projectId=${projectId}, moduleId=${moduleId}`,
    );

    await useEnforceProjectPermissions({
      req,
      readOnly: true,
      projectId,
      x2aDatabase,
      httpAuth,
      permissionsSvc,
      catalog,
    });

    // Get module
    const module = await x2aDatabase.getModule({
      id: moduleId,
      skipEnrichment: false,
    });
    if (!module) {
      throw new NotFoundError(`Module "${moduleId}" not found.`);
    }
    if (module.projectId !== projectId) {
      throw new NotFoundError(
        `Module "${moduleId}" does not belong to project "${projectId}".`,
      );
    }

    // Reconcile any pending/running jobs against K8s
    await reconcileModuleJobs(module, { kubeService, x2aDatabase, logger });

    // Recalculate status after reconciliation may have updated phase jobs
    const { status, errorDetails } = calculateModuleStatus({
      analyze: module.analyze,
      migrate: module.migrate,
      publish: module.publish,
    });
    module.status = status;
    module.errorDetails = errorDetails;

    res.json(module);
  });

  // TODO: This is a TEMPORARY endpoint for testing only.
  // According to the ADR (lines 202-213), this endpoint should sync modules by:
  // 1. Fetching the migration project plan from the target repo
  // 2. Parsing it via LLM to extract the list of modules
  // 3. Generating moduleIds for new ones and deleting missing modules
  // This simple CRUD implementation allows testing the job infrastructure
  // until the init phase integration is complete.
  router.post(
    '/projects/:projectId/modules',
    async (req: express.Request, res: express.Response) => {
      const endpoint =
        'Temporary endpoint - for testing only. POST /projects/:projectId/modules';
      const { projectId } = req.params;
      logger.info(`${endpoint} request received: projectId=${projectId}`);

      await useEnforceProjectPermissions({
        req,
        readOnly: false,
        projectId,
        x2aDatabase,
        httpAuth,
        permissionsSvc,
        catalog,
      });

      // Validate request body
      const createModuleRequestSchema = z.object({
        name: z.string(),
        sourcePath: z.string(),
      });

      const parsedBody = createModuleRequestSchema
        .passthrough()
        .safeParse(req.body);
      if (!parsedBody.success) {
        throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
      }
      const { name, sourcePath } = parsedBody.data;

      // Create module
      const module = await x2aDatabase.createModule({
        name,
        sourcePath,
        projectId,
      });

      logger.info(`Module created: moduleId=${module.id}, name=${module.name}`);

      res.status(201).json(module);
    },
  );

  router.post(
    '/projects/:projectId/modules/:moduleId/run',
    async (req: express.Request, res: express.Response) => {
      const endpoint = 'POST /projects/:projectId/modules/:moduleId/run';
      const { projectId, moduleId } = req.params;
      logger.info(
        `${endpoint} request received: projectId=${projectId}, moduleId=${moduleId}`,
      );

      // Validate request body
      const runModuleRequestSchema = z.object({
        phase: z.enum(
          Phase.modulePhaseValues() as [ModulePhase, ...ModulePhase[]],
        ),
        sourceRepoAuth: z
          .object({
            token: z.string(),
          })
          .optional(),
        targetRepoAuth: z
          .object({
            token: z.string(),
          })
          .optional(),
        aapCredentials: z
          .object({
            url: z.string(),
            orgName: z.string(),
            oauthToken: z.string().optional(),
            username: z.string().optional(),
            password: z.string().optional(),
          })
          .optional(),
      });

      const parsedBody = runModuleRequestSchema
        .passthrough()
        .safeParse(req.body);
      if (!parsedBody.success) {
        throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
      }
      const { phase, sourceRepoAuth, targetRepoAuth, aapCredentials } =
        parsedBody.data;

      const { project, userRef } = await useEnforceProjectPermissions({
        req,
        readOnly: false,
        projectId,
        x2aDatabase,
        httpAuth,
        permissionsSvc,
        catalog,
      });

      assertProjectHasDirName(project);

      // Resolve git repositories with config-based token fallback
      const { sourceRepo, targetRepo } = gitRepoResolver.resolve({
        project,
        sourceRepoAuth,
        targetRepoAuth,
      });

      // Verify module exists
      const module = await x2aDatabase.getModule({ id: moduleId });
      if (!module) {
        throw new NotFoundError(
          `Module "${moduleId}" in project "${projectId}" not found.`,
        );
      }

      // Check for existing running job for this module
      const existingJobs = await x2aDatabase.listJobsForModule({
        projectId,
        moduleId,
      });

      // Reconcile jobs that appear active against K8s
      const activeJobs = existingJobs.filter(job =>
        JobStatus.from(job.status).isActive(),
      );
      const reconciledJobs = await Promise.all(
        activeJobs.map(job =>
          reconcileJobStatus(job, { kubeService, x2aDatabase, logger }),
        ),
      );
      const activeJob = reconciledJobs.find(job =>
        JobStatus.from(job.status).isActive(),
      );

      if (activeJob) {
        return res.status(409).json({
          error: 'JobAlreadyRunning',
          message: `A ${activeJob.phase} job is already running for this module`,
          details: 'Please wait for the current job to complete or cancel it',
          activeJobId: activeJob.id,
          activeJobPhase: activeJob.phase,
        });
      }

      const callbackToken = CallbackToken.generate();
      const job = await x2aDatabase.createJob({
        projectId,
        moduleId,
        phase,
        status: 'pending',
        callbackToken: callbackToken.value,
      });

      // Create Kubernetes job (will create both project and job secrets)
      // Use discoveryApi for consistent URL resolution
      // Allow override via config for local development (e.g., using LAN IP)
      const moduleBaseUrl =
        config.getOptionalString('x2a.callbackBaseUrl') ??
        (await discoveryApi.getBaseUrl('x2a'));
      const callbackUrl = `${moduleBaseUrl}/projects/${projectId}/collectArtifacts`;
      const { k8sJobName } = await kubeService.createJob({
        jobId: job.id,
        projectId,
        projectName: project.name,
        projectAbbrev: project.abbreviation,
        projectDirName: project.dirName,
        phase,
        user: userRef,
        callbackToken: callbackToken.value,
        callbackUrl,
        moduleId,
        moduleName: module.name,
        sourceTechnology: module.technology,
        sourceRepo,
        targetRepo,
        aapCredentials,
      });

      // Re-read the job to detect cancellation during the K8s creation window
      const freshJob = await x2aDatabase.getJob({ id: job.id });
      if (freshJob && JobStatus.from(freshJob.status).isCancelled()) {
        try {
          await kubeService.deleteJob(k8sJobName);
        } catch (e) {
          logger.warn(
            `Could not delete k8s job ${k8sJobName} after detecting cancellation for job ${job.id}: ${e}`,
          );
        }
        logger.info(
          `${phase} job was cancelled while K8s job was being created: jobId=${job.id}, moduleId=${moduleId}`,
        );
        return res.status(409).json({
          error: 'JobCancelledDuringCreation',
          message: `The ${phase} job was cancelled before it could start.`,
          jobId: job.id,
        });
      }

      // Update job with k8s job name and mark as running
      await x2aDatabase.updateJob({
        id: job.id,
        k8sJobName,
        status: 'running',
      });

      logger.info(
        `${phase} job created: jobId=${job.id}, moduleId=${moduleId}, k8sJobName=${k8sJobName}`,
      );

      return res.json({ status: 'running', jobId: job.id } as any);
    },
  );

  router.post(
    '/projects/:projectId/modules/:moduleId/cancel',
    async (req: express.Request, res: express.Response) => {
      const endpoint = 'POST /projects/:projectId/modules/:moduleId/cancel';
      const { projectId, moduleId } = req.params;
      logger.info(
        `${endpoint} request received: projectId=${projectId}, moduleId=${moduleId}`,
      );

      const cancelModuleRequestSchema = z.object({
        phase: z.enum(
          Phase.modulePhaseValues() as [ModulePhase, ...ModulePhase[]],
        ),
      });

      const parsedBody = cancelModuleRequestSchema
        .passthrough()
        .safeParse(req.body);
      if (!parsedBody.success) {
        throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
      }
      const { phase } = parsedBody.data;

      await useEnforceProjectPermissions({
        req,
        readOnly: false,
        projectId,
        x2aDatabase,
        httpAuth,
        permissionsSvc,
        catalog,
      });

      const module = await x2aDatabase.getModule({
        id: moduleId,
        skipEnrichment: true,
      });
      if (!module) {
        throw new NotFoundError(`Module "${moduleId}" not found.`);
      }
      if (module.projectId !== projectId) {
        throw new NotFoundError(
          `Module "${moduleId}" does not belong to project "${projectId}".`,
        );
      }

      const jobs = await x2aDatabase.listJobs({
        projectId,
        moduleId,
        phase,
        lastJobOnly: true,
      });

      if (jobs.length === 0) {
        throw new NotFoundError(
          `No ${phase} job found for module "${moduleId}".`,
        );
      }

      const job = jobs[0];

      if (!JobStatus.from(job.status).isActive()) {
        return res.status(409).json({
          error: 'JobNotCancellable',
          message: `The ${phase} job is in "${job.status}" state and cannot be cancelled.`,
        });
      }

      // Fetch logs from k8s before deleting the job
      let log: string | null = null;
      if (job.k8sJobName) {
        try {
          log = (await kubeService.getJobLogs(job.k8sJobName)) as string;
        } catch (e) {
          logger.warn(
            `Could not fetch logs for job ${job.id} (k8s: ${job.k8sJobName}) before cancellation: ${e}`,
          );
        }

        // Delete the K8s job before updating DB status so that a deletion
        // failure leaves the job as pending/running and reconciliation can
        // still track it. deleteJob already treats 404 as success.
        try {
          await kubeService.deleteJob(job.k8sJobName);
        } catch (e) {
          logger.error(
            `Failed to delete k8s job ${job.k8sJobName} for job ${job.id}, cancellation aborted: ${e}`,
          );
          return res.status(500).json({
            error: 'K8sDeletionFailed',
            message: `Failed to delete the Kubernetes job. The ${phase} job was not cancelled.`,
          });
        }
      }

      await x2aDatabase.updateJob({
        id: job.id,
        status: 'cancelled',
        finishedAt: new Date(),
        log,
      });

      logger.info(
        `${phase} job cancelled: jobId=${job.id}, moduleId=${moduleId}`,
      );

      return res.json({ message: 'Job cancelled successfully' });
    },
  );
}
