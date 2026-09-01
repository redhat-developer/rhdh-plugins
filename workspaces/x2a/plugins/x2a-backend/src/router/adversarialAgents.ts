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
import { x2aAdminWritePermission } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import type { RouterDeps } from './types';
import { authorize, useEnforceX2APermissions } from './common';

export function registerAdversarialAgentRoutes(
  router: express.Router,
  deps: RouterDeps,
): void {
  const { httpAuth, x2aDatabase, logger, permissionsSvc } = deps;

  router.get('/adversarial-agents', async (req, res) => {
    const endpoint = 'GET /adversarial-agents';
    logger.info(`${endpoint} request received`);

    await useEnforceX2APermissions({
      req,
      readOnly: true,
      permissionsSvc,
      httpAuth,
    });

    const { phase } = req.query;
    const agents = await x2aDatabase.listAdversarialAgents(
      phase ? { phase: String(phase) } : undefined,
    );
    res.json({ agents, total: agents.length });
  });

  router.get('/adversarial-agents/:id', async (req, res) => {
    const endpoint = 'GET /adversarial-agents/:id';
    const { id } = req.params;
    logger.info(`${endpoint} request received: id=${id}`);

    await useEnforceX2APermissions({
      req,
      readOnly: true,
      permissionsSvc,
      httpAuth,
    });

    const agent = await x2aDatabase.getAdversarialAgent({ id });
    if (!agent) {
      throw new NotFoundError('Adversarial agent not found');
    }

    res.json(agent);
  });

  router.post('/adversarial-agents', async (req, res) => {
    const endpoint = 'POST /adversarial-agents';
    logger.info(`${endpoint} request received`);

    const decision = await authorize(
      req,
      [x2aAdminWritePermission],
      permissionsSvc,
      httpAuth,
    );
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError(
        'You are not allowed to create adversarial agents',
      );
    }

    const createAgentSchema = z.object({
      name: z.string().min(3).max(100),
      prompt: z.string().min(50).max(5000),
      phases: z.array(z.enum(['analyze', 'migrate'])).min(1),
      critical: z.boolean(),
    });

    const parsedBody = createAgentSchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
    }

    const credentials = await httpAuth.credentials(req, {
      allow: ['user', 'service'],
    });
    const principal = credentials.principal;
    const createdBy =
      principal.type === 'user' ? principal.userEntityRef : 'service';

    const agent = await x2aDatabase.createAdversarialAgent({
      ...parsedBody.data,
      createdBy,
    });
    res.status(201).json(agent);
  });

  router.put('/adversarial-agents/:id', async (req, res) => {
    const endpoint = 'PUT /adversarial-agents/:id';
    const { id } = req.params;
    logger.info(`${endpoint} request received: id=${id}`);

    const decision = await authorize(
      req,
      [x2aAdminWritePermission],
      permissionsSvc,
      httpAuth,
    );
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError(
        'You are not allowed to update adversarial agents',
      );
    }

    const updateAgentSchema = z.object({
      name: z.string().min(3).max(100),
      prompt: z.string().min(50).max(5000),
      phases: z.array(z.enum(['analyze', 'migrate'])).min(1),
      critical: z.boolean(),
    });

    const parsedBody = updateAgentSchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
    }

    const agent = await x2aDatabase.updateAdversarialAgent({
      id,
      ...parsedBody.data,
    });
    if (!agent) {
      throw new NotFoundError('Adversarial agent not found');
    }

    res.json(agent);
  });

  router.delete('/adversarial-agents/:id', async (req, res) => {
    const endpoint = 'DELETE /adversarial-agents/:id';
    const { id } = req.params;
    logger.info(`${endpoint} request received: id=${id}`);

    const decision = await authorize(
      req,
      [x2aAdminWritePermission],
      permissionsSvc,
      httpAuth,
    );
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError(
        'You are not allowed to delete adversarial agents',
      );
    }

    const deletedCount = await x2aDatabase.deleteAdversarialAgent({ id });
    if (deletedCount === 0) {
      throw new NotFoundError('Adversarial agent not found');
    }

    res.status(204).send();
  });
}
