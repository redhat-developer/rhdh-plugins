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
  MARKETPLACE_API_VERSION,
  MarketplaceKinds,
  MarketplacePackage,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

const packageJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'PackageV1alpha1',
  description:
    'A Package describes a software component. It is typically intimately linked to the source code that constitutes the component, and should be what a developer may regard a "unit of software", usually with a distinct deployable or linkable artifact.',
  allOf: [
    {
      type: 'object',
      properties: {
        apiVersion: {
          type: 'string',
          enum: ['marketplace.backstage.io/v1alpha1'],
        },
        kind: {
          type: 'string',
          enum: ['Package'],
        },
        metadata: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            tags: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            labels: {
              type: 'object',
            },
            annotations: {
              type: 'object',
            },
          },
          required: ['name'],
        },
        spec: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
            },
            lifecycle: {
              type: 'string',
            },
            owner: {
              type: 'string',
            },
          },
          // required: ['type', 'lifecycle', 'owner'],
        },
      },
      required: ['apiVersion', 'kind', 'metadata', 'spec'],
    },
  ],
  examples: [
    {
      apiVersion: {
        enum: ['marketplace.backstage.io/v1alpha1'],
      },
      kind: {
        enum: ['Package'],
      },
      metadata: {
        name: 'testplugin',
        title: 'Test Package',
        description: 'Creates Lorems like a pro.',
        labels: {
          product_name: 'test-product',
        },
        annotations: {
          docs: 'https://github.com/..../tree/develop/doc',
        },
      },
      spec: {
        type: 'frontend-plugin',
        lifecycle: 'production',
        owner: 'redhat',
      },
    },
  ],
};

/**
 * @public
 */
export class MarketplacePackageProcessor implements CatalogProcessor {
  private readonly validators = [entityKindSchemaValidator(packageJsonSchema)];

  // Return processor name
  getProcessorName(): string {
    return 'MarketplacePackageProcessor';
  }

  // validateEntityKind is responsible for signaling to the catalog processing
  // engine that this entity is valid and should therefore be submitted for
  // further processing.
  async validateEntityKind(entity: Entity): Promise<boolean> {
    for (const validator of this.validators) {
      if (validator(entity)) {
        return true;
      }
    }

    return false;
  }

  async postProcessEntity(
    entity: MarketplacePackage,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    if (
      entity.apiVersion === MARKETPLACE_API_VERSION &&
      entity.kind === MarketplaceKinds.package
    ) {
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
          kind: MarketplaceKinds.plugin,
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
