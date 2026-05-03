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
import { InputError, NotFoundError } from '@backstage/errors';
import type {
  WorkflowDefinition,
  WorkflowVersion,
  WorkflowTestSuite,
  WorkflowEvaluationResult,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AdminConfigService } from './AdminConfigService';

/**
 * Manages workflow CRUD operations, versioning, and evaluation storage
 * by delegating to the existing AdminConfigService key-value store.
 *
 * Workflows are stored under the 'workflows' key as Record<string, WorkflowDefinition>.
 * Published versions are stored under 'workflowVersions' as Record<string, WorkflowVersion[]>.
 */
export class WorkflowConfigService {
  constructor(
    private readonly adminConfig: AdminConfigService,
    private readonly logger: LoggerService,
  ) {}

  // ---------------------------------------------------------------------------
  // Workflow CRUD
  // ---------------------------------------------------------------------------

  async listWorkflows(): Promise<WorkflowDefinition[]> {
    const record = await this.getWorkflowsRecord();
    return Object.values(record);
  }

  async getWorkflow(id: string): Promise<WorkflowDefinition> {
    const record = await this.getWorkflowsRecord();
    const wf = record[id];
    if (!wf) {
      throw new NotFoundError(`Workflow not found: ${id}`);
    }
    return wf;
  }

  async createWorkflow(
    workflow: WorkflowDefinition,
    user: string,
  ): Promise<WorkflowDefinition> {
    const record = await this.getWorkflowsRecord();
    if (record[workflow.id]) {
      throw new InputError(`Workflow already exists: ${workflow.id}`);
    }
    const now = new Date().toISOString();
    const created: WorkflowDefinition = {
      ...workflow,
      createdAt: now,
      updatedAt: now,
      createdBy: user,
      updatedBy: user,
      version: 0,
      status: 'draft',
    };
    record[workflow.id] = created;
    await this.saveWorkflowsRecord(record, user);
    this.logger.info(`Created workflow: ${workflow.id} (${workflow.name})`);
    return created;
  }

  async updateWorkflow(
    id: string,
    updates: Partial<WorkflowDefinition>,
    user: string,
  ): Promise<WorkflowDefinition> {
    const record = await this.getWorkflowsRecord();
    const existing = record[id];
    if (!existing) {
      throw new NotFoundError(`Workflow not found: ${id}`);
    }
    const updated: WorkflowDefinition = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
      updatedBy: user,
    };
    record[id] = updated;
    await this.saveWorkflowsRecord(record, user);
    return updated;
  }

  async deleteWorkflow(id: string, user: string): Promise<void> {
    const record = await this.getWorkflowsRecord();
    if (!record[id]) {
      throw new NotFoundError(`Workflow not found: ${id}`);
    }
    delete record[id];
    await this.saveWorkflowsRecord(record, user);

    const versions = await this.getVersionsRecord();
    delete versions[id];
    await this.saveVersionsRecord(versions, user);

    this.logger.info(`Deleted workflow: ${id}`);
  }

  // ---------------------------------------------------------------------------
  // Versioning
  // ---------------------------------------------------------------------------

  async publishWorkflow(
    id: string,
    user: string,
    changelog?: string,
  ): Promise<WorkflowVersion> {
    const workflow = await this.getWorkflow(id);
    this.validateWorkflowForPublish(workflow);

    const versions = await this.getVersionsRecord();
    const existing = versions[id] ?? [];
    const nextVersion = existing.length > 0
      ? Math.max(...existing.map(v => v.version)) + 1
      : 1;

    const published: WorkflowVersion = {
      version: nextVersion,
      publishedAt: new Date().toISOString(),
      publishedBy: user,
      changelog,
      definition: {
        ...workflow,
        version: nextVersion,
        status: 'published',
      },
    };

    versions[id] = [...existing, published];
    await this.saveVersionsRecord(versions, user);

    const record = await this.getWorkflowsRecord();
    record[id] = {
      ...workflow,
      version: nextVersion,
      status: 'published',
      updatedAt: new Date().toISOString(),
      updatedBy: user,
    };
    await this.saveWorkflowsRecord(record, user);

    this.logger.info(`Published workflow ${id} as version ${nextVersion}`);
    return published;
  }

  async getWorkflowVersions(id: string): Promise<WorkflowVersion[]> {
    const versions = await this.getVersionsRecord();
    return versions[id] ?? [];
  }

  async getWorkflowVersion(
    id: string,
    version?: number,
  ): Promise<WorkflowVersion> {
    const versions = await this.getWorkflowVersions(id);
    if (versions.length === 0) {
      throw new NotFoundError(`No published versions for workflow: ${id}`);
    }
    if (version !== undefined) {
      const found = versions.find(v => v.version === version);
      if (!found) {
        throw new NotFoundError(
          `Version ${version} not found for workflow: ${id}`,
        );
      }
      return found;
    }
    return versions[versions.length - 1];
  }

  async restoreVersion(
    id: string,
    version: number,
    user: string,
  ): Promise<WorkflowDefinition> {
    const snapshot = await this.getWorkflowVersion(id, version);
    return this.updateWorkflow(
      id,
      {
        ...snapshot.definition,
        status: 'draft',
      },
      user,
    );
  }

  // ---------------------------------------------------------------------------
  // Test Suites
  // ---------------------------------------------------------------------------

  async getTestSuites(workflowId: string): Promise<WorkflowTestSuite[]> {
    const record = await this.getTestSuitesRecord();
    return Object.values(record).filter(s => s.workflowId === workflowId);
  }

  async saveTestSuite(
    suite: WorkflowTestSuite,
    user: string,
  ): Promise<WorkflowTestSuite> {
    const record = await this.getTestSuitesRecord();
    const now = new Date().toISOString();
    record[suite.id] = {
      ...suite,
      updatedAt: now,
      createdAt: suite.createdAt || now,
    };
    await this.saveTestSuitesRecord(record, user);
    return record[suite.id];
  }

  async deleteTestSuite(id: string, user: string): Promise<void> {
    const record = await this.getTestSuitesRecord();
    delete record[id];
    await this.saveTestSuitesRecord(record, user);
  }

  // ---------------------------------------------------------------------------
  // Evaluation Results
  // ---------------------------------------------------------------------------

  async getEvaluations(
    workflowId: string,
  ): Promise<WorkflowEvaluationResult[]> {
    const record = await this.getEvaluationsRecord();
    return Object.values(record).filter(e => e.workflowId === workflowId);
  }

  async saveEvaluation(
    result: WorkflowEvaluationResult,
    user: string,
  ): Promise<void> {
    const record = await this.getEvaluationsRecord();
    record[result.evaluationId] = result;
    await this.saveEvaluationsRecord(record, user);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle Sync -- Align with ChatAgentConfig
  // ---------------------------------------------------------------------------

  /**
   * When a workflow is published, generate corresponding ChatAgentConfig
   * entries from the agent nodes so the existing chat infrastructure
   * (agent gallery, model routing, etc.) works seamlessly.
   *
   * Lifecycle mapping:
   *   draft -> 'draft' (ChatAgentConfig lifecycle)
   *   published -> 'deployed'
   *   archived -> 'draft' (hidden from gallery)
   */
  async syncWorkflowToChatAgents(
    workflowId: string,
    user: string,
  ): Promise<void> {
    const workflow = await this.getWorkflow(workflowId);
    const agentNodes = workflow.nodes.filter(n => n.type === 'agent');
    if (agentNodes.length === 0) return;

    const existingAgents =
      ((await this.adminConfig.get('chatAgents')) as Array<Record<string, unknown>>) ?? [];

    const workflowAgentIds = new Set<string>();

    for (const node of agentNodes) {
      const data = node.data as Record<string, unknown>;
      const agentId = `wf_${workflowId}_${node.id}`;
      workflowAgentIds.add(agentId);

      const lifecycleStage =
        workflow.status === 'published'
          ? 'deployed'
          : workflow.status === 'archived'
            ? 'draft'
            : 'draft';

      const chatAgent = {
        id: agentId,
        name: (data.name as string) || node.id,
        description: (data.handoffDescription as string) || '',
        model: (data.model as string) || workflow.settings.defaultModel,
        lifecycleStage,
        workflowId: workflow.id,
        workflowVersion: workflow.version,
        workflowNodeId: node.id,
      };

      const idx = existingAgents.findIndex(
        a => (a as Record<string, unknown>).id === agentId,
      );
      if (idx >= 0) {
        existingAgents[idx] = chatAgent;
      } else {
        existingAgents.push(chatAgent);
      }
    }

    await this.adminConfig.set('chatAgents', existingAgents, user);
    this.logger.info(
      `Synced ${workflowAgentIds.size} workflow agents to chatAgents for workflow ${workflowId}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private async getWorkflowsRecord(): Promise<
    Record<string, WorkflowDefinition>
  > {
    const raw = await this.adminConfig.get('workflows');
    return (raw as Record<string, WorkflowDefinition>) ?? {};
  }

  private async saveWorkflowsRecord(
    record: Record<string, WorkflowDefinition>,
    user: string,
  ): Promise<void> {
    await this.adminConfig.set('workflows', record, user);
  }

  private async getVersionsRecord(): Promise<
    Record<string, WorkflowVersion[]>
  > {
    const raw = await this.adminConfig.get('workflowVersions');
    return (raw as Record<string, WorkflowVersion[]>) ?? {};
  }

  private async saveVersionsRecord(
    record: Record<string, WorkflowVersion[]>,
    user: string,
  ): Promise<void> {
    await this.adminConfig.set('workflowVersions', record, user);
  }

  private async getTestSuitesRecord(): Promise<
    Record<string, WorkflowTestSuite>
  > {
    const raw = await this.adminConfig.get('workflowTestSuites');
    return (raw as Record<string, WorkflowTestSuite>) ?? {};
  }

  private async saveTestSuitesRecord(
    record: Record<string, WorkflowTestSuite>,
    user: string,
  ): Promise<void> {
    await this.adminConfig.set('workflowTestSuites', record, user);
  }

  private async getEvaluationsRecord(): Promise<
    Record<string, WorkflowEvaluationResult>
  > {
    const raw = await this.adminConfig.get('workflowEvaluations');
    return (raw as Record<string, WorkflowEvaluationResult>) ?? {};
  }

  private async saveEvaluationsRecord(
    record: Record<string, WorkflowEvaluationResult>,
    user: string,
  ): Promise<void> {
    await this.adminConfig.set('workflowEvaluations', record, user);
  }

  private validateWorkflowForPublish(workflow: WorkflowDefinition): void {
    if (!workflow.nodes || workflow.nodes.length === 0) {
      throw new InputError('Cannot publish workflow with no nodes');
    }
    const hasStart = workflow.nodes.some(n => n.type === 'start');
    if (!hasStart) {
      throw new InputError('Workflow must have a Start node');
    }
    const hasAgent = workflow.nodes.some(n => n.type === 'agent');
    if (!hasAgent) {
      throw new InputError('Workflow must have at least one Agent node');
    }
    if (!workflow.name || workflow.name.trim().length === 0) {
      throw new InputError('Workflow must have a name');
    }
  }
}
