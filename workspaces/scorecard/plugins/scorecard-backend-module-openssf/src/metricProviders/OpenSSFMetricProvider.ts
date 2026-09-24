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

import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';
import { type Entity } from '@backstage/catalog-model';

import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

import { OpenSSFClient } from '../clients/OpenSSFClient';
import { OPENSSF_METRICS, OPENSSF_THRESHOLDS } from './OpenSSFConfig';

export class OpenSSFMetricProvider implements MetricProvider<'number'> {
  protected readonly openSSFClient: OpenSSFClient;

  constructor() {
    this.openSSFClient = new OpenSSFClient();
  }

  getProviderDatasourceId(): string {
    return 'openssf';
  }

  getProviderId(): string {
    return 'openssf.securityScorecard';
  }

  private metricIdForCheck(name: string): string {
    const normalized = name
      .toLowerCase()
      .replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    return `openssf.${normalized}`;
  }

  getMetrics(): Metric<'number'>[] {
    return OPENSSF_METRICS.map(config => ({
      id: this.metricIdForCheck(config.name),
      title: config.displayTitle,
      description: config.description,
      type: 'number',
      thresholds: OPENSSF_THRESHOLDS,
      history: true,
    }));
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      'metadata.annotations.openssf/scorecard-location': CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    // single call to OpenSSF Scorecard API
    const scorecard = await this.openSSFClient.getScorecard(entity);
    const results = new Map<string, number>();
    const allowedNames = new Set(OPENSSF_METRICS.map(m => m.name));

    for (const check of scorecard.checks) {
      if (!allowedNames.has(check.name)) continue; // linear
      if (check.score < 0 || check.score > 10) continue;
      results.set(this.metricIdForCheck(check.name), check.score);
    }
    return results;
  }
}

/**
 * Creates all default OpenSSF metric providers.
 * @returns Array of OpenSSF metric providers
 */
export function createOpenSSFMetricProvider(): OpenSSFMetricProvider {
  return new OpenSSFMetricProvider();
}
