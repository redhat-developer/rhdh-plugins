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

import { useCallback, useEffect, useState } from 'react';
import type { AugmentApi } from '../../api';
import type { AgentWithCard } from './agentUtils';

export function useAgentGalleryData(api: AugmentApi) {
  const [agents, setAgents] = useState<AgentWithCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchNonce, setRefetchNonce] = useState(0);

  const fetchAgents = useCallback(() => {
    setRefetchNonce(n => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const { agents: agentList } = await api.listKagentiAgents();
        if (cancelled) return;

        const enriched = await Promise.all(
          agentList.map(async (agent): Promise<AgentWithCard> => {
            try {
              const detail = await api.getKagentiAgent(
                agent.namespace,
                agent.name,
              );
              return { ...agent, agentCard: detail.agentCard };
            } catch {
              return agent;
            }
          }),
        );
        if (!cancelled) setAgents(enriched);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load agents',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [api, refetchNonce]);

  return { agents, loading, error, fetchAgents };
}
