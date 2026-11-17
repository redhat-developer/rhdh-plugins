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
import { createCatalogModelLayer } from '@backstage/catalog-model/alpha';
import type { AgentRhdhAiResourceEntityV1alpha1 } from './types';
import agentRhdhJsonSchema from './AiResource.v1alpha1.rhdh-agent.schema.json';

const agentRhdhValidator = entityKindSchemaValidator(agentRhdhJsonSchema);

/**
 * Entity data validator for {@link AgentRhdhAiResourceEntityV1alpha1}.
 *
 * Uses the same JSON-schema-based validation pattern as upstream
 * `agentAiResourceEntityV1alpha1Validator`.
 *
 * @public
 */
export const agentRhdhAiResourceEntityV1alpha1Validator: KindValidator = {
  async check(data) {
    return agentRhdhValidator(data) === data;
  },
};

/**
 * Type guard for {@link AgentRhdhAiResourceEntityV1alpha1}.
 *
 * Checks `apiVersion`, `kind`, and `spec.type` without running
 * schema validation.
 *
 * @public
 */
export function isAgentRhdhAiResourceEntity(
  entity: Entity,
): entity is AgentRhdhAiResourceEntityV1alpha1 {
  return (
    entity.apiVersion === 'backstage.io/v1alpha1' &&
    entity.kind === 'AiResource' &&
    entity.spec?.type === 'rhdh-agent'
  );
}

/**
 * Extends the catalog model with the rhdh-agent specType for
 * the AiResource kind.
 *
 * Follows the upstream pattern established by `agentAiResourceEntityModel`,
 * using `addKindVersion` to register the rhdh-agent JSON schema
 * under `specType: 'rhdh-agent'`. Declares only the owner
 * relation (no system relation).
 *
 * @public
 */
export const agentRhdhAiResourceEntityModel = createCatalogModelLayer({
  layerId: 'redhat.com/kind-ai-resource-rhdh-agent',
  builder: model => {
    model.addKindVersion({
      kind: 'AiResource',
      versions: [
        {
          name: 'v1alpha1',
          specType: 'rhdh-agent',
          relationFields: [
            {
              selector: { path: 'spec.owner' },
              relation: 'ownedBy',
              defaultKind: 'Group',
              defaultNamespace: 'inherit',
              allowedKinds: ['Group', 'User'],
            },
          ],
          schema: {
            jsonSchema: agentRhdhJsonSchema,
          },
        },
      ],
    });
  },
});
