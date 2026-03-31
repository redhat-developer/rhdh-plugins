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

import type { RequestHandler } from 'express';
import type { RouterOptions } from '../models/RouterOptions';
import { authorize } from '../util/checkPermissions';
import { rosApplyPermissions } from '@red-hat-developer-hub/plugin-cost-management-common/permissions';
import { AuthorizeResult } from '@backstage/plugin-permission-common';
import { resolveActor, emitAuditLog } from '../util/auditLog';

const ALLOWED_RESOURCE_TYPES = new Set([
  'deployment',
  'replicaset',
  'daemonset',
  'statefulset',
  'deploymentconfig',
  'replicationcontroller',
]);

interface ApplyRecommendationBody {
  workflowId: string;
  inputData: {
    clusterName: string;
    resourceType: string;
    resourceNamespace: string;
    resourceName: string;
    containerName: string;
    containerResources: {
      limits?: { cpu?: number; memory?: number };
      requests?: { cpu?: number; memory?: number };
    };
  };
}

function validateBody(
  body: unknown,
):
  | { valid: true; data: ApplyRecommendationBody }
  | { valid: false; error: string } {
  const b = body as ApplyRecommendationBody;

  if (!b?.workflowId || typeof b.workflowId !== 'string') {
    return { valid: false, error: 'Missing or invalid workflowId' };
  }

  const input = b.inputData;
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Missing inputData' };
  }

  if (!input.resourceType || !ALLOWED_RESOURCE_TYPES.has(input.resourceType)) {
    return {
      valid: false,
      error: `Invalid resourceType: ${
        input.resourceType ?? 'undefined'
      }. Allowed: ${[...ALLOWED_RESOURCE_TYPES].join(', ')}`,
    };
  }

  for (const field of [
    'clusterName',
    'resourceNamespace',
    'resourceName',
    'containerName',
  ] as const) {
    if (!input[field] || typeof input[field] !== 'string') {
      return { valid: false, error: `Missing or invalid ${field}` };
    }
  }

  if (
    !input.containerResources ||
    typeof input.containerResources !== 'object'
  ) {
    return { valid: false, error: 'Missing containerResources' };
  }

  return { valid: true, data: b };
}

/**
 * Backend endpoint that validates inputs, checks ros.apply permission,
 * and forwards the workflow execution to the Orchestrator plugin.
 */
export const applyRecommendation: (options: RouterOptions) => RequestHandler =
  options => async (req, res) => {
    const { logger, httpAuth, permissions, discovery, auth } = options;

    const validation = validateBody(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const { workflowId, inputData } = validation.data;

    const actor = await resolveActor(req, options);

    const decision = await authorize(
      req,
      rosApplyPermissions,
      permissions,
      httpAuth,
    );
    if (decision.result !== AuthorizeResult.ALLOW) {
      emitAuditLog(options, {
        actor,
        action: 'apply_recommendation',
        resource: `/apply-recommendation/${workflowId}`,
        decision: 'DENY',
        meta: {
          workflowId,
          cluster: inputData.clusterName,
          namespace: inputData.resourceNamespace,
          workload: inputData.resourceName,
          resourceType: inputData.resourceType,
        },
      });
      return res
        .status(403)
        .json({ error: 'Access denied: ros.apply permission required' });
    }

    try {
      const orchestratorBase = await discovery.getBaseUrl('orchestrator');
      const { token } = await auth.getPluginRequestToken({
        onBehalfOf: await httpAuth.credentials(req),
        targetPluginId: 'orchestrator',
      });

      const executeUrl = `${orchestratorBase}/v2/workflows/${encodeURIComponent(
        workflowId,
      )}/execute`;

      const upstreamResponse = await fetch(executeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inputData: {
            clusterName: inputData.clusterName,
            resourceType: inputData.resourceType,
            resourceNamespace: inputData.resourceNamespace,
            resourceName: inputData.resourceName,
            containerName: inputData.containerName,
            containerResources: inputData.containerResources,
          },
        }),
      });

      const contentType = upstreamResponse.headers.get('content-type') || '';
      let payload: unknown;
      try {
        payload = contentType.includes('application/json')
          ? await upstreamResponse.json()
          : { message: await upstreamResponse.text() };
      } catch {
        payload = { error: 'Upstream returned unparseable response' };
      }

      if (!upstreamResponse.ok) {
        emitAuditLog(options, {
          actor,
          action: 'apply_recommendation',
          resource: `/apply-recommendation/${workflowId}`,
          decision: 'ALLOW',
          meta: {
            workflowId,
            cluster: inputData.clusterName,
            namespace: inputData.resourceNamespace,
            workload: inputData.resourceName,
            resourceType: inputData.resourceType,
            upstreamStatus: upstreamResponse.status,
            outcome: 'upstream_error',
          },
        });
        return res.status(upstreamResponse.status).json(payload);
      }

      emitAuditLog(options, {
        actor,
        action: 'apply_recommendation',
        resource: `/apply-recommendation/${workflowId}`,
        decision: 'ALLOW',
        meta: {
          workflowId,
          instanceId: (payload as { id?: string }).id,
          cluster: inputData.clusterName,
          namespace: inputData.resourceNamespace,
          workload: inputData.resourceName,
          resourceType: inputData.resourceType,
          outcome: 'success',
        },
      });

      return res.status(200).json(payload);
    } catch (error) {
      logger.error('Apply recommendation proxy error', error);
      return res
        .status(500)
        .json({ error: 'Internal error executing workflow' });
    }
  };
