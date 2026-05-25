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

import type { Config } from '@backstage/config';
import type { ChatAgentConfig } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { InputError } from '@backstage/errors';
import { createWithRoute } from './routeWrapper';
import type { RouteContext } from './types';
import type { AdminConfigService } from '../services/AdminConfigService';
import { generateSkillAgentManifests } from './skillsManifestBuilder';
import type { SkillAgentManifestInput } from './skillsManifestBuilder';

function loadSkillsConfig(config: Config) {
  const section = config.getOptionalConfig('augment.skillsMarketplace');
  if (!section) return undefined;

  return {
    baseUrl: section.getString('baseUrl'),
    agentImage: section.getOptionalString('agentImage'),
    advisorUrl: section.getOptionalString('advisorUrl'),
    llmBaseUrl: section.getOptionalString('llmBaseUrl'),
    llmModel: section.getOptionalString('llmModel'),
    runtimes: (section.getOptionalConfigArray('runtimes') ?? []).map(rt => ({
      id: rt.getString('id'),
      name: rt.getString('name'),
      description: rt.getOptionalString('description') ?? '',
      image: rt.getOptionalString('image'),
      language: rt.getOptionalString('language'),
      footprint: rt.getOptionalString('footprint'),
      features: rt.getOptionalStringArray('features'),
      status: rt.getOptionalString('status') ?? 'available',
    })),
  };
}

export function registerSkillsRoutes(
  ctx: RouteContext,
  adminConfig?: AdminConfigService,
): void {
  const { router, logger, sendRouteError, config } = ctx;
  const withRoute = createWithRoute(logger, sendRouteError);
  const skillsConfig = loadSkillsConfig(config);

  if (!skillsConfig) {
    logger.info(
      'Skills marketplace not configured (augment.skillsMarketplace missing), skipping routes',
    );
    return;
  }

  router.get(
    '/skills',
    withRoute('GET /skills', 'Failed to fetch skills', async (_req, res) => {
      const response = await fetch(skillsConfig.baseUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        res.status(response.status).json({
          error: `Skills marketplace returned ${response.status}`,
        });
        return;
      }
      const data = await response.json();
      res.json(data);
    }),
  );

  router.get(
    '/skills/runtimes',
    withRoute(
      'GET /skills/runtimes',
      'Failed to fetch runtimes',
      async (_req, res) => {
        res.json({ runtimes: skillsConfig.runtimes });
      },
    ),
  );

  router.get(
    '/skills/domains',
    withRoute(
      'GET /skills/domains',
      'Failed to fetch skill domains',
      async (_req, res) => {
        try {
          const response = await fetch(skillsConfig.baseUrl, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(15_000),
          });
          if (!response.ok) {
            res.json({ domains: [] });
            return;
          }
          const data = (await response.json()) as {
            skills?: Array<{ domain?: string }>;
          };
          const domains = [
            ...new Set(
              (data.skills ?? [])
                .map(s => s.domain)
                .filter(
                  (d): d is string => typeof d === 'string' && d.length > 0,
                ),
            ),
          ].sort((a, b) => a.localeCompare(b, 'en-US'));
          res.json({ domains });
        } catch (err) {
          logger.warn(
            `Failed to extract skill domains: ${err instanceof Error ? err.message : String(err)}`,
          );
          res.json({ domains: [] });
        }
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // POST /agents/from-skills -- generate K8s manifests for a skill agent (E4/E5)
  // and register it in the governance lifecycle (E6)
  // ---------------------------------------------------------------------------
  router.post(
    '/agents/from-skills',
    ctx.requireAdminAccess,
    withRoute(
      'POST /agents/from-skills',
      'Failed to generate skill agent manifests',
      async (req, res) => {
        const { name, namespace, runtime, skills, systemPrompt, llmModel } =
          req.body as {
            name?: string;
            namespace?: string;
            runtime?: string;
            skills?: string[];
            systemPrompt?: string;
            llmModel?: string;
          };

        if (
          !name ||
          !namespace ||
          !runtime ||
          !Array.isArray(skills) ||
          skills.length === 0
        ) {
          throw new InputError(
            'name, namespace, runtime, and skills[] are required',
          );
        }

        const runtimeEntry = skillsConfig.runtimes.find(
          rt => rt.id === runtime,
        );
        const runtimeImage =
          runtimeEntry?.image ?? 'ghcr.io/redhat-et/docsclaw:latest';

        const registryBaseUrl = skillsConfig.baseUrl.replace(
          /\/v2\/.*$/,
          '/v2',
        );

        const input: SkillAgentManifestInput = {
          name: name.toLocaleLowerCase('en-US').replace(/[^a-z0-9-]/g, '-'),
          namespace,
          runtime,
          skills,
          systemPrompt: systemPrompt ?? '',
          llmModel: llmModel ?? skillsConfig.llmModel ?? 'granite-3.3-8b',
          runtimeImage,
          llmBaseUrl: skillsConfig.llmBaseUrl,
          llmProvider: 'openai',
          registryBaseUrl,
        };

        const manifests = generateSkillAgentManifests(input);

        // E6: Register agent in governance chatAgents config
        const chatEndpoint = `http://${input.name}.${namespace}.svc:8000`;
        if (adminConfig) {
          try {
            const userRef = await ctx.getUserRef(req);
            const raw = await adminConfig.get('chatAgents');
            const configs: ChatAgentConfig[] = Array.isArray(raw)
              ? (raw as ChatAgentConfig[])
              : [];

            const agentId = `${namespace}/${input.name}`;
            const existing = configs.find(c => c.agentId === agentId);
            const now = new Date().toISOString();

            if (!existing) {
              configs.push({
                agentId,
                published: false,
                visible: false,
                featured: false,
                lifecycleStage: 'draft',
                version: 0,
                createdBy: userRef,
                createdAt: now,
                chatEndpoint,
                displayName: name,
                description: `Skill agent (${skills.length} skills) on ${runtime}`,
              });
              await adminConfig.set('chatAgents', configs, userRef);
              logger.info(
                `Skill agent "${agentId}" registered in governance (draft) by ${userRef}`,
              );
            }
          } catch (err) {
            logger.warn(
              `Failed to register skill agent in governance: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }

        res.status(201).json({
          success: true,
          agentName: input.name,
          namespace,
          chatEndpoint,
          manifests,
        });
      },
    ),
  );
}
