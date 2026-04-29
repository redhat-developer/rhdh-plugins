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

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AugmentApi } from '../../api';
import type { ChatAgent } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AgentWithCard } from './agentUtils';

/**
 * Fetches agents from the provider-agnostic /agents endpoint and maps them
 * to the AgentWithCard shape expected by the gallery components.
 */
export function useAgentGalleryData(api: AugmentApi) {
  const [agents, setAgents] = useState<AgentWithCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const nonceRef = useRef(0);

  const fetchAgents = useCallback(() => {
    nonceRef.current += 1;
    const myNonce = nonceRef.current;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const chatAgents: ChatAgent[] = await api.listAgents({ published: true });

        const mapped: AgentWithCard[] = chatAgents.map(agent => {
          const [namespace, ...rest] = agent.id.includes('/')
            ? agent.id.split('/')
            : ['default', agent.id];
          const name = rest.join('/') || agent.id;
          return {
            name,
            namespace,
            description: agent.description ?? '',
            status: agent.status,
            labels: {
              framework: agent.framework,
              protocol: agent.protocols,
            },
            createdAt: agent.createdAt,
            agentCard: {
              name: agent.name,
              description: agent.description,
              version: '',
              url: '',
              streaming: true,
              skills: agent.starters?.length
                ? [{ name: 'default', examples: agent.starters }]
                : [],
            },
          };
        });

        if (myNonce !== nonceRef.current) return;
        setAgents(mapped);
      } catch (err) {
        if (myNonce !== nonceRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load agents');
      } finally {
        if (myNonce === nonceRef.current) setLoading(false);
      }
    })();

    return () => {
      nonceRef.current += 1;
    };
  }, [api]);

  useEffect(() => {
    return fetchAgents();
  }, [fetchAgents]);

  return { agents, loading, error, fetchAgents };
}
