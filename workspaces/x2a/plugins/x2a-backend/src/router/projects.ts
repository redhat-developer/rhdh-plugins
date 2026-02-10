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
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { InputError, NotAllowedError, NotFoundError } from '@backstage/errors';
import {
  x2aAdminWritePermission,
  x2aUserPermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import type { RouterDeps } from './types';
import {
  authorize,
  getUserRef,
  isUserOfAdminViewPermission,
  isUserOfAdminWritePermission,
} from './common';
import { ProjectsGet, ProjectsPost } from '../schema/openapi';

export function registerProjectRoutes(
  router: express.Router,
  deps: RouterDeps,
): void {
  const {
    httpAuth,
    discoveryApi,
    x2aDatabase,
    kubeService,
    logger,
    permissionsSvc,
    config,
  } = deps;

  router.get('/projects', async (req, res) => {
    const endpoint = 'GET /projects';
    logger.info(`${endpoint} request received`);

    // parse request query
    const projectsGetRequestSchema = z.object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
      order: z.enum(['asc', 'desc']).optional(),
      sort: z
        .enum([
          'createdAt',
          'name',
          'abbreviation',
          'status',
          'description',
          'createdBy',
        ])
        .optional(),
    });

    const parseResult = projectsGetRequestSchema
      .passthrough()
      .safeParse(req.query);
    if (!parseResult.success) {
      throw new InputError(
        `Invalid query string ${endpoint}: ${parseResult.error}`,
      );
    }
    const query: ProjectsGet['query'] = parseResult.data;

    logger.info(`${endpoint} request received: query=${JSON.stringify(query)}`);

    // list projects
    const { projects, totalCount } = await x2aDatabase.listProjects(query, {
      credentials: await httpAuth.credentials(req, { allow: ['user'] }),
      canViewAll: await isUserOfAdminViewPermission(
        req as unknown as express.Request,
        permissionsSvc,
        httpAuth,
      ),
    });

    const response: ProjectsGet['response'] = {
      totalCount,
      items: projects,
    };
    res.json(response);
  });

  router.post('/projects', async (req, res) => {
    const endpoint = 'POST /projects';
    logger.info(`${endpoint} request received`);

    // authorize request
    const decision = await authorize(
      req,
      [x2aAdminWritePermission, x2aUserPermission],
      permissionsSvc,
      httpAuth,
    );
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError('You are not allowed to create a project');
    }

    // parse request body
    const projectCreateRequestSchema = z.object({
      name: z.string(),
      description: z.string(),
      abbreviation: z.string(),
      sourceRepoUrl: z.string(),
      targetRepoUrl: z.string(),
      sourceRepoBranch: z.string(),
      targetRepoBranch: z.string(),
    });

    const parsedBody = projectCreateRequestSchema
      .passthrough()
      .safeParse(req.body);
    if (!parsedBody.success) {
      throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
    }
    const requestBody: ProjectsPost['body'] = parsedBody.data;

    // create project
    const newProject = await x2aDatabase.createProject(requestBody, {
      credentials: await httpAuth.credentials(req, { allow: ['user'] }),
    });

    const response: ProjectsPost['response'] = newProject;
    res.json(response);
  });

  router.get('/projects/:projectId', async (req, res) => {
    const endpoint = 'GET /projects/:projectId';
    const projectId = req.params.projectId;
    logger.info(`${endpoint} request received: projectId=${projectId}`);

    const project = await x2aDatabase.getProject(
      { projectId },
      {
        credentials: await httpAuth.credentials(req, { allow: ['user'] }),
        canViewAll: await isUserOfAdminViewPermission(
          req as unknown as express.Request,
          permissionsSvc,
          httpAuth,
        ),
      },
    );
    if (!project) {
      throw new NotFoundError(`Project not found`);
    }
    res.json(project);
  });

  router.delete('/projects/:projectId', async (req, res) => {
    const endpoint = 'DELETE /projects/:projectId';
    const projectId = req.params.projectId;
    logger.info(`${endpoint} request received: projectId=${projectId}`);
    const deletedCount = await x2aDatabase.deleteProject(
      { projectId },
      {
        credentials: await httpAuth.credentials(req, { allow: ['user'] }),
        canWriteAll: await isUserOfAdminWritePermission(
          req as unknown as express.Request,
          permissionsSvc,
          httpAuth,
        ),
      },
    );
    if (deletedCount === 0) {
      throw new NotFoundError(`Project not found`);
    }
    res.status(200).json({ deletedCount });
  });

  router.post(
    '/projects/:projectId/run',
    async (req: express.Request, res: express.Response) => {
      const endpoint = 'POST /projects/:projectId/run';
      const { projectId } = req.params;
      logger.info(`${endpoint} request received: projectId=${projectId}`);

      // Validate request body
      const runRequestSchema = z.object({
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
        userPrompt: z.string().optional(),
      });

      const parsedBody = runRequestSchema.passthrough().safeParse(req.body);
      if (!parsedBody.success) {
        throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
      }
      const { sourceRepoAuth, targetRepoAuth, aapCredentials, userPrompt } =
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

      // Check for existing running init job
      const existingJobs = await x2aDatabase.listJobsForProject({ projectId });
      const hasActiveInitJob = existingJobs.some(
        job =>
          job.phase === 'init' && ['pending', 'running'].includes(job.status),
      );

      if (hasActiveInitJob) {
        return res.status(409).json({
          error: 'JobAlreadyRunning',
          message: 'An init job is already running for this project',
          details:
            'Please wait for the current job to complete or cancel it before starting a new one',
        });
      }

      // Generate callback token and create job record
      const callbackToken = randomUUID();
      const job = await x2aDatabase.createJob({
        projectId,
        moduleId: undefined, // Init jobs have no module
        phase: 'init',
        status: 'pending',
        callbackToken,
      });

      // Create Kubernetes job (will create both project and job secrets)
      // Use HTTP for in-cluster service-to-service communication
      // Jobs call back to Backstage within the same cluster
      const baseUrl = await discoveryApi.getBaseUrl('x2a');
      const callbackUrl = `${baseUrl}/projects/${projectId}/collectArtifacts`;
      const { k8sJobName } = await kubeService.createJob({
        jobId: job.id,
        projectId,
        projectName: project.name,
        projectAbbrev: project.abbreviation,
        phase: 'init',
        user: userRef,
        callbackToken,
        callbackUrl,
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
        userPrompt,
      });

      // Update job with k8s job name
      await x2aDatabase.updateJob({ id: job.id, k8sJobName });

      logger.info(
        `Init job created: jobId=${job.id}, k8sJobName=${k8sJobName}`,
      );

      return res.json({ status: 'pending', jobId: job.id } as any);
    },
  );
}
