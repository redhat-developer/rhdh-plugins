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
import type {
  SkillAgentManifestInput,
  SkillRef,
} from './skillsManifestBuilder';
import { resolveK8sCredentials } from './k8sCredentials';

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
      const data = (await response.json()) as {
        skills?: Array<Record<string, unknown>>;
      };
      const skills = (data.skills ?? []).map(s => ({
        ...s,
        domain: (s.pluginName as string) ?? (s.domain as string),
      }));
      res.json({ skills, configured: true, total: skills.length });
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
            skills?: Array<{ domain?: string; pluginName?: string }>;
          };
          const domains = [
            ...new Set(
              (data.skills ?? [])
                .map(s => s.pluginName ?? s.domain)
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
    withRoute(
      'POST /agents/from-skills',
      'Failed to deploy skill agent',
      async (req, res) => {
        const body = req.body as {
          name?: string;
          runtime?: string;
          skills?: SkillRef[];
          systemPrompt?: string;
          llmModel?: string;
          namespace?: string;
        };
        const { name, runtime, skills, systemPrompt, llmModel } = body;
        let namespace = body.namespace;

        if (
          !name ||
          !runtime ||
          !Array.isArray(skills) ||
          skills.length === 0
        ) {
          throw new InputError('name, runtime, and skills[] are required');
        }

        const userRef = await ctx.getUserRef(req);
        if (!namespace) {
          const match = userRef.match(/^user:[^/]+\/(.+)$/);
          const username = match ? match[1] : 'default';
          namespace = `${username.toLocaleLowerCase('en-US').replace(/[^a-z0-9-]/g, '-')}-agents`;
        }

        const runtimeEntry = skillsConfig.runtimes.find(
          rt => rt.id === runtime,
        );
        const runtimeImage =
          runtimeEntry?.image ?? 'ghcr.io/redhat-et/docsclaw:latest';

        const agentName = name
          .toLocaleLowerCase('en-US')
          .replace(/[^a-z0-9-]/g, '-');

        const input: SkillAgentManifestInput = {
          name: agentName,
          namespace,
          runtime,
          skills,
          systemPrompt: systemPrompt ?? '',
          llmModel: llmModel ?? skillsConfig.llmModel ?? 'granite-3.3-8b',
          runtimeImage,
          llmBaseUrl: skillsConfig.llmBaseUrl,
          llmProvider: 'openai',
        };

        const manifests = generateSkillAgentManifests(input);
        const chatEndpoint = `http://${agentName}.${namespace}.svc:8000`;

        // --- K8s apply via OpenShift credentials ---
        let deployed = false;
        if (adminConfig) {
          const k8sCreds = await resolveK8sCredentials(config, adminConfig);

          if (k8sCreds) {
            const k8sApiUrl = k8sCreds.apiUrl;
            const k8sToken = k8sCreds.token;
            const { Agent } = await import('undici');
            const dispatcher = new Agent({
              connect: { rejectUnauthorized: false },
            });
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${k8sToken}`,
            };
            const fetchOpts = { dispatcher } as RequestInit;

            // 1. Ensure namespace
            const nsResp = await fetch(
              `${k8sApiUrl}/api/v1/namespaces/${namespace}`,
              { headers, ...fetchOpts },
            );
            if (nsResp.status === 404) {
              await fetch(`${k8sApiUrl}/api/v1/namespaces`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  apiVersion: 'v1',
                  kind: 'Namespace',
                  metadata: { name: namespace },
                }),
                ...fetchOpts,
              });
              logger.info(`Created namespace ${namespace}`);
            }

            // 2. Create LLM secret if missing
            const secretName = `${agentName}-llm-secret`;
            const secResp = await fetch(
              `${k8sApiUrl}/api/v1/namespaces/${namespace}/secrets/${secretName}`,
              { headers, ...fetchOpts },
            );
            if (secResp.status === 404) {
              await fetch(
                `${k8sApiUrl}/api/v1/namespaces/${namespace}/secrets`,
                {
                  method: 'POST',
                  headers,
                  body: JSON.stringify(manifests.secret),
                  ...fetchOpts,
                },
              );
              logger.info(`Created secret ${secretName} in ${namespace}`);
            }

            // 3. Apply ConfigMap
            await fetch(
              `${k8sApiUrl}/api/v1/namespaces/${namespace}/configmaps`,
              {
                method: 'POST',
                headers,
                body: JSON.stringify(manifests.configMap),
                ...fetchOpts,
              },
            );

            // 4. Apply Service
            await fetch(
              `${k8sApiUrl}/api/v1/namespaces/${namespace}/services`,
              {
                method: 'POST',
                headers,
                body: JSON.stringify(manifests.service),
                ...fetchOpts,
              },
            );

            // 5. Apply Deployment
            const depResp = await fetch(
              `${k8sApiUrl}/apis/apps/v1/namespaces/${namespace}/deployments`,
              {
                method: 'POST',
                headers,
                body: JSON.stringify(manifests.deployment),
                ...fetchOpts,
              },
            );
            deployed = depResp.ok;
            logger.info(
              `Applied K8s manifests for ${agentName} in ${namespace}: deployment=${depResp.status}`,
            );
          } else {
            logger.info(
              'No devSpaces credentials configured; returning manifests only',
            );
          }

          // E6: Register agent in governance
          try {
            const raw = await adminConfig.get('chatAgents');
            const configs: ChatAgentConfig[] = Array.isArray(raw)
              ? (raw as ChatAgentConfig[])
              : [];

            const agentId = agentName;
            const existing = configs.find(c => c.agentId === agentId);

            if (!existing) {
              configs.push({
                agentId,
                published: false,
                visible: false,
                featured: false,
                lifecycleStage: 'draft',
                version: 0,
                createdBy: userRef,
                createdAt: new Date().toISOString(),
                chatEndpoint,
                namespace,
                displayName: name,
                description: `Skill-based agent with ${skills.length} skills`,
                framework: 'docsclaw',
              } as ChatAgentConfig);
              await adminConfig.set('chatAgents', configs, userRef);
              logger.info(
                `Skill agent "${agentId}" registered in governance (draft)`,
              );
            }
          } catch (err) {
            logger.warn(
              `Failed to register skill agent: ${err instanceof Error ? err.message : String(err)}`,
            );
          }
        }

        res.status(201).json({
          success: true,
          deployed,
          agentName,
          namespace,
          chatEndpoint,
          skillCount: skills.length,
          manifests,
        });
      },
    ),
  );

  // ---------------------------------------------------------------------------
  // GET /skills/agents/:agentId/info -- live pod info (health, models, skills,
  // system prompt) fetched from the running DocsClaw agent via K8s API.
  // ---------------------------------------------------------------------------
  router.get(
    '/skills/agents/:agentId/info',
    withRoute(
      'GET /skills/agents/:agentId/info',
      'Failed to fetch skill agent info',
      async (req, res) => {
        const agentId = decodeURIComponent(req.params.agentId);
        if (!adminConfig) {
          res.json({ error: 'Admin config not available' });
          return;
        }

        const raw = await adminConfig.get('chatAgents');
        const configs = Array.isArray(raw) ? (raw as ChatAgentConfig[]) : [];
        const cfg = configs.find(c => c.agentId === agentId);
        if (!cfg?.chatEndpoint) {
          res.json({ error: 'Agent not found or no endpoint configured' });
          return;
        }

        const cfgAny = cfg as unknown as Record<string, unknown>;
        const ns = cfgAny.namespace as string | undefined;
        const agentName = agentId.includes('/')
          ? agentId.split('/').pop()!
          : agentId;

        const k8sCreds = await resolveK8sCredentials(config, adminConfig);

        if (!k8sCreds || !ns) {
          res.json({
            agentId,
            chatEndpoint: cfg.chatEndpoint,
            info: 'K8s credentials or namespace not available',
          });
          return;
        }

        const { Agent } = await import('undici');
        const dispatcher = new Agent({
          connect: { rejectUnauthorized: false },
        });
        const headers: Record<string, string> = {
          Authorization: `Bearer ${k8sCreds.token}`,
          Accept: 'application/json',
        };
        const fetchOpts = { dispatcher } as RequestInit;
        const proxyBase = `${k8sCreds.apiUrl}/api/v1/namespaces/${ns}/services/${agentName}:8000/proxy`;

        const fetchJson = async (path: string) => {
          try {
            const r = await fetch(`${proxyBase}${path}`, {
              headers,
              signal: AbortSignal.timeout(8000),
              ...fetchOpts,
            });
            if (!r.ok) return { error: `${r.status}` };
            return await r.json();
          } catch (err) {
            return {
              error: err instanceof Error ? err.message : 'unreachable',
            };
          }
        };

        const fetchText = async (url: string) => {
          try {
            const r = await fetch(url, {
              headers,
              signal: AbortSignal.timeout(8000),
              ...fetchOpts,
            });
            if (!r.ok) return undefined;
            return await r.text();
          } catch {
            return undefined;
          }
        };

        const [health, models, skills, systemPrompt] = await Promise.all([
          fetchJson('/health'),
          fetchJson('/v1/models'),
          fetchJson('/v1/skills'),
          fetchText(
            `${k8sCreds.apiUrl}/api/v1/namespaces/${ns}/configmaps/${agentName}-config`,
          ),
        ]);

        let systemPromptText: string | undefined;
        if (systemPrompt) {
          try {
            const cm = JSON.parse(systemPrompt) as {
              data?: Record<string, string>;
            };
            systemPromptText = cm.data?.['system-prompt.txt'];
          } catch {
            logger.debug('Failed to parse configmap for system prompt');
          }
        }

        res.json({
          agentId,
          namespace: ns,
          chatEndpoint: cfg.chatEndpoint,
          health,
          models,
          skills,
          systemPrompt: systemPromptText,
        });
      },
    ),
  );
}
