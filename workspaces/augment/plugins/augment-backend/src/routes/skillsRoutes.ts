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
import { createWithRoute } from './routeWrapper';
import type { RouteContext } from './types';

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

export function registerSkillsRoutes(ctx: RouteContext): void {
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
          ].sort();
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
}
