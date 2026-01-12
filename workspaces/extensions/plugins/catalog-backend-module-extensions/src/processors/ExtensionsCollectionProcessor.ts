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
  isExtensionsCollection,
  ExtensionsKind,
} from '@red-hat-developer-hub/backstage-plugin-extensions-common';

// eslint-disable-next-line @backstage/no-relative-monorepo-imports
import collectionJsonSchema from '../../../../json-schema/collections.json';

/**
 * @public
 */
export class ExtensionsCollectionProcessor implements CatalogProcessor {
  private readonly validators = [
    entityKindSchemaValidator(collectionJsonSchema),
  ];

  // validateEntityKind is responsible for signaling to the catalog processing
  // engine that this entity is valid and should therefore be submitted for
  // further processing.
  async validateEntityKind(entity: Entity): Promise<boolean> {
    if (isExtensionsCollection(entity)) {
      for (const validator of this.validators) {
        if (validator(entity)) {
          return true;
        }
      }
    }
    return false;
  }

  getProcessorName(): string {
    return 'ExtensionsCollectionProcessor';
  }

  async postProcessEntity(
    entity: Entity,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    if (isExtensionsCollection(entity)) {
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

      // Relation - Plugins
      if (entity.spec?.plugins && entity.spec.plugins.length > 0) {
        entity.spec.plugins.forEach((plugin: string) => {
          const pluginRef = parseEntityRef(plugin, {
            defaultKind: ExtensionsKind.Plugin,
            defaultNamespace: entity.metadata.namespace,
          });
          if (pluginRef) {
            emit(
              processingResult.relation({
                type: RELATION_PART_OF,
                source: thisEntityRef,
                target: pluginRef,
              }),
            );
            emit(
              processingResult.relation({
                type: RELATION_HAS_PART,
                source: pluginRef,
                target: thisEntityRef,
              }),
            );
          }
        });
      }
    }

    return entity;
  }
}

/**
 * @public
 * @deprecated Use ExtensionsCollectionProcessor instead
 */
export const MarketplaceCollectionProcessor = ExtensionsCollectionProcessor;
