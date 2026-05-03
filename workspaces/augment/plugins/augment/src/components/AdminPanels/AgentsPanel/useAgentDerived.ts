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
import { useMemo } from 'react';
import {
  type AgentFormData,
  type PublishAsRole,
  deriveAgentRole,
  validateAgents,
  getTabCompletionStatus,
} from './agentValidation';
import type { TopologyEdge } from './TopologyGraph';

export function useAgentDerived(
  agents: Record<string, AgentFormData>,
  selectedAgentKey: string | null,
  defaultAgentKey: string,
  availableMcpServerIds?: string[],
) {
  const agentKeys = useMemo(() => Object.keys(agents), [agents]);

  const selectedAgent = selectedAgentKey
    ? (agents[selectedAgentKey] ?? null)
    : null;

  const selectedAgentRole: PublishAsRole = useMemo(
    () =>
      selectedAgentKey ? deriveAgentRole(selectedAgentKey, agents) : 'standalone',
    [selectedAgentKey, agents],
  );

  const showConnections = selectedAgentRole !== 'standalone';

  const validation = useMemo(
    () => validateAgents(agents, defaultAgentKey, availableMcpServerIds),
    [agents, defaultAgentKey, availableMcpServerIds],
  );

  const tabCompletion = useMemo(
    () => (selectedAgent ? getTabCompletionStatus(selectedAgent) : null),
    [selectedAgent],
  );

  const topologyEdges = useMemo((): TopologyEdge[] => {
    const edges: TopologyEdge[] = [];
    for (const key of agentKeys) {
      const a = agents[key];
      for (const h of a.handoffs)
        if (agents[h]) edges.push({ from: key, to: h, type: 'handoff' });
      for (const t of a.asTools)
        if (agents[t]) edges.push({ from: key, to: t, type: 'subtask' });
    }
    return edges;
  }, [agents, agentKeys]);

  const agentRoles = useMemo(() => {
    const roles: Record<string, PublishAsRole> = {};
    for (const key of agentKeys) {
      roles[key] = deriveAgentRole(key, agents);
    }
    return roles;
  }, [agents, agentKeys]);

  const edgeCounts = useMemo(() => {
    const counts: Record<string, { in: number; out: number }> = {};
    for (const key of agentKeys) {
      const a = agents[key];
      counts[key] = {
        out:
          a.handoffs.filter(h => agents[h]).length +
          a.asTools.filter(t => agents[t]).length,
        in: 0,
      };
    }
    for (const key of agentKeys) {
      const a = agents[key];
      for (const h of a.handoffs) if (counts[h]) counts[h].in++;
      for (const t of a.asTools) if (counts[t]) counts[t].in++;
    }
    return counts;
  }, [agents, agentKeys]);

  return {
    agentKeys,
    selectedAgent,
    selectedAgentRole,
    showConnections,
    validation,
    tabCompletion,
    topologyEdges,
    agentRoles,
    edgeCounts,
  };
}
