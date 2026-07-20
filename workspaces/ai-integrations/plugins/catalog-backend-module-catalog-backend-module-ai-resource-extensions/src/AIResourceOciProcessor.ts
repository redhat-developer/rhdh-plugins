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
import { collectOciErrors } from './collectOciErrors';

/**
 * A CatalogProcessor that validates OCI-backed AIResource entities.
 *
 * Validates that `spec.location.target` uses the `oci://` URI scheme
 * when `spec.location.type` is `oci`. Makes zero outbound HTTP or
 * registry network calls — validation is format-only.
 *
 * When used alongside {@link AIResourceExtensionsProcessor}, OCI
 * errors are already aggregated there. This processor is kept for
 * standalone or backwards-compatible use.
 *
 * @public
 */
export class AIResourceOciProcessor implements CatalogProcessor {
  getProcessorName(): string {
    return 'AIResourceOciProcessor';
  }

  async preProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    _emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    if (entity.kind !== 'AIResource') {
      return entity;
    }

    const errors = collectOciErrors(entity);

    if (errors.length > 0) {
      throw new Error(
        `Validation failed for AIResource entity: ${errors.join('; ')}`,
      );
    }

    return entity;
  }
}
