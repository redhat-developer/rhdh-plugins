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

import type {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';

export interface AgentApprovalConfig {
  enabled: boolean;
  serviceUrl?: string;
  workflowId: string;
}

interface WorkflowStartInput {
  agentId: string;
  agentName: string;
  requestedBy: string;
  action: 'publish' | 'unpublish';
  currentStage: string;
  targetStage: string;
}

interface WorkflowInstanceInfo {
  id: string;
  processId: string;
  state: number;
}

/**
 * Service that integrates with SonataFlow for agent lifecycle approvals.
 * Supports dual-mode: when enabled, transitions go through SonataFlow;
 * when disabled, transitions happen immediately (built-in mode).
 */
export class AgentApprovalWorkflowService {
  private readonly config: AgentApprovalConfig;
  private readonly logger: LoggerService;

  constructor(rootConfig: RootConfigService, logger: LoggerService) {
    this.logger = logger;
    this.config = AgentApprovalWorkflowService.loadConfig(rootConfig);
    if (this.config.enabled) {
      this.logger.info(
        `Agent approval workflow enabled: serviceUrl=${this.config.serviceUrl}, workflowId=${this.config.workflowId}`,
      );
    } else {
      this.logger.info(
        'Agent approval workflow disabled -- transitions are immediate',
      );
    }
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  async startWorkflow(input: WorkflowStartInput): Promise<string | undefined> {
    if (!this.config.enabled || !this.config.serviceUrl) {
      return undefined;
    }

    const url = `${this.config.serviceUrl}/${this.config.workflowId}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        this.logger.warn(
          `Failed to start approval workflow: ${response.status} ${detail}`,
        );
        return undefined;
      }

      const data = (await response.json()) as WorkflowInstanceInfo;
      this.logger.info(
        `Started approval workflow ${data.id} for agent ${input.agentId} (${input.action})`,
      );
      return data.id;
    } catch (err) {
      this.logger.warn(
        `Failed to start approval workflow: ${err instanceof Error ? err.message : String(err)}`,
      );
      return undefined;
    }
  }

  async sendDecision(
    instanceId: string,
    approved: boolean,
    decidedBy: string,
    reason?: string,
  ): Promise<void> {
    if (!this.config.enabled || !this.config.serviceUrl) {
      return;
    }

    const cloudEvent = {
      specversion: '1.0',
      id: `decision-${instanceId}-${Date.now()}`,
      source: 'augment.admin',
      type: 'io.rhdhorchestrator.agent.approval.decision',
      kogitoprocrefid: instanceId,
      data: { approved, decidedBy, reason },
    };

    const url = `${this.config.serviceUrl}/${this.config.workflowId}/${instanceId}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/cloudevents+json',
        },
        body: JSON.stringify(cloudEvent),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        this.logger.warn(
          `Failed to send approval decision: ${response.status} ${detail}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Failed to send approval decision: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async cancelWorkflow(instanceId: string): Promise<void> {
    if (!this.config.enabled || !this.config.serviceUrl) {
      return;
    }

    const url = `${this.config.serviceUrl}/management/processes/${this.config.workflowId}/instances/${instanceId}`;
    try {
      const response = await fetch(url, { method: 'DELETE' });
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        this.logger.warn(
          `Failed to cancel workflow ${instanceId}: ${response.status} ${detail}`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Failed to cancel workflow ${instanceId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  private static loadConfig(
    rootConfig: RootConfigService,
  ): AgentApprovalConfig {
    const section = rootConfig.getOptionalConfig('augment.agentApproval');
    if (!section) {
      return { enabled: false, workflowId: 'agentApproval' };
    }

    return {
      enabled: section.getOptionalBoolean('enabled') ?? false,
      serviceUrl: section.getOptionalString('serviceUrl'),
      workflowId: section.getOptionalString('workflowId') ?? 'agentApproval',
    };
  }
}
