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
import { InputError } from '@backstage/errors';
import { MAX_DESCRIPTION_LENGTH } from '../constants';
import { createWithRoute } from './routeWrapper';
import type { AdminRouteDeps } from './adminRouteTypes';

export function registerAdminModelRoutes(
  router: import('express').Router,
  deps: AdminRouteDeps,
): void {
  const { logger, sendRouteError } = deps;

  const withRoute = createWithRoute(logger, sendRouteError);

  router.get(
    '/admin/models',
    withRoute(
      'GET /admin/models',
      'Failed to list available models',
      async (_req, res) => {
        const modelSources: Array<Promise<Array<{ id: string; owned_by?: string; model_type?: string }>>> = [];

        if (deps.provider.listModels) {
          modelSources.push(
            deps.provider.listModels().catch(err => {
              logger.warn(`Primary provider model listing failed: ${err instanceof Error ? err.message : err}`);
              return [];
            }),
          );
        }

        if (deps.orchestrationProvider?.listModels) {
          modelSources.push(
            deps.orchestrationProvider.listModels().catch(err => {
              logger.warn(`Orchestration provider model listing failed: ${err instanceof Error ? err.message : err}`);
              return [];
            }),
          );
        }

        if (modelSources.length === 0) {
          res.status(501).json({
            success: false,
            error: 'Model listing not supported by any configured provider',
          });
          return;
        }

        const results = await Promise.all(modelSources);
        const seen = new Set<string>();
        const models: Array<{ id: string; owned_by?: string; model_type?: string }> = [];
        for (const batch of results) {
          for (const model of batch) {
            if (!seen.has(model.id)) {
              seen.add(model.id);
              models.push(model);
            }
          }
        }

        res.json({
          success: true,
          models,
          timestamp: new Date().toISOString(),
        });
      },
    ),
  );

  router.post(
    '/admin/test-model',
    withRoute(
      'POST /admin/test-model',
      'Failed to test model connection',
      async (req, res) => {
        if (!deps.provider.testModel) {
          res.status(501).json({
            success: false,
            error: 'Model testing not supported by current provider',
          });
          return;
        }

        const { model: requestedModel, baseUrl: requestedBaseUrl } =
          req.body as { model?: string; baseUrl?: string };
        if (
          requestedModel !== undefined &&
          typeof requestedModel !== 'string'
        ) {
          throw new InputError('model must be a string');
        }
        if (
          requestedBaseUrl !== undefined &&
          typeof requestedBaseUrl !== 'string'
        ) {
          throw new InputError('baseUrl must be a string');
        }

        const result = await deps.provider.testModel(
          requestedModel || undefined,
          requestedBaseUrl || undefined,
        );
        res.json({
          success: true,
          ...result,
          timestamp: new Date().toISOString(),
        });
      },
    ),
  );

  router.post(
    '/admin/generate-system-prompt',
    withRoute(
      'POST /admin/generate-system-prompt',
      'Failed to generate system prompt',
      async (req, res) => {
        const { description, model: requestedModel, capabilities } = req.body;
        if (
          typeof description !== 'string' ||
          description.trim().length === 0
        ) {
          throw new InputError('description must be a non-empty string');
        }
        if (description.length > MAX_DESCRIPTION_LENGTH) {
          throw new InputError(
            `description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
          );
        }
        if (
          requestedModel !== undefined &&
          typeof requestedModel !== 'string'
        ) {
          throw new InputError('model must be a string');
        }
        if (
          capabilities !== undefined &&
          (typeof capabilities !== 'object' || capabilities === null)
        ) {
          throw new InputError('capabilities must be an object');
        }

        if (!deps.provider.generateSystemPrompt) {
          res.status(501).json({
            success: false,
            error: 'System prompt generation not supported by current provider',
          });
          return;
        }

        const prompt = await deps.provider.generateSystemPrompt(
          description.trim(),
          requestedModel || undefined,
          capabilities || undefined,
        );

        res.json({
          success: true,
          prompt,
          timestamp: new Date().toISOString(),
        });
      },
    ),
  );
}
