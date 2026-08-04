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

import type { Entity } from '@backstage/catalog-model';
import {
  entityKindSchemaValidator,
  type KindValidator,
} from '@backstage/catalog-model';
import type { AgentAiResourceEntityV1alpha1 } from './types';
import agentJsonSchema from './AiResource.v1alpha1.agent.schema.json';

const agentValidator = entityKindSchemaValidator(agentJsonSchema);

/**
 * Entity data validator for {@link AgentAiResourceEntityV1alpha1}.
 *
 * Uses the same JSON-schema-based validation pattern as upstream
 * `skillAiResourceEntityV1alpha1Validator` and
 * `ruleAiResourceEntityV1alpha1Validator`.
 *
 * @public
 */
export const agentAiResourceEntityV1alpha1Validator: KindValidator = {
  async check(data) {
    return agentValidator(data) === data;
  },
};

/**
 * Type guard for {@link AgentAiResourceEntityV1alpha1}.
 *
 * Checks `apiVersion`, `kind`, and `spec.type` without running
 * schema validation.
 *
 * @public
 */
export function isAgentAiResourceEntity(
  entity: Entity,
): entity is AgentAiResourceEntityV1alpha1 {
  return (
    entity.apiVersion === 'backstage.io/v1alpha1' &&
    entity.kind === 'AiResource' &&
    entity.spec?.type === 'agent'
  );
}
