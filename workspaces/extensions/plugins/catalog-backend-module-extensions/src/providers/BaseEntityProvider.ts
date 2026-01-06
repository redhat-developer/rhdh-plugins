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
import { SchedulerServiceTaskRunner } from '@backstage/backend-plugin-api';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  Entity,
} from '@backstage/catalog-model';
import {
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';

import { findTopmostFolder, readYamlFiles } from '../utils/file-utils';
import { JsonFileData } from '../types';

/**
 * @public
 */
export abstract class BaseEntityProvider<T extends Entity>
  implements EntityProvider
{
  private connection?: EntityProviderConnection;
  private taskRunner: SchedulerServiceTaskRunner;

  constructor(taskRunner: SchedulerServiceTaskRunner) {
    this.taskRunner = taskRunner;
  }

  abstract getProviderName(): string;
  abstract getKind(): string;

  getEntities(allEntities: JsonFileData<T>[]): T[] {
    if (allEntities.length === 0) {
      return [];
    }
    return allEntities
      .filter(d => d.content.kind === this.getKind())
      .map(file => ({
        ...file.content,
        metadata: {
          ...file.content.metadata,
          annotations: {
            ...file.content.metadata.annotations,
            [ANNOTATION_LOCATION]: `file:${this.getProviderName()}`,
            [ANNOTATION_ORIGIN_LOCATION]: `file:${this.getProviderName()}`,
          },
        },
      }));
  }

  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: this.getProviderName(),
      fn: async () => {
        await this.run();
      },
    });
  }

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    // Try 'extensions' first, then fallback to 'marketplace' for backward compatibility
    const extensionsFilePath =
      findTopmostFolder('extensions') || findTopmostFolder('marketplace');

    let yamlData: JsonFileData<T>[] = [];
    if (extensionsFilePath) {
      try {
        yamlData = readYamlFiles(extensionsFilePath);
      } catch (error) {
        console.error(error.message);
      }
    }

    const entities: T[] = this.getEntities(yamlData);

    await this.connection.applyMutation({
      type: 'full',
      entities: entities.map(entity => ({
        entity,
        locationKey: `file:${this.getProviderName()}`,
      })),
    });
  }
}
