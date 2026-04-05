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
import type { AgentWithCard } from './agentUtils';

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
        const { agents: agentList } = await api.listKagentiAgents(undefined, {
          includeCards: true,
        });
        if (myNonce !== nonceRef.current) return;
        setAgents(agentList as AgentWithCard[]);
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
