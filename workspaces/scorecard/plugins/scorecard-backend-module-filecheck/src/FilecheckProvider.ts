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
import type { UrlReaderService } from '@backstage/backend-plugin-api';
import { getEntitySourceLocation, type Entity } from '@backstage/catalog-model';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { NotFoundError } from '@backstage/errors';
import { type ScmIntegration, ScmIntegrations } from '@backstage/integration';
import {
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { DEFAULT_FILECHECK_THRESHOLDS } from './config';
import { FilecheckEntry, FilecheckConfig } from './types';

const INVALID_PATH_CHARS = /[\n\r"\\]/;

function validateFilePath(id: string, path: string): void {
  if (INVALID_PATH_CHARS.test(path)) {
    throw new Error(
      `Invalid file path for '${id}': path must not contain newlines, quotes, or backslashes`,
    );
  }
  if (path.startsWith('/') || path.startsWith('./')) {
    throw new Error(
      `Invalid file path for '${id}': path must be relative without leading './' or '/'`,
    );
  }
}

const BRANCH_REF_PATTERNS: Record<string, RegExp> = {
  github: /\/(blob|tree|edit)\//,
  gitlab: /\/\-\/(blob|tree|edit)\//,
  bitbucketCloud: /\/(src|raw)\//,
  bitbucketServer: /\/browse\//,
};

const DEFAULT_REF_SUFFIXES: Record<string, string> = {
  github: '/blob/HEAD/',
  gitlab: '/-/blob/HEAD/',
  bitbucketCloud: '/src/HEAD/',
  bitbucketServer: '/browse/',
};

/**
 * Bare repo URLs (e.g. "https://github.com/org/repo") lack a branch reference,
 * which causes `resolveUrl` to produce URLs like "/org/repo/README.md" that the
 * UrlReader cannot parse. This function appends a default branch ref (HEAD) when
 * the URL doesn't already contain one.
 */
function ensureBranchRef(target: string, integration: ScmIntegration): string {
  const pattern = BRANCH_REF_PATTERNS[integration.type];
  if (pattern && pattern.test(target)) {
    return target;
  }

  const suffix = DEFAULT_REF_SUFFIXES[integration.type] ?? '/blob/HEAD/';
  return `${target.replace(/\/$/, '')}${suffix}`;
}

export class FilecheckProvider implements MetricProvider<'boolean'> {
  private readonly urlReader: UrlReaderService;
  private readonly integrations: ScmIntegrations;
  private readonly thresholds: ThresholdConfig;
  private readonly filesConfig: FilecheckConfig;

  private constructor(
    urlReader: UrlReaderService,
    integrations: ScmIntegrations,
    filesConfig: FilecheckConfig,
  ) {
    this.urlReader = urlReader;
    this.integrations = integrations;
    this.filesConfig = filesConfig;
    this.thresholds = DEFAULT_FILECHECK_THRESHOLDS;
  }

  getProviderDatasourceId(): string {
    return 'filecheck';
  }

  getProviderId(): string {
    return 'filecheck';
  }

  getMetricIds(): string[] {
    return this.filesConfig.files.map(f => `filecheck.${f.id}`);
  }

  getMetricType(): 'boolean' {
    return 'boolean';
  }

  getMetric(): Metric<'boolean'> {
    return this.getMetrics()[0];
  }

  getMetrics(): Metric<'boolean'>[] {
    return this.filesConfig.files.map(f => ({
      id: `filecheck.${f.id}`,
      title: `File: ${f.path}`,
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
      'metadata.annotations.backstage.io/source-location':
        CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetric(entity: Entity): Promise<boolean> {
    const results = await this.calculateMetrics(entity);
    const firstId = this.getMetricIds()[0];
    return results.get(firstId) ?? false;
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, boolean>> {
    const { target } = getEntitySourceLocation(entity);
    const integration = this.integrations.byUrl(target);

    if (!integration) {
      throw new Error(`No SCM integration found for URL '${target}'`);
    }

    // Source locations like "https://github.com/org/repo" are bare repo URLs
    // without a branch reference. resolveUrl needs a branch context to produce
    // valid file URLs (e.g. /blob/main/README.md), so we normalize by
    // appending a default ref when one is missing.
    const baseUrl = ensureBranchRef(target, integration);
    const results = new Map<string, boolean>();

    await Promise.all(
      this.filesConfig.files.map(async file => {
        const metricId = `filecheck.${file.id}`;
        const fileUrl = integration.resolveUrl({
          url: `/${file.path}`,
          base: baseUrl,
        });

        try {
          await this.urlReader.readUrl(fileUrl);
          results.set(metricId, true);
        } catch (error) {
          if (error instanceof NotFoundError) {
            results.set(metricId, false);
          } else {
            throw error;
          }
        }
      }),
    );

    return results;
  }

  static fromConfig(
    config: Config,
    urlReader: UrlReaderService,
  ): FilecheckProvider | undefined {
    const filesConfig = config.getOptionalConfigArray(
      'scorecard.plugins.filecheck.files',
    );

    if (!filesConfig || filesConfig.length === 0) {
      return undefined;
    }

    const fileConfigs: FilecheckEntry[] = filesConfig.map(fileConfig => {
      const keys = fileConfig.keys();
      if (keys.length !== 1) {
        throw new Error(
          'Each file config entry must have exactly one key-value pair',
        );
      }
      const id = keys[0];
      const path = fileConfig.getString(id);
      validateFilePath(id, path);
      return { id, path };
    });

    const integrations = ScmIntegrations.fromConfig(config);

    return new FilecheckProvider(urlReader, integrations, {
      files: fileConfigs,
    });
  }
}
