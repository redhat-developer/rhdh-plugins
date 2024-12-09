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
  EntityProvider,
  EntityProviderConnection,
} from '@backstage/plugin-catalog-node';

import {
  LoggerService,
  SchedulerServiceTaskRunner,
} from '@backstage/backend-plugin-api';
import {
  ANNOTATION_LOCATION,
  ANNOTATION_ORIGIN_LOCATION,
  Entity,
  EntityMeta,
} from '@backstage/catalog-model';
import { glob } from 'glob';
import {
  MarketplacePluginEntry,
  MarketplacePluginLink,
  MarketplacePluginMetadata,
} from '@red-hat-developer-hub/backstage-plugin-marketplace-common';
import { parse } from 'yaml';
import { readFile } from 'node:fs/promises';

interface MarketplacePluginEntity extends Entity {
  metadata: MarketplacePluginMetadata & EntityMeta;
}

/**
 * Provides entities from marketplace-plugin service.
 */
export class MarketplacePluginProvider implements EntityProvider {
  private readonly env: string;
  private connection?: EntityProviderConnection;
  private logger: LoggerService;
  private taskRunner: SchedulerServiceTaskRunner;

  /** [1] */
  constructor(
    env: string,
    taskRunner: SchedulerServiceTaskRunner,
    logger: LoggerService,
  ) {
    this.env = env;
    this.logger = logger;
    this.taskRunner = taskRunner;
  }

  /** [2] */
  getProviderName(): string {
    return `marketplace-plugin-${this.env}`;
  }

  /** [3] */
  async connect(connection: EntityProviderConnection): Promise<void> {
    this.connection = connection;
    await this.taskRunner.run({
      id: this.getProviderName(),
      fn: async () => {
        await this.run();
      },
    });
  }

  /** [4] */
  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    const entries: MarketplacePluginEntry[] = [];

    const metadataFiles = await glob('../../data/entries/**/metadata.yaml');

    for await (const metadataFile of metadataFiles) {
      this.logger.info('getPlugins, read file', { metadataFile });
      entries.push(await parse(await readFile(metadataFile, 'utf-8')));
    }

    const entities: MarketplacePluginEntity[] = entries.map(_entity => {
      const metadata: MarketplacePluginMetadata = _entity.metadata;
      return {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Plugin',
        metadata: {
          ...metadata,
          description: metadata.abstract,
          name: metadata.name,
          links: Object.values(metadata.links || {}).map(
            (link: MarketplacePluginLink) => ({
              ...link,
            }),
          ),
          tags: metadata.tags,
          annotations: {
            ...metadata.annotations,
            [ANNOTATION_LOCATION]: `file:../../../../../data/entries/${metadata.name}/metadata.yaml`,
            [ANNOTATION_ORIGIN_LOCATION]: `file:../../../../../data/entries/${metadata.name}/metadata.yaml`,
          },
        },
        spec: {
          type: 'plugin',
          lifecycle: 'production',
          owner: 'redhat',
        },
      };
    });

    /** [5] */
    await this.connection.applyMutation({
      type: 'full',
      entities: entities.map(entity => ({
        entity,
        locationKey: `marketplace-plugin-provider:${this.env}`,
      })),
    });
  }
}
