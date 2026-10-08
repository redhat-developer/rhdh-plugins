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
import { AdversarialAgentEntity } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

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
    ids?: string[];
  }): Promise<AdversarialAgentEntity[]> {
    let query = this.#dbClient('adversarial_agents').orderBy(
      'created_at',
      'asc',
    );

    if (filters?.ids && filters.ids.length > 0) {
      query = query.whereIn('id', filters.ids);
    }

    const rows = await query;

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
    const existing = await this.getAdversarialAgent({ id: opts.id });
    if (!existing) {
      return undefined;
    }

    const entity = new AdversarialAgentEntity(
      existing.id,
      opts.name,
      opts.prompt,
      opts.phases,
      opts.critical,
      existing.createdBy,
      existing.createdAt,
      new Date(),
    );

    await this.#dbClient('adversarial_agents')
      .where('id', entity.id)
      .update({
        name: entity.name,
        prompt: entity.prompt,
        phases: JSON.stringify(entity.phases),
        critical: entity.critical,
        updated_at: entity.updatedAt,
      });

    this.#logger.info(
      `Updated adversarial agent: ${entity.id} "${entity.name}"`,
    );

    return entity;
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
}
