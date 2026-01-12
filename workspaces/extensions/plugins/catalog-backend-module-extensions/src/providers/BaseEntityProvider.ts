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
import { Config } from '@backstage/config';
import { readYamlFiles } from '../utils/file-utils';
import { JsonFileData } from '../types';
import path from 'path';
import fs from 'fs';

/**
 * @public
 */
export abstract class BaseEntityProvider<T extends Entity>
  implements EntityProvider
{
  private connection?: EntityProviderConnection;
  private taskRunner: SchedulerServiceTaskRunner;
  private config?: Config;

  private static readonly EXTENSIONS_DIRECTORY = '/extensions';
  private static readonly DEPRECATED_MARKETPLACE_DIRECTORY = '/marketplace';

  constructor(taskRunner: SchedulerServiceTaskRunner, config?: Config) {
    this.taskRunner = taskRunner;
    this.config = config;
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

  /**
   * Resolves a directory path (absolute or relative to process.cwd())
   * and checks if it exists and is a directory
   */
  private resolveAndValidateDirectory(dirPath: string): string | null {
    const resolvedPath = path.isAbsolute(dirPath)
      ? dirPath
      : path.resolve(process.cwd(), dirPath);
    if (
      fs.existsSync(resolvedPath) &&
      fs.statSync(resolvedPath).isDirectory()
    ) {
      return resolvedPath;
    }

    return null;
  }

  /**
   * Gets the extensions directory path from config or falls back to hardcoded fallback directories
   * Priority:
   *   - configured directory (if specified)
   *   - 'opt/app-root/src/dynamic-plugins-root/extensions'
   *   - 'opt/app-root/src/dynamic-plugins-root/marketplace'
   *   - '/extensions' (filesystem root)
   *   - '/marketplace' (filesystem root)
   */
  private getExtensionsDirectory(): string | null {
    if (this.config) {
      try {
        const configuredDir = this.config.getOptionalString(
          'extensions.directory',
        );
        if (configuredDir) {
          const resolvedDir = this.resolveAndValidateDirectory(configuredDir);
          if (resolvedDir) {
            return resolvedDir;
          }
        }
      } catch (error) {
        console.warn(
          'Failed to read extensions directory from config, falling back to hardcoded fallbacks',
          error,
        );
      }
    }

    // Check fallback directories in priority order
    const fallbackDirectories = [
      BaseEntityProvider.EXTENSIONS_DIRECTORY,
      BaseEntityProvider.DEPRECATED_MARKETPLACE_DIRECTORY,
    ];

    for (const dir of fallbackDirectories) {
      const resolvedDir = this.resolveAndValidateDirectory(dir);
      if (resolvedDir) {
        return resolvedDir;
      }
    }

    console.warn(
      `Extensions directory not found. Checked: configured directory "${BaseEntityProvider.EXTENSIONS_DIRECTORY}" and "${BaseEntityProvider.DEPRECATED_MARKETPLACE_DIRECTORY}"`,
    );
    return null;
  }

  async run(): Promise<void> {
    if (!this.connection) {
      throw new Error('Not initialized');
    }

    const extensionsFilePath = this.getExtensionsDirectory();

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
