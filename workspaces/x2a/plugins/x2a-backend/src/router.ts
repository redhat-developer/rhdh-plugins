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
import express, { Request } from 'express';
import { randomUUID } from 'node:crypto';
import {
  BackstageCredentials,
  BackstageUserPrincipal,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
  PermissionsService,
} from '@backstage/backend-plugin-api';
import { InputError, NotAllowedError, NotFoundError } from '@backstage/errors';
import {
  AuthorizePermissionResponse,
  AuthorizeResult,
  BasicPermission,
} from '@backstage/plugin-permission-common';
import {
  Job,
  Module,
  ModulePhase,
  x2aAdminViewPermission,
  x2aAdminWritePermission,
  x2aUserPermission,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { x2aDatabaseServiceRef } from './services/X2ADatabaseService';
import {
  createOpenApiRouter,
  ProjectsGet,
  ProjectsPost,
} from './schema/openapi';
import { kubeServiceRef } from './services/KubeService';

const isUserOfAdminViewPermission = async (
  request: Request,
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
): Promise<boolean> => {
  const credentials = await httpAuth.credentials(request);
  const result = await permissionsSvc.authorize(
    [{ permission: x2aAdminViewPermission }],
    { credentials },
  );
  return result?.[0]?.result === AuthorizeResult.ALLOW;
};

const isUserOfAdminWritePermission = async (
  request: Request,
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
): Promise<boolean> => {
  const credentials = await httpAuth.credentials(request);
  const result = await permissionsSvc.authorize(
    [{ permission: x2aAdminWritePermission }],
    { credentials },
  );
  return result?.[0]?.result === AuthorizeResult.ALLOW;
};

const authorize = async (
  request: Request,
  anyOfPermissions: BasicPermission[],
  permissionsSvc: PermissionsService,
  httpAuth: HttpAuthService,
): Promise<AuthorizePermissionResponse> => {
  const credentials = await httpAuth.credentials(request);
  const decisionResponses: AuthorizePermissionResponse[][] = await Promise.all(
    anyOfPermissions.map(permission =>
      permissionsSvc.authorize([{ permission }], {
        credentials,
      }),
    ),
  );

  const decisions: AuthorizePermissionResponse[] = decisionResponses.map(
    d => d?.[0] ?? { result: AuthorizeResult.DENY },
  );
  const allow = decisions.find(d => d.result === AuthorizeResult.ALLOW);
  return (
    allow || {
      result: AuthorizeResult.DENY,
    }
  );
};
/**
 * Safely extracts user reference from credentials with fallback
 */
function getUserRef(
  credentials: BackstageCredentials<BackstageUserPrincipal>,
): string {
  try {
    return credentials.principal.userEntityRef;
  } catch {
    return 'user:default/system';
  }
}

type UnsecureJob = Job & { callbackToken?: string };
const removeSensitiveFromJob = (job?: UnsecureJob): Job | undefined => {
  if (!job) {
    return undefined;
  }

  const newJob: UnsecureJob = { ...job };
  delete newJob.callbackToken;
  return newJob;
};

export async function createRouter({
  httpAuth,
  discoveryApi,
  x2aDatabase,
  kubeService,
  logger,
  permissionsSvc,
}: {
  httpAuth: HttpAuthService;
  x2aDatabase: typeof x2aDatabaseServiceRef.T;
  kubeService: typeof kubeServiceRef.T;
  discoveryApi: DiscoveryService;
  logger: LoggerService;
  permissionsSvc: PermissionsService;
}): Promise<express.Router> {
  const router = await createOpenApiRouter();

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
        req as unknown as Request,
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
          req as unknown as Request,
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
          req as unknown as Request,
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
        sourceRepoAuth: z.object({
          token: z.string(),
        }),
        targetRepoAuth: z.object({
          token: z.string(),
        }),
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
        phase: 'init',
        user: userRef,
        callbackToken,
        callbackUrl,
        sourceRepo: {
          url: project.sourceRepoUrl,
          branch: project.sourceRepoBranch,
          token: sourceRepoAuth.token,
        },
        targetRepo: {
          url: project.targetRepoUrl,
          branch: project.targetRepoBranch,
          token: targetRepoAuth.token,
        },
        aapCredentials,
        userPrompt,
      });

      // Update job with k8s job name
      await x2aDatabase.updateJob({ id: job.id, k8sJobName });

      logger.info(
        `Init job created: jobId=${job.id}, k8sJobName=${k8sJobName}`,
      );

      res.json({ status: 'pending', jobId: job.id } as any);
    },
  );

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

      // Validate request body
      const runModuleRequestSchema = z.object({
        phase: z.enum(['analyze', 'migrate', 'publish']),
        sourceRepoAuth: z.object({
          token: z.string(),
        }),
        targetRepoAuth: z.object({
          token: z.string(),
        }),
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

      const parsedBody = runModuleRequestSchema
        .passthrough()
        .safeParse(req.body);
      if (!parsedBody.success) {
        throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
      }
      const {
        phase,
        sourceRepoAuth,
        targetRepoAuth,
        aapCredentials,
        userPrompt,
      } = parsedBody.data;

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
      // Use HTTP for in-cluster service-to-service communication
      // Jobs call back to Backstage within the same cluster
      const callbackUrl = `http://${req.get('host')}/api/x2a/projects/${projectId}/modules/${moduleId}/collectArtifacts`;
      const { k8sJobName } = await kubeService.createJob({
        jobId: job.id,
        projectId,
        projectName: project.name,
        phase,
        user: userRef,
        callbackToken,
        callbackUrl,
        moduleId,
        moduleName: module.name,
        sourceRepo: {
          url: project.sourceRepoUrl,
          branch: project.sourceRepoBranch,
          token: sourceRepoAuth.token,
        },
        targetRepo: {
          url: project.targetRepoUrl,
          branch: project.targetRepoBranch,
          token: targetRepoAuth.token,
        },
        aapCredentials,
        userPrompt,
      });

      // Update job with k8s job name
      await x2aDatabase.updateJob({ id: job.id, k8sJobName });

      logger.info(
        `${phase} job created: jobId=${job.id}, moduleId=${moduleId}, k8sJobName=${k8sJobName}`,
      );

      res.json({ status: 'pending', jobId: job.id } as any);
    },
  );

  // TODO: Add /projects/:projectId/log

  router.get('/projects/:projectId/modules/:moduleId/log', async (req, res) => {
    const endpoint = 'GET /projects/:projectId/modules/:moduleId/log';
    const { projectId, moduleId } = req.params;
    const streaming = req.query.streaming === true;
    const phase = req.query.phase as ModulePhase;

    // Validate phase parameter (required)
    if (!phase || !['analyze', 'migrate', 'publish'].includes(phase)) {
      throw new InputError(
        'phase query parameter is required and must be one of: analyze, migrate, publish',
      );
    }

    logger.info(
      `${endpoint} request: projectId=${projectId}, moduleId=${moduleId}, streaming=${streaming}, phase=${phase}`,
    );

    // Get credentials and permissions
    const credentials = await httpAuth.credentials(req, { allow: ['user'] });
    const canViewAll = await isUserOfAdminViewPermission(
      req as unknown as Request,
      permissionsSvc,
      httpAuth,
    );

    // Verify project exists and user has access
    const project = await x2aDatabase.getProject(
      { projectId },
      { credentials, canViewAll },
    );
    if (!project) {
      throw new NotFoundError(`Project not found`);
    }

    // Verify module exists
    const module = await x2aDatabase.getModule({ id: moduleId });
    if (!module) {
      throw new NotFoundError(`Module not found`);
    }

    // Verify module belongs to project
    if (module.projectId !== projectId) {
      throw new NotFoundError(`Module does not belong to project`);
    }

    // Get latest job for module filtered by requested phase
    const jobs = await x2aDatabase.listJobs({
      projectId,
      moduleId,
      phase,
    });

    if (jobs.length === 0) {
      throw new NotFoundError(`No jobs found for module with phase '${phase}'`);
    }

    const latestJob = jobs[0]; // Already sorted by started_at DESC in listJobs

    // Validate the latest job phase matches requested phase (sanity check)
    if (latestJob.phase !== phase) {
      throw new InputError(
        `Latest job phase '${latestJob.phase}' does not match requested phase '${phase}'`,
      );
    }

    // If job is finished, return logs from database
    if (latestJob.status === 'success' || latestJob.status === 'error') {
      logger.info(
        `Job ${latestJob.id} is finished (status: ${latestJob.status}), returning logs from database`,
      );
      res.setHeader('Content-Type', 'text/plain');
      const log = await x2aDatabase.getJobLogs({ jobId: latestJob.id });
      if (!log) {
        logger.error(`Log not found for a finished job ${latestJob.id}`);
      }
      res.send(log || '');
      return;
    }

    // Check if job has k8sJobName
    if (!latestJob.k8sJobName) {
      logger.warn(
        `Job ${latestJob.id} has no k8sJobName, returning empty logs`,
      );
      res.setHeader('Content-Type', 'text/plain');
      res.send('');
      return;
    }

    // Get logs from Kubernetes
    const logs = await kubeService.getJobLogs(latestJob.k8sJobName, streaming);

    // Set content type
    res.setHeader('Content-Type', 'text/plain');

    // Handle streaming vs non-streaming
    if (streaming && typeof logs !== 'string') {
      logs.pipe(res);
    } else {
      res.send(logs as string);
    }
  });

  // TODO: Implement /collectArtifacts endpoints for callback from Kubernetes jobs
  // These endpoints should use Backstage service-to-service authentication with static tokens
  // See: https://backstage.io/docs/auth/service-to-service-auth#static-tokens
  //
  // The endpoints should:
  // 1. Accept POST requests from Kubernetes jobs with static token authentication
  // 2. Validate the callback token from the job (included in request body)
  // 3. Update job status in database based on job completion/failure
  // 4. Store artifacts (logs, results) returned by the job
  //
  // Endpoints to implement:
  // - POST /projects/:projectId/collectArtifacts (for init phase jobs)
  // - POST /projects/:projectId/modules/:moduleId/collectArtifacts (for analyze/migrate/publish phase jobs)

  return router;
}
