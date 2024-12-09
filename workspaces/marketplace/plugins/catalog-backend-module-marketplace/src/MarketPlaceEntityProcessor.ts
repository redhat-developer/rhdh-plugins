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

const pluginJsonSchema = {
  $schema: 'http://json-schema.org/draft-07/schema',
  $id: 'ComponentV1alpha1',
  description:
    'A Component describes a software component. It is typically intimately linked to the source code that constitutes the component, and should be what a developer may regard a "unit of software", usually with a distinct deployable or linkable artifact.',
  examples: [
    {
      apiVersion: {
        enum: ['backstage.io/v1alpha1'],
      },
      kind: {
        enum: ['Plugin'],
      },
      metadata: {
        name: 'TestPlugin',
        description: 'Creates Lorems like a pro.',
        labels: {
          product_name: 'test-product',
        },
        annotations: {
          docs: 'https://github.com/..../tree/develop/doc',
        },
      },
      spec: {
        type: 'service',
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
    if (!this.validateEntityKind(entity)) {
      return entity;
    }

    if (
      entity.apiVersion === 'backstage.io/v1alpha1' &&
      entity.kind === 'Plugin'
    ) {
      const thisEntityRef = getCompoundEntityRef(entity);
      const target = entity?.spec?.owner || 'redhat';
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

    return entity;
  }
}
