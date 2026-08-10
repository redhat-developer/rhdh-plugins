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

import { Knex } from 'knex';
import crypto from 'node:crypto';
import { LoggerService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import {
  AdversarialAgentEntity,
  type AdversarialAgentSnapshot,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

export class AdversarialAgentOperations {
  readonly #logger: LoggerService;
  readonly #dbClient: Knex;

  constructor(logger: LoggerService, dbClient: Knex) {
    this.#logger = logger;
    this.#dbClient = dbClient;
  }

  async createAdversarialAgent(input: {
    name: string;
    prompt: string;
    phases: string[];
    critical: boolean;
    createdBy: string;
  }): Promise<AdversarialAgentEntity> {
    const id = crypto.randomUUID();
    const now = new Date();

    const entity = new AdversarialAgentEntity(
      id,
      input.name,
      input.prompt,
      input.phases,
      input.critical,
      input.createdBy,
      now,
      now,
    );

    await this.#dbClient('adversarial_agents').insert({
      id: entity.id,
      name: entity.name,
      prompt: entity.prompt,
      phases: JSON.stringify(entity.phases),
      critical: entity.critical,
      created_by: entity.createdBy,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    });

    this.#logger.info(`Created adversarial agent: ${id} "${input.name}"`);

    return entity;
  }

  async listAdversarialAgents(filters?: {
    phase?: string;
  }): Promise<AdversarialAgentEntity[]> {
    const rows = await this.#dbClient('adversarial_agents').orderBy(
      'created_at',
      'asc',
    );

    return rows
      .map((row: Record<string, unknown>) => {
        const phases =
          typeof row.phases === 'string'
            ? JSON.parse(row.phases as string)
            : row.phases;
        return AdversarialAgentEntity.fromRow({ ...row, phases });
      })
      .filter(agent => {
        if (!filters?.phase) return true;
        return agent.phases.includes(filters.phase);
      });
  }

  async getAdversarialAgent(opts: {
    id: string;
  }): Promise<AdversarialAgentEntity | undefined> {
    const row = await this.#dbClient('adversarial_agents')
      .where('id', opts.id)
      .first();
    if (!row) {
      return undefined;
    }
    const phases =
      typeof row.phases === 'string'
        ? JSON.parse(row.phases as string)
        : row.phases;
    return AdversarialAgentEntity.fromRow({
      ...(row as Record<string, unknown>),
      phases,
    });
  }

  async updateAdversarialAgent(opts: {
    id: string;
    name: string;
    prompt: string;
    phases: string[];
    critical: boolean;
  }): Promise<AdversarialAgentEntity | undefined> {
    const now = new Date();

    const updated = await this.#dbClient('adversarial_agents')
      .where('id', opts.id)
      .update({
        name: opts.name,
        prompt: opts.prompt,
        phases: JSON.stringify(opts.phases),
        critical: opts.critical,
        updated_at: now,
      });

    if (updated === 0) {
      return undefined;
    }

    this.#logger.info(`Updated adversarial agent: ${opts.id} "${opts.name}"`);

    const row = await this.#dbClient('adversarial_agents')
      .where('id', opts.id)
      .first();
    const phases =
      typeof row.phases === 'string'
        ? JSON.parse(row.phases as string)
        : row.phases;
    return AdversarialAgentEntity.fromRow({
      ...(row as Record<string, unknown>),
      phases,
    });
  }

  async deleteAdversarialAgent(opts: { id: string }): Promise<number> {
    this.#logger.info(`deleteAdversarialAgent called for id: ${opts.id}`);

    const deletedCount = await this.#dbClient('adversarial_agents')
      .where('id', opts.id)
      .delete();

    if (deletedCount === 0) {
      this.#logger.warn(`No adversarial agent found with id: ${opts.id}`);
    }

    return deletedCount;
  }

  async attachAdversarialAgentsToProject(args: {
    projectId: string;
    agentIds: string[];
  }): Promise<void> {
    const { projectId, agentIds } = args;

    // Fetch explicitly requested agents
    const requestedAgents =
      agentIds.length > 0
        ? await this.#dbClient('adversarial_agents').whereIn('id', agentIds)
        : [];

    // Validate all provided IDs exist
    const foundIds = new Set(
      requestedAgents.map((r: Record<string, unknown>) => r.id as string),
    );
    const missingIds = agentIds.filter(id => !foundIds.has(id));
    if (missingIds.length > 0) {
      throw new InputError(
        `Adversarial agents not found: ${missingIds.join(', ')}`,
      );
    }

    // Parse phases from JSON
    const agents = requestedAgents.map((row: Record<string, unknown>) => {
      const phases = JSON.parse(row.phases as string) as string[];
      return {
        ...(row as Record<string, unknown>),
        phases,
      };
    });

    const snapshots: AdversarialAgentSnapshot[] = agents.map(row =>
      AdversarialAgentEntity.fromRow(row).toSnapshot(),
    );

    await this.#dbClient('projects')
      .where('id', projectId)
      .update({ adversarial_agents: JSON.stringify(snapshots) });

    this.#logger.info(
      `Attached ${snapshots.length} adversarial agent(s) to project ${projectId}`,
    );
  }

  async getAdversarialAgentsForProject(args: {
    projectId: string;
  }): Promise<AdversarialAgentSnapshot[]> {
    const row = await this.#dbClient('projects')
      .where('id', args.projectId)
      .select('adversarial_agents')
      .first();

    if (!row?.adversarial_agents) {
      return [];
    }

    try {
      return JSON.parse(
        row.adversarial_agents as string,
      ) as AdversarialAgentSnapshot[];
    } catch {
      this.#logger.warn(
        `Failed to parse adversarial_agents JSON for project ${args.projectId}`,
      );
      return [];
    }
  }
}
