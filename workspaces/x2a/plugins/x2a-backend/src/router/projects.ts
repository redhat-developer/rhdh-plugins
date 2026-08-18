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
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { InputError, NotAllowedError, NotFoundError } from '@backstage/errors';
import {
  ENTITY_REF_RE,
  JobStatus,
  Phase,
  x2aAdminWritePermission,
  x2aUserPermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { CallbackToken } from '@red-hat-developer-hub/backstage-plugin-x2a-node';

import type { RouterDeps } from './types';
import {
  assertProjectHasDirName,
  authorize,
  getGroupsOfUser,
  getUserRef,
  reconcileJobStatus,
  useEnforceProjectPermissions,
  useEnforceX2APermissions,
} from './common';
import { GitRepositoryResolver } from './GitRepositoryResolver';
import { ProjectsGet, ProjectsPost } from '../schema/openapi';

const projectUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    ownedBy: z.string().regex(ENTITY_REF_RE).optional(),
    description: z.string().optional(),
  })
  .strict();

export function registerProjectRoutes(
  router: express.Router,
  deps: RouterDeps,
): void {
  const {
    httpAuth,
    discoveryApi,
    catalog,
    x2aDatabase,
    kubeService,
    logger,
    permissionsSvc,
    config,
  } = deps;
  const gitRepoResolver = new GitRepositoryResolver(config);

  router.get('/projects', async (req, res) => {
    const endpoint = 'GET /projects';
    logger.info(`${endpoint} request received`);

    const { canViewAll } = await useEnforceX2APermissions({
      req,
      readOnly: true,
      permissionsSvc,
      httpAuth,
    });

    // parse request query
    const projectsGetRequestSchema = z.object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
      order: z.enum(['asc', 'desc']).optional(),
      sort: z
        .enum([
          'createdAt',
          'name',
          // sorting by status is expensive for large datasets
          'status',
          'description',
          'ownedBy',
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
    const credentials = await httpAuth.credentials(req, { allow: ['user'] });
    const userRef = getUserRef(credentials);
    const groupsOfUser = await getGroupsOfUser(userRef, {
      catalog,
      credentials,
    });

    const { projects, totalCount } = await x2aDatabase.listProjects(query, {
      credentials,
      canViewAll,
      groupsOfUser,
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
      ownedByGroup: z.string().optional(),
      sourceRepoUrl: z.string(),
      targetRepoUrl: z.string(),
      sourceRepoBranch: z.string(),
      targetRepoBranch: z.string(),
      acceptedRuleIds: z.array(z.string()).optional(),
    });

    const parsedBody = projectCreateRequestSchema
      .passthrough()
      .safeParse(req.body);
    if (!parsedBody.success) {
      throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
    }
    const requestBody: ProjectsPost['body'] = parsedBody.data;

    // validate the user is a member of the ownedByGroup
    if (requestBody.ownedByGroup) {
      const credentials = await httpAuth.credentials(req, { allow: ['user'] });
      const userRef = getUserRef(credentials);
      const groupsOfUser = await getGroupsOfUser(userRef, {
        catalog,
        credentials,
      });
      if (!groupsOfUser.includes(requestBody.ownedByGroup)) {
        throw new NotAllowedError(
          'You are not allowed to create a project for the given group',
        );
      }
    }

    // Pre-validate rule IDs to avoid orphan projects on invalid input
    if (requestBody.acceptedRuleIds?.length) {
      const ruleChecks = await Promise.all(
        requestBody.acceptedRuleIds.map(async id => ({
          id,
          exists: !!(await x2aDatabase.getRule({ id })),
        })),
      );
      const missingRules = ruleChecks.filter(r => !r.exists).map(r => r.id);
      if (missingRules.length) {
        throw new InputError(`Rules not found: ${missingRules.join(', ')}`);
      }
    }

    // create project
    const newProject = await x2aDatabase.createProject(requestBody, {
      credentials: await httpAuth.credentials(req, { allow: ['user'] }),
    });

    // Attach accepted rules (auto-appends required rules even with empty array)
    await x2aDatabase.attachRulesToProject({
      projectId: newProject.id,
      ruleIds: requestBody.acceptedRuleIds ?? [],
    });

    // Include accepted rules in the response
    newProject.acceptedRules = await x2aDatabase.getAcceptedRulesForProject({
      projectId: newProject.id,
    });

    const response: ProjectsPost['response'] = newProject;
    res.json(response);
  });

  router.get('/projects/:projectId', async (req, res) => {
    const endpoint = 'GET /projects/:projectId';
    const projectId = req.params.projectId;
    logger.info(`${endpoint} request received: projectId=${projectId}`);

    const { project } = await useEnforceProjectPermissions({
      req,
      readOnly: true,
      doEnrichment: true,
      projectId,
      x2aDatabase,
      permissionsSvc,
      httpAuth,
      catalog,
    });

    res.json(project);
  });

  router.delete('/projects/:projectId', async (req, res) => {
    const endpoint = 'DELETE /projects/:projectId';
    const projectId = req.params.projectId;
    logger.info(`${endpoint} request received: projectId=${projectId}`);

    const { canWriteAll, credentials, groupsOfUser } =
      await useEnforceProjectPermissions({
        req,
        readOnly: false,
        projectId,
        x2aDatabase,
        permissionsSvc,
        httpAuth,
        catalog,
      });

    // Cancel any active k8s jobs before deleting DB records
    const jobs = await x2aDatabase.listJobsForProject({ projectId });
    const activeJobs = jobs.filter(
      job => JobStatus.from(job.status).isActive() && job.k8sJobName,
    );
    await Promise.all(
      activeJobs.map(job => {
        logger.info(
          `Cancelling k8s job ${job.k8sJobName} for project ${projectId}`,
        );
        return kubeService.deleteJob(job.k8sJobName!).catch(err => {
          logger.warn(
            `Failed to cancel k8s job ${job.k8sJobName}: ${err.message}`,
          );
        });
      }),
    );

    const deletedCount = await x2aDatabase.deleteProject(
      { projectId },
      {
        credentials,
        canWriteAll,
        groupsOfUser,
      },
    );
    if (deletedCount === 0) {
      throw new NotFoundError(`Project not found`);
    }
    res.status(200).json({ deletedCount });
  });

  router.patch('/projects/:projectId', async (req, res) => {
    const endpoint = 'PATCH /projects/:projectId';
    const projectId = req.params.projectId;
    logger.info(`${endpoint} request received: projectId=${projectId}`);

    const { canWriteAll, credentials, groupsOfUser } =
      await useEnforceProjectPermissions({
        req,
        readOnly: false,
        projectId,
        x2aDatabase,
        permissionsSvc,
        httpAuth,
        catalog,
      });

    const parsedBody = projectUpdateSchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
    }

    const { name, ownedBy, description } = parsedBody.data;
    if (
      name === undefined &&
      ownedBy === undefined &&
      description === undefined
    ) {
      throw new InputError(
        `${endpoint}: At least one field (name, ownedBy, description) must be provided`,
      );
    }

    const updated = await x2aDatabase.updateProject(
      { projectId },
      { name, ownedBy, description },
      {
        credentials,
        canWriteAll,
        groupsOfUser,
      },
    );

    if (!updated) {
      throw new NotFoundError('Project not found');
    }

    res.json(updated);
  });

  router.post(
    '/projects/:projectId/run',
    async (req: express.Request, res: express.Response) => {
      const endpoint = 'POST /projects/:projectId/run';
      const { projectId } = req.params;
      logger.info(`${endpoint} request received: projectId=${projectId}`);

      const { project, userRef } = await useEnforceProjectPermissions({
        req,
        readOnly: false,
        doEnrichment: true,
        projectId,
        x2aDatabase,
        permissionsSvc,
        httpAuth,
        catalog,
      });

      assertProjectHasDirName(project);

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
        refresh: z.boolean().optional(),
      });

      const parsedBody = runRequestSchema.passthrough().safeParse(req.body);
      if (!parsedBody.success) {
        throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
      }
      const {
        sourceRepoAuth,
        targetRepoAuth,
        aapCredentials,
        userPrompt,
        refresh,
      } = parsedBody.data;

      // Check for existing running init job before refresh validation so a
      // pending resync (latest init job without artifacts yet) returns 409
      // rather than 400 for missing migrationPlan on the in-flight job.
      const existingJobs = await x2aDatabase.listJobsForProject({ projectId });
      const activeInitJobs = existingJobs.filter(
        job => job.phase === 'init' && JobStatus.from(job.status).isActive(),
      );
      const reconciledInitJobs = await Promise.all(
        activeInitJobs.map(job =>
          reconcileJobStatus(job, { kubeService, x2aDatabase, logger }),
        ),
      );
      const hasActiveInitJob = reconciledInitJobs.some(job =>
        JobStatus.from(job.status).isActive(),
      );

      if (hasActiveInitJob) {
        return res.status(409).json({
          error: 'JobAlreadyRunning',
          message: 'An init job is already running for this project',
          details:
            'Please wait for the current job to complete or cancel it before starting a new one',
        });
      }

      if (refresh && !project.migrationPlan) {
        throw new InputError(
          `Invalid body ${endpoint}: refresh requires an existing migration plan from a completed init phase`,
        );
      }

      // Resolve git repositories with config-based token fallback
      const { sourceRepo, targetRepo } = gitRepoResolver.resolve({
        project,
        sourceRepoAuth,
        targetRepoAuth,
      });

      const callbackToken = CallbackToken.generate();
      const job = await x2aDatabase.createJob({
        projectId,
        moduleId: undefined, // Init jobs have no module
        phase: 'init',
        status: 'pending',
        callbackToken: callbackToken.value,
      });

      // Create Kubernetes job (will create both project and job secrets)
      // Use HTTP for in-cluster service-to-service communication
      // Jobs call back to Backstage within the same cluster
      // Allow override via config for local development (e.g., using LAN IP)
      const baseUrl =
        config.getOptionalString('x2a.callbackBaseUrl') ??
        (await discoveryApi.getBaseUrl('x2a'));
      const callbackUrl = `${baseUrl}/projects/${projectId}/collectArtifacts`;
      // Read accepted rules snapshot for the K8s job
      const acceptedRules = await x2aDatabase.getAcceptedRulesForProject({
        projectId,
      });

      const { k8sJobName } = await kubeService.createJob({
        jobId: job.id,
        projectId,
        projectName: project.name,
        projectDirName: project.dirName,
        phase: 'init',
        user: userRef,
        callbackToken: callbackToken.value,
        callbackUrl,
        sourceRepo,
        targetRepo,
        aapCredentials,
        userPrompt,
        acceptedRules,
        refresh,
      });

      // Update job with k8s job name
      await x2aDatabase.updateJob({
        id: job.id,
        k8sJobName,
      });

      logger.info(
        `Init job created: jobId=${job.id}, k8sJobName=${k8sJobName}`,
      );

      return res.json({ status: 'pending', jobId: job.id } as any);
    },
  );

  router.post(
    '/projects/:projectId/adversarial-run',
    async (req: express.Request, res: express.Response) => {
      const endpoint = 'POST /projects/:projectId/adversarial-run';
      const { projectId } = req.params;
      logger.info(`${endpoint} request received: projectId=${projectId}`);

      const adversarialRunSchema = z.object({
        phase: z.enum(['analyze', 'migrate']),
        moduleId: z.string().uuid(),
        agentIds: z.array(z.string().uuid()).min(1),
        targetRepoAuth: z.object({ token: z.string() }).optional(),
      });

      const parsedBody = adversarialRunSchema.safeParse(req.body);
      if (!parsedBody.success) {
        throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
      }
      const { phase, moduleId, agentIds, targetRepoAuth } = parsedBody.data;

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

      const adversarialAgents = await x2aDatabase.listAdversarialAgents({
        ids: agentIds,
        phase,
      });
      if (adversarialAgents.length !== agentIds.length) {
        const foundIds = new Set(adversarialAgents.map(a => a.id));
        const missingIds = agentIds.filter(id => !foundIds.has(id));
        return res.status(400).json({
          error: 'AgentIdMismatch',
          message: `Some agent IDs were not found or are not valid for the ${phase} phase`,
          missingIds,
        });
      }

      const module = await x2aDatabase.getModule({ id: moduleId });
      if (!module) {
        throw new InputError(`Module "${moduleId}" not found`);
      }
      if (module.projectId !== projectId) {
        throw new InputError(
          `Module "${moduleId}" does not belong to project "${projectId}"`,
        );
      }

      // Check for a running adversarial job for this module+phase
      const adversarialPhase = Phase.from(`adversarial-${phase}`);
      const existingJobs = await x2aDatabase.listJobsForModule({
        projectId,
        moduleId,
      });
      const activeAdversarialJobs = existingJobs.filter(
        j =>
          j.phase === adversarialPhase.value &&
          JobStatus.from(j.status).isActive(),
      );
      const reconciledJobs = await Promise.all(
        activeAdversarialJobs.map(job =>
          reconcileJobStatus(job, { kubeService, x2aDatabase, logger }),
        ),
      );
      const activeAdversarialJob = reconciledJobs.find(job =>
        JobStatus.from(job.status).isActive(),
      );
      if (activeAdversarialJob) {
        return res.status(409).json({
          error: 'JobAlreadyRunning',
          message: `An adversarial-${phase} job is already running for this module`,
          activeJobId: activeAdversarialJob.id,
        });
      }

      const targetRepo = gitRepoResolver.resolveTargetOnly({
        project,
        targetRepoAuth,
      });

      const callbackToken = CallbackToken.generate();
      const job = await x2aDatabase.createJob({
        projectId,
        moduleId,
        phase: adversarialPhase.value,
        status: 'pending',
        callbackToken: callbackToken.value,
      });

      const baseUrl =
        config.getOptionalString('x2a.callbackBaseUrl') ??
        (await discoveryApi.getBaseUrl('x2a'));
      const callbackUrl = `${baseUrl}/projects/${projectId}/collectArtifacts`;

      const { k8sJobName } = await kubeService.createJob({
        jobId: job.id,
        projectId,
        projectName: project.name,
        projectDirName: project.dirName,
        phase: adversarialPhase.value,
        user: userRef,
        callbackToken: callbackToken.value,
        callbackUrl,
        moduleId,
        moduleName: module.name,
        sourceRepo: targetRepo,
        targetRepo,
        adversarialAgents: adversarialAgents.map(a => a.toConfig()),
      });

      await x2aDatabase.updateJob({
        id: job.id,
        k8sJobName,
        status: 'running',
      });

      logger.info(
        `Adversarial-${phase} job created: jobId=${job.id}, moduleId=${moduleId}, k8sJobName=${k8sJobName}`,
      );

      return res.status(202).json({ jobId: job.id, k8sJobName } as any);
    },
  );
}
