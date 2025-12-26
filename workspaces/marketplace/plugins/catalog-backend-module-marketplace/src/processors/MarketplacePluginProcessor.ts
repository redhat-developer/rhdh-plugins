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
  MarketplaceAnnotation,
  MarketplaceAuthor,
  MarketplacePlugin,
  MarketplaceKind,
  isMarketplacePlugin,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

// eslint-disable-next-line @backstage/no-relative-monorepo-imports
import pluginJsonSchema from '../../../../json-schema/plugins.json';

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
      // Automatically set title to name if it's not defined
      // so that sorting and searching works as expected.
      if (!entity.metadata.title) {
        entity.metadata.title = entity.metadata.name;
      }

      // Automatically enforce annotation pre-installed=false if it's not defined.
      if (!entity.metadata.annotations?.[MarketplaceAnnotation.PRE_INSTALLED]) {
        entity.metadata.annotations = {
          ...entity.metadata.annotations,
          [MarketplaceAnnotation.PRE_INSTALLED]: 'false',
        };
      }

      // Align authors
      const authors: MarketplaceAuthor[] = [];
      if (typeof entity.spec?.author === 'string') {
        authors.push({ name: entity.spec.author });
      }
      if (Array.isArray(entity.spec?.authors)) {
        entity.spec.authors.forEach(author => {
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

      // Align support field
      if (typeof entity.spec?.support === 'string') {
        entity.spec.support = { level: entity.spec.support };
      }

      // Relation - OWNED_BY
      const thisEntityRef = getCompoundEntityRef(entity);
      if (entity?.spec?.owner) {
        const ownerRef = parseEntityRef(entity?.spec?.owner as string, {
          defaultKind: 'Group',
          defaultNamespace: entity.metadata.namespace,
        });
        emit(
          processingResult.relation({
            type: RELATION_OWNED_BY,
            source: thisEntityRef,
            target: ownerRef,
          }),
        );
      }

      // Relation - Packages
      if (entity.spec?.packages && entity.spec.packages.length > 0) {
        entity.spec.packages.forEach(packageName => {
          const packageRef = parseEntityRef(packageName, {
            defaultKind: MarketplaceKind.Package,
            defaultNamespace: entity.metadata.namespace,
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
    }

    return entity;
  }
}
