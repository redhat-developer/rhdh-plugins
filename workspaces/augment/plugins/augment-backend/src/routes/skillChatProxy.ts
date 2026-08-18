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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { Config } from '@backstage/config';
import type { ChatAgentConfig } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AdminConfigService } from '../services/AdminConfigService';
import { resolveK8sCredentials } from './k8sCredentials';
import { SseHeartbeat } from './sseRouteHelpers';
import type { FlushableResponse } from './types';

async function loadChatAgentConfigs(
  adminConfig: AdminConfigService,
): Promise<ChatAgentConfig[]> {
  const raw = await adminConfig.get('chatAgents');
  if (Array.isArray(raw)) return raw as ChatAgentConfig[];
  return [];
}

function findSkillAgent(
  configs: ChatAgentConfig[],
  model: string | undefined,
): ChatAgentConfig | undefined {
  if (!model) return undefined;
  return configs.find(
    c => c.chatEndpoint && (c.agentId === model || c.displayName === model),
  );
}

/**
 * Proxy a chat request to a skill agent's direct endpoint.
 * Returns true if the request was handled (proxied), false if not a skill agent.
 */
export async function trySkillChatProxy(opts: {
  model: string | undefined;
  messages: Array<{ role: string; content: string }>;
  adminConfig: AdminConfigService;
  config: Config;
  logger: LoggerService;
  res: FlushableResponse;
  signal?: AbortSignal;
}): Promise<boolean> {
  const { model, messages, adminConfig, config, logger, res, signal } = opts;
  const configs = await loadChatAgentConfigs(adminConfig);
  const skillAgent = findSkillAgent(configs, model);
  if (!skillAgent?.chatEndpoint) return false;

  // Resolve fetch URL: use K8s API service proxy when OpenShift credentials
  // are available (works from local dev), fall back to direct in-cluster URL.
  let fetchUrl = `${skillAgent.chatEndpoint}/v1/chat/completions`;
  const fetchHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const k8sCreds = await resolveK8sCredentials(config, adminConfig);
  const agentNs = (skillAgent as unknown as Record<string, unknown>)
    .namespace as string | undefined;

  if (k8sCreds && agentNs) {
    const k8sApiUrl = k8sCreds.apiUrl;
    const k8sToken = k8sCreds.token;
    const svcName = skillAgent.agentId.includes('/')
      ? skillAgent.agentId.split('/').pop()!
      : skillAgent.agentId;
    fetchUrl = `${k8sApiUrl}/api/v1/namespaces/${agentNs}/services/${svcName}:8000/proxy/v1/chat/completions`;
    fetchHeaders.Authorization = `Bearer ${k8sToken}`;
    logger.info(
      `Skill chat proxy: routing "${model}" via K8s service proxy to ${agentNs}/${svcName}`,
    );
  } else {
    logger.info(`Skill chat proxy: routing "${model}" directly to ${fetchUrl}`);
  }

  const heartbeat = new SseHeartbeat(res);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  heartbeat.start();

  try {
    const { Agent } = await import('undici');
    const dispatcher = new Agent({
      connect: { rejectUnauthorized: false },
    });

    const fetchOpts: RequestInit & { dispatcher?: unknown } = {
      method: 'POST',
      headers: fetchHeaders,
      body: JSON.stringify({ messages, stream: true }),
      signal,
    };
    fetchOpts.dispatcher = dispatcher;
    const upstream = await fetch(fetchUrl, fetchOpts as RequestInit);

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '');
      const errEvent = JSON.stringify({
        type: 'stream.error',
        error: `Skill agent returned ${upstream.status}: ${detail.slice(0, 200)}`,
      });
      res.write(`data: ${errEvent}\n\n`);
      res.end();
      heartbeat.stop();
      return true;
    }

    if (!upstream.body) {
      res.write(
        `data: ${JSON.stringify({ type: 'stream.error', error: 'No response body' })}\n\n`,
      );
      res.end();
      heartbeat.stop();
      return true;
    }

    res.write(
      `data: ${JSON.stringify({ type: 'stream.started', responseId: `skill-${Date.now()}` })}\n\n`,
    );

    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') continue;

        try {
          const chunk = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            res.write(
              `data: ${JSON.stringify({ type: 'stream.text.delta', delta: content })}\n\n`,
            );
            (res as FlushableResponse).flush?.();
          }
        } catch {
          logger.debug(
            `Skill proxy: unparseable SSE chunk: ${payload.slice(0, 100)}`,
          );
        }
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'stream.completed' })}\n\n`);
  } catch (err) {
    if (signal?.aborted) {
      logger.debug('Skill chat proxy aborted by client');
    } else {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`Skill chat proxy error: ${msg}`);
      res.write(
        `data: ${JSON.stringify({ type: 'stream.error', error: msg })}\n\n`,
      );
    }
  } finally {
    heartbeat.stop();
    res.end();
  }

  return true;
}
