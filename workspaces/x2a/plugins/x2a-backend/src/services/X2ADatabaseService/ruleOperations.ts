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
  MAX_ACCEPTED_RULES_TOTAL_CHARS,
  RuleEntity,
  type RuleSnapshot,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

export class RuleOperations {
  readonly #logger: LoggerService;
  readonly #dbClient: Knex;

  constructor(logger: LoggerService, dbClient: Knex) {
    this.#logger = logger;
    this.#dbClient = dbClient;
  }

  async createRule(input: {
    title: string;
    description: string;
    required?: boolean;
  }): Promise<RuleEntity> {
    const id = crypto.randomUUID();
    const now = new Date();

    await this.#dbClient('rules').insert({
      id,
      title: input.title,
      description: input.description,
      required: input.required ?? false,
      created_at: now,
      updated_at: now,
    });

    this.#logger.info(`Created rule: ${id} "${input.title}"`);

    return new RuleEntity(
      id,
      input.title,
      input.description,
      input.required ?? false,
      now,
      now,
    );
  }

  async updateRule(input: {
    id: string;
    title: string;
    description: string;
    required: boolean;
  }): Promise<RuleEntity | undefined> {
    const now = new Date();

    const updated = await this.#dbClient('rules').where('id', input.id).update({
      title: input.title,
      description: input.description,
      required: input.required,
      updated_at: now,
    });

    if (updated === 0) {
      return undefined;
    }

    this.#logger.info(`Updated rule: ${input.id} "${input.title}"`);

    const row = await this.#dbClient('rules').where('id', input.id).first();
    return RuleEntity.fromRow(row as Record<string, unknown>);
  }

  async getRule({ id }: { id: string }): Promise<RuleEntity | undefined> {
    const row = await this.#dbClient('rules').where('id', id).first();
    if (!row) {
      return undefined;
    }
    return RuleEntity.fromRow(row as Record<string, unknown>);
  }

  async listRules(): Promise<RuleEntity[]> {
    const rows = await this.#dbClient('rules').orderBy('created_at', 'asc');
    return rows.map((row: Record<string, unknown>) => RuleEntity.fromRow(row));
  }

  async deleteRule({ id }: { id: string }): Promise<number> {
    this.#logger.info(`deleteRule called for id: ${id}`);

    const deletedCount = await this.#dbClient('rules').where('id', id).delete();

    if (deletedCount === 0) {
      this.#logger.warn(`No rule found with id: ${id}`);
    }

    return deletedCount;
  }

  async validateAcceptedRules(ruleIds: string[]): Promise<void> {
    const requestedRules =
      ruleIds.length > 0
        ? await this.#dbClient('rules').whereIn('id', ruleIds)
        : [];

    const missingIds = ruleIds.filter(
      id => !requestedRules.find((r: Record<string, unknown>) => r.id === id),
    );
    if (missingIds.length > 0) {
      throw new InputError(`Rules not found: ${missingIds.join(', ')}`);
    }

    const requiredRules = await this.#dbClient('rules').where('required', true);

    const allRulesMap = new Map<string, Record<string, unknown>>();
    for (const row of [...requestedRules, ...requiredRules]) {
      const r = row as Record<string, unknown>;
      allRulesMap.set(r.id as string, r);
    }

    const totalChars = [...allRulesMap.values()].reduce(
      (sum, r) => sum + (r.description as string).length,
      0,
    );
    if (totalChars > MAX_ACCEPTED_RULES_TOTAL_CHARS) {
      throw new InputError(
        `Total accepted rules content (${totalChars} chars) exceeds the ${MAX_ACCEPTED_RULES_TOTAL_CHARS} character limit`,
      );
    }
  }

  async attachRulesToProject(args: {
    projectId: string;
    ruleIds: string[];
  }): Promise<void> {
    const { projectId, ruleIds } = args;

    const requestedRules =
      ruleIds.length > 0
        ? await this.#dbClient('rules').whereIn('id', ruleIds)
        : [];

    const requiredRules = await this.#dbClient('rules').where('required', true);

    const allRulesMap = new Map<string, Record<string, unknown>>();
    for (const row of [...requestedRules, ...requiredRules]) {
      const r = row as Record<string, unknown>;
      allRulesMap.set(r.id as string, r);
    }

    const snapshots: RuleSnapshot[] = [...allRulesMap.values()].map(row =>
      RuleEntity.fromRow(row).toSnapshot(),
    );

    await this.#dbClient('projects')
      .where('id', projectId)
      .update({ accepted_rules: JSON.stringify(snapshots) });

    this.#logger.info(
      `Attached ${snapshots.length} rule(s) to project ${projectId}`,
    );
  }

  async getAcceptedRulesForProject(args: {
    projectId: string;
  }): Promise<RuleSnapshot[]> {
    const row = await this.#dbClient('projects')
      .where('id', args.projectId)
      .select('accepted_rules')
      .first();

    if (!row?.accepted_rules) {
      return [];
    }

    try {
      return JSON.parse(row.accepted_rules as string) as RuleSnapshot[];
    } catch {
      this.#logger.warn(
        `Failed to parse accepted_rules JSON for project ${args.projectId}`,
      );
      return [];
    }
  }
}
