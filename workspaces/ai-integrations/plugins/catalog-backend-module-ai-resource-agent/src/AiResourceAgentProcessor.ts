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

import {
  CatalogProcessor,
  CatalogProcessorEmit,
} from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import { collectAgentErrors } from './collectAgentErrors';

/**
 * A CatalogProcessor that validates agent-specific fields on
 * AiResource entities with `spec.type: 'agent'`.
 *
 * Validates:
 * - `spec.instructions`: required, non-empty string
 * - `spec.handoffs` / `spec.tools`: must be arrays if present
 * - `spec.resetToolChoice`: must be boolean if present
 * - `spec.modelSettings`: must be plain object if present
 * - `spec.toolUseBehavior`: must be string or string array if present
 * - `spec.outputSchema`: must be string or object if present
 * - `spec.handoffDescription` / `spec.model`: must be strings if present
 *
 * Non-agent AiResource entities (skill, rule, model) are unaffected.
 * All constraint violations are collected and reported in a single
 * error rather than stopping at the first failure.
 *
 * @public
 */
export class AiResourceAgentProcessor implements CatalogProcessor {
  getProcessorName(): string {
    return 'AiResourceAgentProcessor';
  }

  async preProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    _emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    if (entity.kind !== 'AiResource') {
      return entity;
    }

    const errors = collectAgentErrors(entity);

    if (errors.length > 0) {
      throw new Error(
        `Validation failed for AiResource agent entity: ${errors.join('; ')}`,
      );
    }

    return entity;
  }
}
