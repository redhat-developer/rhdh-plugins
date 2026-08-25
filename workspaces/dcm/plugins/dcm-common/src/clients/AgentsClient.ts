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

import type { PaginationParams } from '../types/common';
import type {
  Agent,
  AgentHealthStatus,
  AgentList,
  AgentRegistrationRequest,
  HeartbeatRequest,
} from '../types/agents';
import { buildPaginationQuery } from '../utils/buildPaginationQuery';
import type { AgentsApi } from './AgentsApi';
import { DcmBaseClient } from './DcmBaseClient';

/**
 * Calls the DCM Agents API through the dcm-backend secure proxy.
 *
 * All requests are sent to `/api/dcm/proxy/<path>` where the backend
 * strips the `/proxy` prefix and forwards to:
 *   `{dcm.apiUrl}/api/v1alpha1/<path>`
 *
 * @public
 */
export class AgentsClient extends DcmBaseClient implements AgentsApi {
  protected readonly serviceName = 'Agents';

  async listAgents(
    params: PaginationParams & { health_status?: AgentHealthStatus } = {},
  ): Promise<AgentList> {
    const { health_status, ...pagination } = params;
    let query = buildPaginationQuery(pagination);
    if (health_status) {
      const sep = query ? '&' : '?';
      query += `${sep}health_status=${encodeURIComponent(health_status)}`;
    }
    return this.fetch<AgentList>(`agents${query}`);
  }

  async getAgent(agentId: string): Promise<Agent> {
    return this.fetch<Agent>(`agents/${agentId}`);
  }

  async createAgent(agent: AgentRegistrationRequest): Promise<Agent> {
    return this.fetch<Agent>('agents', {
      method: 'POST',
      body: JSON.stringify(agent),
    });
  }

  async agentHeartbeat(
    agentId: string,
    heartbeat: HeartbeatRequest,
  ): Promise<Agent> {
    return this.fetch<Agent>(`agents/${agentId}/heartbeat`, {
      method: 'PUT',
      body: JSON.stringify(heartbeat),
    });
  }
}
