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

import { CatalogProcessor } from '@backstage/plugin-catalog-node';
import { Entity } from '@backstage/catalog-model';
import { aiModelServerApiEntityValidator } from '@red-hat-developer-hub/backstage-plugin-catalog-model-ai-model-server';

/**
 * A CatalogProcessor that validates AiModelServerAPI entities.
 *
 * Uses `validateEntityKind` so the catalog's `BuiltinKindsEntityProcessor`
 * remains active for standard kinds (User, Group, Component, etc.).
 * This avoids the pitfall of `addModelSource`, which replaces the
 * built-in kind processor entirely.
 *
 * @public
 */
export class AiModelServerApiProcessor implements CatalogProcessor {
  getProcessorName(): string {
    return 'AiModelServerApiProcessor';
  }

  async validateEntityKind(entity: Entity): Promise<boolean> {
    if (entity.kind !== 'AiModelServerAPI') {
      return false;
    }
    return aiModelServerApiEntityValidator.check(entity);
  }
}
