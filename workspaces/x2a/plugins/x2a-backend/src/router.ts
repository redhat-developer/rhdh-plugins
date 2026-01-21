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

import { HttpAuthService, LoggerService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import { z } from 'zod';
import express from 'express';

import { x2aDatabaseServiceRef } from './services/X2ADatabaseService';
import {
  createOpenApiRouter,
  ProjectsGet,
  ProjectsPost,
} from './schema/openapi';

export async function createRouter({
  httpAuth,
  x2aDatabase,
  logger,
}: {
  httpAuth: HttpAuthService;
  x2aDatabase: typeof x2aDatabaseServiceRef.T;
  logger: LoggerService;
}): Promise<express.Router> {
  const router = await createOpenApiRouter();

  router.get('/projects', async (req, res) => {
    const endpoint = 'GET /projects';
    const projectsGetRequestSchema = z.object({
      page: z.number().optional(),
      pageSize: z.number().optional(),
      sort: z
        .enum(['createdAt', 'name', 'description', 'createdBy'])
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

    const { projects, totalCount } = await x2aDatabase.listProjects();

    const response: ProjectsGet['response'] = {
      totalCount,
      items: projects,
    };
    res.json(response);
  });

  router.post('/projects', async (req, res) => {
    const endpoint = 'POST /projects';
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
    const project = await x2aDatabase.getProject({ projectId });
    res.json(project);
  });

  router.delete('/projects/:projectId', async (req, res) => {
    const endpoint = 'DELETE /projects/:projectId';
    const projectId = req.params.projectId;
    logger.info(`${endpoint} request received: projectId=${projectId}`);
    await x2aDatabase.deleteProject({ projectId });
    res.status(200);
  });

  return router;
}
