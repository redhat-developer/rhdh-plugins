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
import { randomUUID } from 'node:crypto';
import { InputError, NotFoundError } from '@backstage/errors';
import { Module } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import type { RouterDeps } from './types';
import {
  getUserRef,
  reconcileJobStatus,
  removeSensitiveFromJob,
} from './common';

export function registerModuleRoutes(
  router: express.Router,
  deps: RouterDeps,
): void {
  const { httpAuth, discoveryApi, x2aDatabase, kubeService, logger, config } =
    deps;

  router.get('/projects/:projectId/modules', async (req, res) => {
    const endpoint = 'GET /projects/:projectId/modules';
    const { projectId } = req.params;
    logger.info(`${endpoint} request received: projectId=${projectId}`);

    // Get user credentials
    const credentials = await httpAuth.credentials(req, { allow: ['user'] });

    // Verify project exists and the user is permitted to access it
    const project = await x2aDatabase.getProject(
      { projectId },
      { credentials },
    );
    if (!project) {
      throw new NotFoundError(`Project "${projectId}" not found.`);
    }

    // List modules
    const modules = await x2aDatabase.listModules({ projectId });

    // TODO: This can be optimized by using a single query to list all jobs for all modules.
    const lastAnalyzeJobsOfModules = await Promise.all(
      modules.map(module =>
        x2aDatabase.listJobs({
          projectId,
          moduleId: module.id,
          phase: 'analyze',
          lastJobOnly: true,
        }),
      ),
    );
    const lastMigrateJobsOfModules = await Promise.all(
      modules.map(module =>
        x2aDatabase.listJobs({
          projectId,
          moduleId: module.id,
          phase: 'migrate',
          lastJobOnly: true,
        }),
      ),
    );
    const lastPublishJobsOfModules = await Promise.all(
      modules.map(module =>
        x2aDatabase.listJobs({
          projectId,
          moduleId: module.id,
          phase: 'publish',
          lastJobOnly: true,
        }),
      ),
    );

    const response: Array<Module> = modules.map((module, idxModule) => {
      return {
        ...module,
        analyze: removeSensitiveFromJob(lastAnalyzeJobsOfModules[idxModule][0]),
        migrate: removeSensitiveFromJob(lastMigrateJobsOfModules[idxModule][0]),
        publish: removeSensitiveFromJob(lastPublishJobsOfModules[idxModule][0]),

        // TODO: calculate module's status from the last job
      };
    });

    res.json(response);
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
      const endpoint = 'POST /projects/:projectId/modules';
      const { projectId } = req.params;
      logger.info(`${endpoint} request received: projectId=${projectId}`);

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

      // Get user credentials
      const credentials = await httpAuth.credentials(req, { allow: ['user'] });

      // Verify project exists
      const project = await x2aDatabase.getProject(
        { projectId },
        { credentials },
      );
      if (!project) {
        throw new NotFoundError(`Project "${projectId}" not found.`);
      }

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
        phase: z.enum(['analyze', 'migrate', 'publish']),
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

      // Get tokens with config-based fallback
      const sourceToken =
        sourceRepoAuth?.token ??
        config.getOptionalString('x2a.git.sourceRepo.token');
      const targetToken =
        targetRepoAuth?.token ??
        config.getOptionalString('x2a.git.targetRepo.token');

      if (!sourceToken) {
        throw new InputError(
          'Source repository token is required. Provide it in the request or configure x2a.git.sourceRepo.token.',
        );
      }
      if (!targetToken) {
        throw new InputError(
          'Target repository token is required. Provide it in the request or configure x2a.git.targetRepo.token.',
        );
      }

      // Get user reference safely
      const credentials = await httpAuth.credentials(req, { allow: ['user'] });
      const userRef = getUserRef(credentials);

      // Verify project exists
      const project = await x2aDatabase.getProject(
        { projectId },
        { credentials },
      );
      if (!project) {
        throw new NotFoundError(`Project "${projectId}" not found.`);
      }

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
      const reconciledJobs = await Promise.all(
        existingJobs
          .filter(job => ['pending', 'running'].includes(job.status))
          .map(job =>
            reconcileJobStatus(job, { kubeService, x2aDatabase, logger }),
          ),
      );
      const hasActiveJob = reconciledJobs.some(job =>
        ['pending', 'running'].includes(job.status),
      );

      if (hasActiveJob) {
        const activeJob = existingJobs.find(job =>
          ['pending', 'running'].includes(job.status),
        );
        return res.status(409).json({
          error: 'JobAlreadyRunning',
          message: `A ${activeJob!.phase} job is already running for this module`,
          details: 'Please wait for the current job to complete or cancel it',
          activeJobId: activeJob!.id,
          activeJobPhase: activeJob!.phase,
        });
      }

      // Generate callback token and create job record
      const callbackToken = randomUUID();
      const job = await x2aDatabase.createJob({
        projectId,
        moduleId,
        phase,
        status: 'pending',
        callbackToken,
      });

      // Create Kubernetes job (will create both project and job secrets)
      // Use discoveryApi for consistent URL resolution
      const moduleBaseUrl = await discoveryApi.getBaseUrl('x2a');
      const callbackUrl = `${moduleBaseUrl}/projects/${projectId}/modules/${moduleId}/collectArtifacts`;
      const { k8sJobName } = await kubeService.createJob({
        jobId: job.id,
        projectId,
        projectName: project.name,
        projectAbbrev: project.abbreviation,
        phase,
        user: userRef,
        callbackToken,
        callbackUrl,
        moduleId,
        moduleName: module.name,
        sourceRepo: {
          url: project.sourceRepoUrl,
          branch: project.sourceRepoBranch,
          token: sourceToken,
        },
        targetRepo: {
          url: project.targetRepoUrl,
          branch: project.targetRepoBranch,
          token: targetToken,
        },
        aapCredentials,
      });

      // Update job with k8s job name
      await x2aDatabase.updateJob({ id: job.id, k8sJobName });

      logger.info(
        `${phase} job created: jobId=${job.id}, moduleId=${moduleId}, k8sJobName=${k8sJobName}`,
      );

      return res.json({ status: 'pending', jobId: job.id } as any);
    },
  );
}
