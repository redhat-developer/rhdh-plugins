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

import { Phase } from './Phase';

/** @public */
export interface AdversarialAgentConfig {
  id: string;
  name: string;
  prompt: string;
  phases: string[];
  critical: boolean;
}

/** @public */
export class AdversarialAgentEntity {
  readonly id: string;
  readonly name: string;
  readonly prompt: string;
  readonly phases: string[];
  readonly critical: boolean;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    name: string,
    prompt: string,
    phases: string[],
    critical: boolean,
    createdBy: string,
    createdAt: Date,
    updatedAt: Date,
  ) {
    if (!name || name.length < 3 || name.length > 100) {
      throw new Error('Agent name must be between 3 and 100 characters');
    }
    if (!prompt || prompt.length < 50 || prompt.length > 5000) {
      throw new Error('Agent prompt must be between 50 and 5000 characters');
    }
    if (!phases || phases.length === 0) {
      throw new Error('Agent must have at least one phase');
    }

    const validPhases = Phase.adversarialAgentPhaseValues();
    for (const phase of phases) {
      if (!validPhases.includes(phase as any)) {
        throw new Error(
          `Invalid phase: "${phase}". Valid phases: ${validPhases.join(', ')}`,
        );
      }
    }

    if (!createdBy) {
      throw new Error('Agent created_by must be a non-empty string');
    }

    this.id = id;
    this.name = name;
    this.prompt = prompt;
    this.phases = phases;
    this.critical = critical;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromRow(row: Record<string, unknown>): AdversarialAgentEntity {
    return new AdversarialAgentEntity(
      row.id as string,
      row.name as string,
      row.prompt as string,
      row.phases as string[],
      Boolean(row.critical ?? false),
      row.created_by as string,
      new Date(row.created_at as string | Date),
      new Date(row.updated_at as string | Date),
    );
  }

  static fromJSON(json: unknown): AdversarialAgentEntity {
    const obj = json as Record<string, unknown>;
    return new AdversarialAgentEntity(
      obj.id as string,
      obj.name as string,
      obj.prompt as string,
      obj.phases as string[],
      Boolean(obj.critical ?? false),
      obj.createdBy as string,
      obj.createdAt ? new Date(obj.createdAt as string | Date) : new Date(),
      obj.updatedAt ? new Date(obj.updatedAt as string | Date) : new Date(),
    );
  }

  equals(other: AdversarialAgentEntity): boolean {
    return (
      this.id === other.id &&
      this.name === other.name &&
      this.prompt === other.prompt &&
      JSON.stringify(this.phases) === JSON.stringify(other.phases) &&
      this.critical === other.critical &&
      this.createdBy === other.createdBy
    );
  }

  toConfig(): AdversarialAgentConfig {
    return {
      id: this.id,
      name: this.name,
      prompt: this.prompt,
      phases: this.phases,
      critical: this.critical,
    };
  }

  toString(): string {
    return `AdversarialAgentEntity(${this.id}: ${this.name})`;
  }
}
