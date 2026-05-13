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

import type { RuleSnapshot } from '../../client/src/schema/openapi/generated/models/RuleSnapshot.model';

/** @public */
export class RuleEntity {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly required: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(
    id: string,
    title: string,
    description: string,
    required: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    if (!title) {
      throw new Error('Rule title must be a non-empty string');
    }
    if (!description) {
      throw new Error('Rule description must be a non-empty string');
    }
    this.id = id;
    this.title = title;
    this.description = description;
    this.required = required;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromRow(row: Record<string, unknown>): RuleEntity {
    return new RuleEntity(
      row.id as string,
      row.title as string,
      row.description as string,
      row.required as boolean,
      new Date(row.created_at as string | Date),
      new Date(row.updated_at as string | Date),
    );
  }

  static fromJSON(json: unknown): RuleEntity {
    const obj = json as Record<string, unknown>;
    return new RuleEntity(
      obj.id as string,
      obj.title as string,
      obj.description as string,
      obj.required !== null ? (obj.required as boolean) : false,
      obj.createdAt ? new Date(obj.createdAt as string | Date) : new Date(),
      obj.updatedAt ? new Date(obj.updatedAt as string | Date) : new Date(),
    );
  }

  toSnapshot(): RuleSnapshot {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
    };
  }

  /** File path for this rule inside the K8s job workspace */
  path(): string {
    return `/workspace/x2a-rules/${this.id}.md`;
  }

  /** Formatted rule content for writing to the job filesystem */
  content(): string {
    return `# ${this.title}\n\n${this.description}`;
  }

  equals(other: RuleEntity): boolean {
    return (
      this.id === other.id &&
      this.title === other.title &&
      this.description === other.description &&
      this.required === other.required
    );
  }

  toString(): string {
    return `RuleEntity(${this.id}: ${this.title})`;
  }
}
