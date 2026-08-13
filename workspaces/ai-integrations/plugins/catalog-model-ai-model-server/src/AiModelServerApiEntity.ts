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
import type { AiModelServerApiEntity } from './types';
import aiModelServerSchema from './API.v1alpha1.ai-model-server.schema.json';

const aiModelServerValidator = entityKindSchemaValidator(aiModelServerSchema);

/**
 * Entity data validator for {@link AiModelServerApiEntity}.
 *
 * Uses the same JSON-schema-based validation pattern as upstream
 * `aiModelServerApiEntityValidator` from backstage/backstage#34476.
 *
 * @public
 */
export const aiModelServerApiEntityValidator: KindValidator = {
  async check(data) {
    return aiModelServerValidator(data) === data;
  },
};

/**
 * Type guard for {@link AiModelServerApiEntity}.
 *
 * Checks `kind` and `spec.type` without running schema validation.
 *
 * @public
 */
export function isAiModelServerApiEntity(
  entity: Entity,
): entity is AiModelServerApiEntity {
  return (
    entity.kind === 'AiModelServerAPI' &&
    entity.spec?.type === 'ai-model-server'
  );
}

/**
 * Registers the AiModelServerAPI kind in the catalog model.
 *
 * Uses a dedicated kind to avoid colliding with the upstream API kind's
 * specType registrations. The schema mirrors backstage/backstage#34476
 * exactly; when that PR lands upstream, a migration processor can
 * convert AiModelServerAPI entities into API entities with
 * spec.type: 'ai-model-server'.
 *
 * @public
 */
export const aiModelServerApiEntityModel = createCatalogModelLayer({
  layerId: 'redhat.com/kind-ai-model-server-api',
  builder: model => {
    model.addKind({
      group: 'backstage.io',
      names: {
        kind: 'AiModelServerAPI',
        singular: 'aimodelserverapi',
        plural: 'aimodelserverapis',
      },
      description: 'An AI model server exposed as an AiModelServerAPI entity.',
      versions: [
        {
          name: ['v1alpha1', 'v1beta1'],
          specType: 'ai-model-server',
          relationFields: [
            {
              selector: { path: 'spec.owner' },
              relation: 'ownedBy',
              defaultKind: 'Group',
              defaultNamespace: 'inherit',
              allowedKinds: ['Group', 'User'],
            },
            {
              selector: { path: 'spec.system' },
              relation: 'partOf',
              defaultKind: 'System',
              defaultNamespace: 'inherit',
            },
          ],
          schema: { jsonSchema: aiModelServerSchema },
        },
      ],
    });
  },
});
