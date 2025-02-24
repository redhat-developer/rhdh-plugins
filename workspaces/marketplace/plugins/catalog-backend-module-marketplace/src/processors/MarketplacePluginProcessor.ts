/*
 * Copyright The Backstage Authors
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
  processingResult,
} from '@backstage/plugin-catalog-node';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  Entity,
  entityKindSchemaValidator,
  getCompoundEntityRef,
  parseEntityRef,
  RELATION_HAS_PART,
  RELATION_OWNED_BY,
  RELATION_PART_OF,
} from '@backstage/catalog-model';
import {
  MarketplacePlugin,
  MarketplaceKind,
  isMarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import pluginJsonSchema from '../../../../json-schema/plugins.json';
import { MarketplaceAuthor } from '@red-hat-developer-hub/backstage-plugin-marketplace-common/src/types/MarketplaceAuthor';

/**
 * @public
 */
export class MarketplacePluginProcessor implements CatalogProcessor {
  private readonly validators = [entityKindSchemaValidator(pluginJsonSchema)];

  getProcessorName(): string {
    return 'MarketplacePluginProcessor';
  }

  // validateEntityKind is responsible for signaling to the catalog processing
  // engine that this entity is valid and should therefore be submitted for
  // further processing.
  async validateEntityKind(entity: Entity): Promise<boolean> {
    if (isMarketplacePlugin(entity)) {
      for (const validator of this.validators) {
        if (validator(entity)) {
          return true;
        }
      }
    }
    return false;
  }

  async postProcessEntity(
    entity: MarketplacePlugin,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    if (isMarketplacePlugin(entity)) {

      const authors: MarketplaceAuthor[] = [];
      if (typeof entity.spec?.author === 'string') {
        authors.push({ name: entity.spec.author });
      }
      if (Array.isArray(entity.spec?.authors)) {
        entity.spec.authors.forEach((author) => {
          if (typeof author === 'string') {
            authors.push({ name: author });
          } else {
            authors.push(author);
          }
        });
      }
      if (typeof entity.spec?.developer === 'string') {
        authors.push({ name: entity.spec.developer });
      }

      delete entity.spec?.author;
      delete entity.spec?.authors;
      delete entity.spec?.developer;
      if (authors.length > 0) {
        if (!entity.spec) entity.spec = {};
        entity.spec.authors = authors;
      }

      const thisEntityRef = getCompoundEntityRef(entity);
      const target = entity?.spec?.owner;
      if (target) {
        const targetRef = parseEntityRef(target as string, {
          defaultKind: 'Group',
          defaultNamespace: thisEntityRef.namespace,
        });

        // emit any relations associated with the entity here.
        emit(
          processingResult.relation({
            type: RELATION_OWNED_BY,
            target: targetRef,
            source: thisEntityRef,
          }),
        );
      }

      const packages = entity.spec?.packages ?? [];

      // Relation - Packages
      packages.forEach(pkg => {
        const packageRef = parseEntityRef({
          name: pkg,
          kind: MarketplaceKind.Package,
        });
        if (packageRef) {
          emit(
            processingResult.relation({
              type: RELATION_PART_OF,
              source: packageRef,
              target: thisEntityRef,
            }),
          );

          emit(
            processingResult.relation({
              type: RELATION_HAS_PART,
              target: packageRef,
              source: thisEntityRef,
            }),
          );
        }
      });
    }

    return entity;
  }
}
