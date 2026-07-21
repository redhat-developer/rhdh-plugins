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
 * Valid values for spec.scope on AIResource entities.
 *
 * @public
 */
export const VALID_AI_RESOURCE_SCOPES = [
  'organization',
  'product',
  'team',
] as const;

/**
 * Type for valid AIResource scope values.
 *
 * @public
 */
export type AIResourceScope = (typeof VALID_AI_RESOURCE_SCOPES)[number];

/**
 * A CatalogProcessor that validates RHDH-specific extension
 * fields on AIResource entities.
 *
 * Validates:
 * - `spec.scope`: optional field restricted to 'organization',
 *   'product', or 'team'
 * - `spec.location.target`: OCI URI format when
 *   `spec.location.type` is `oci`
 *
 * All constraint violations are collected and reported in a single
 * error rather than stopping at the first failure.
 *
 * @public
 */
export class AIResourceExtensionsProcessor implements CatalogProcessor {
  getProcessorName(): string {
    return 'AIResourceExtensionsProcessor';
  }

  async preProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    _emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    if (entity.kind !== 'AIResource') {
      return entity;
    }

    const errors: string[] = [];

    const scope = entity.spec?.scope;
    if (
      scope !== undefined &&
      !VALID_AI_RESOURCE_SCOPES.includes(scope as AIResourceScope)
    ) {
      const accepted = VALID_AI_RESOURCE_SCOPES.map(v => `'${v}'`).join(', ');
      const sanitized = Array.from(String(scope))
        .filter(c => c.charCodeAt(0) > 0x1f)
        .join('')
        .slice(0, 200);
      errors.push(
        `spec.scope has invalid value '${sanitized}'; accepted values are ${accepted}`,
      );
    }

    errors.push(...collectOciErrors(entity));

    if (errors.length > 0) {
      throw new Error(
        `Validation failed for AIResource entity: ${errors.join('; ')}`,
      );
    }

    return entity;
  }
}
