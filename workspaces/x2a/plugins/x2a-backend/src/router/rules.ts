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

export function registerRuleRoutes(
  router: express.Router,
  deps: RouterDeps,
): void {
  const { httpAuth, x2aDatabase, logger, permissionsSvc } = deps;

  router.get('/rules', async (req, res) => {
    const endpoint = 'GET /rules';
    logger.info(`${endpoint} request received`);

    await useEnforceX2APermissions({
      req,
      readOnly: true,
      permissionsSvc,
      httpAuth,
    });

    const rules = await x2aDatabase.listRules();
    res.json({ items: rules });
  });

  router.get('/rules/:ruleId', async (req, res) => {
    const endpoint = 'GET /rules/:ruleId';
    const { ruleId } = req.params;
    logger.info(`${endpoint} request received: ruleId=${ruleId}`);

    await useEnforceX2APermissions({
      req,
      readOnly: true,
      permissionsSvc,
      httpAuth,
    });

    const rule = await x2aDatabase.getRule({ id: ruleId });
    if (!rule) {
      throw new NotFoundError('Rule not found');
    }

    res.json(rule);
  });

  router.post('/rules', async (req, res) => {
    const endpoint = 'POST /rules';
    logger.info(`${endpoint} request received`);

    const decision = await authorize(
      req,
      [x2aAdminWritePermission],
      permissionsSvc,
      httpAuth,
    );
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError('You are not allowed to create rules');
    }

    const createRuleSchema = z.object({
      title: z.string(),
      description: z.string(),
      required: z.boolean().optional(),
    });

    const parsedBody = createRuleSchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
    }

    const rule = await x2aDatabase.createRule(parsedBody.data);
    res.status(201).json(rule);
  });

  router.put('/rules/:ruleId', async (req, res) => {
    const endpoint = 'PUT /rules/:ruleId';
    const { ruleId } = req.params;
    logger.info(`${endpoint} request received: ruleId=${ruleId}`);

    const decision = await authorize(
      req,
      [x2aAdminWritePermission],
      permissionsSvc,
      httpAuth,
    );
    if (decision.result === AuthorizeResult.DENY) {
      throw new NotAllowedError('You are not allowed to update rules');
    }

    const updateRuleSchema = z.object({
      title: z.string(),
      description: z.string(),
      required: z.boolean(),
    });

    const parsedBody = updateRuleSchema.safeParse(req.body);
    if (!parsedBody.success) {
      throw new InputError(`Invalid body ${endpoint}: ${parsedBody.error}`);
    }

    const rule = await x2aDatabase.updateRule({
      id: ruleId,
      ...parsedBody.data,
    });
    if (!rule) {
      throw new NotFoundError('Rule not found');
    }

    res.json(rule);
  });
}
