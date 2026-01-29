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
import {
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

export async function createRouter({
  httpAuth,
  x2aDatabase,
  logger,
  permissionsSvc,
}: {
  httpAuth: HttpAuthService;
  x2aDatabase: typeof x2aDatabaseServiceRef.T;
  kubeService: typeof kubeServiceRef.T;
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

  return router;
}
