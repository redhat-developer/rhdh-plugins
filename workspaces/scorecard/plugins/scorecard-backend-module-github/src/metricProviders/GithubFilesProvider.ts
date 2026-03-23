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

import type { Config } from '@backstage/config';
import { getEntitySourceLocation, type Entity } from '@backstage/catalog-model';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import {
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { DEFAULT_FILE_CHECK_THRESHOLDS } from './GithubConfig';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { GithubClient } from '../github/GithubClient';
import { getRepositoryInformationFromEntity } from '../github/utils';
import { GithubFile, GithubFilesConfig } from '../github/types';

export class GithubFilesProvider implements MetricProvider<'boolean'> {
  private readonly githubClient: GithubClient;
  private readonly thresholds: ThresholdConfig;
  private readonly filesConfig: GithubFilesConfig;

  private constructor(config: Config, filesConfig: GithubFilesConfig) {
    this.githubClient = new GithubClient(config);
    this.filesConfig = filesConfig;
    this.thresholds = DEFAULT_FILE_CHECK_THRESHOLDS;
  }

  getProviderDatasourceId(): string {
    return 'github';
  }

  getProviderId(): string {
    return 'github.files_check';
  }

  getMetricIds(): string[] {
    return this.filesConfig.files.map(f => `github.files_check.${f.id}`);
  }

  getMetricType(): 'boolean' {
    return 'boolean';
  }

  // Single metric (for backward compatibility)
  getMetric(): Metric<'boolean'> {
    return this.getMetrics()[0];
  }

  // All metrics this provider exposes
  getMetrics(): Metric<'boolean'>[] {
    return this.filesConfig.files.map(f => ({
      id: `github.files_check.${f.id}`,
      title: `GitHub File: ${f.path}`,
      description: `Checks if ${f.path} exists in the repository.`,
      type: 'boolean' as const,
      history: true,
    }));
  }

  getMetricThresholds(): ThresholdConfig {
    return this.thresholds;
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.github.com/project-slug': CATALOG_FILTER_EXISTS,
    };
  }

  // Legacy single calculation (shouldn't be called for batch providers)
  async calculateMetric(entity: Entity): Promise<boolean> {
    const results = await this.calculateMetrics(entity);
    const firstId = this.getMetricIds()[0];
    return results.get(firstId) ?? false;
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, boolean>> {
    const repository = getRepositoryInformationFromEntity(entity);
    const { target } = getEntitySourceLocation(entity);

    const filePathMap = new Map<string, string>();
    for (const file of this.filesConfig.files) {
      filePathMap.set(`github.files_check.${file.id}`, file.path);
    }

    const existsMap = await this.githubClient.checkFilesExist(
      target,
      repository,
      filePathMap,
    );

    return existsMap;
  }

  static fromConfig(config: Config): GithubFilesProvider | undefined {
    const filesConfig = config.getOptionalConfigArray(
      'scorecard.plugins.github.files_check.files',
    );

    if (!filesConfig || filesConfig.length === 0) {
      return undefined;
    }

    const fileConfigs: GithubFile[] = filesConfig.map(fileConfig => {
      const keys = fileConfig.keys();
      if (keys.length !== 1) {
        throw new Error(
          'Each file config entry must have exactly one key-value pair',
        );
      }
      const id = keys[0];
      const path = fileConfig.getString(id);
      return { id, path };
    });

    return new GithubFilesProvider(config, { files: fileConfigs });
  }
}
