/*
 * Copyright 2024 The Backstage Authors
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
  RELATION_OWNED_BY,
} from '@backstage/catalog-model';
import {
  MARKETPLACE_API_VERSION,
  MarketplaceKinds,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';

const pluginJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'PluginV1alpha1',
  description:
    'A Plugin describes a software component. It is typically intimately linked to the source code that constitutes the component, and should be what a developer may regard a "unit of software", usually with a distinct deployable or linkable artifact.',
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
          enum: ['Plugin'],
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
          required: ['name', 'title', 'description'],
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
          required: ['type', 'lifecycle', 'owner'],
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
        enum: ['Plugin'],
      },
      metadata: {
        name: 'testplugin',
        title: 'Test Plugin',
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
export class MarketplacePluginProcessor implements CatalogProcessor {
  private readonly validators = [entityKindSchemaValidator(pluginJsonSchema)];

  // Return processor name
  getProcessorName(): string {
    return 'MarketplacePluginProcessor';
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
    entity: Entity,
    _location: LocationSpec,
    emit: CatalogProcessorEmit,
  ): Promise<Entity> {
    if (
      entity.apiVersion === MARKETPLACE_API_VERSION &&
      entity.kind === MarketplaceKinds.plugin
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
    }

    return entity;
  }
}
