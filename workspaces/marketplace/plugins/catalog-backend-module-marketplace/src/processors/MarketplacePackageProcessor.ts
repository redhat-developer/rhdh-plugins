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
  Entity,
  entityKindSchemaValidator,
  getCompoundEntityRef,
  parseEntityRef,
  RELATION_HAS_PART,
  RELATION_OWNED_BY,
  RELATION_PART_OF,
} from '@backstage/catalog-model';
import { LocationSpec } from '@backstage/plugin-catalog-common';
import {
  CatalogProcessor,
  CatalogProcessorEmit,
  processingResult,
} from '@backstage/plugin-catalog-node';
import {
  MarketplacePackage,
  MarketplaceKind,
  isMarketplacePackage,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

import packageJsonSchema from '../../../../json-schema/packages.json';

/**
 * @public
 */
export class MarketplacePackageProcessor implements CatalogProcessor {
  private readonly validators = [entityKindSchemaValidator(packageJsonSchema)];

  getProcessorName(): string {
    return 'MarketplacePackageProcessor';
  }

  // validateEntityKind is responsible for signaling to the catalog processing
  // engine that this entity is valid and should therefore be submitted for
  // further processing.
  async validateEntityKind(entity: Entity): Promise<boolean> {
    if (isMarketplacePackage(entity)) {
      for (const validator of this.validators) {
        if (validator(entity)) {
          return true;
        }
      }
    }
    return false;
  }

  async postProcessEntity(
    entity: MarketplacePackage,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    if (isMarketplacePackage(entity)) {
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

      const partOfPlugins = entity.spec?.partOf ?? [];

      // Relation - Plugins
      partOfPlugins.forEach((plugin: string) => {
        const pluginRef = parseEntityRef({
          name: plugin,
          kind: MarketplaceKind.Plugin,
        });
        if (pluginRef) {
          emit(
            processingResult.relation({
              type: RELATION_PART_OF,
              target: pluginRef,
              source: thisEntityRef,
            }),
          );

          emit(
            processingResult.relation({
              type: RELATION_HAS_PART,
              target: thisEntityRef,
              source: pluginRef,
            }),
          );
        }
      });
    }

    return entity;
  }
}
