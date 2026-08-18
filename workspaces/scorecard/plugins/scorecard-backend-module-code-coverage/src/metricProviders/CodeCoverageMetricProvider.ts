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
  Metric,
  ThresholdConfig,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { MetricProvider } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import type { Entity } from '@backstage/catalog-model';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { CATALOG_FILTER_EXISTS } from '@backstage/catalog-client';

import { CodeCoverageClient } from '../clients/CodeCoverageClient';
import { CODE_COVERAGE_ANNOTATION } from './CodeCoverageConfig';

export const CODE_COVERAGE_METRICS = [
  'linePercentage',
  'lineAvailable',
  'lineCovered',
  'lineMissed',
  'branchPercentage',
  'branchAvailable',
  'branchCovered',
  'branchMissed',
] as const;

export type CodeCoverageMetricId = (typeof CODE_COVERAGE_METRICS)[number];

export const CODE_COVERAGE_METRIC_CONFIG: Record<
  CodeCoverageMetricId,
  { id: string; title: string; description: string }
> = {
  linePercentage: {
    id: 'codeCoverage.linePercentage',
    title: 'Code coverage (Lines)',
    description: 'Percentage of lines covered by tests.',
  },
  lineAvailable: {
    id: 'codeCoverage.lineAvailable',
    title: 'Code coverage - Tracked lines of code',
    description: 'Total number of lines tracked for code coverage.',
  },
  lineCovered: {
    id: 'codeCoverage.lineCovered',
    title: 'Code coverage - Covered lines of code',
    description: 'Number of lines covered by tests.',
  },
  lineMissed: {
    id: 'codeCoverage.lineMissed',
    title: 'Code coverage - Missed lines of code',
    description: 'Number of lines not covered by tests.',
  },
  branchPercentage: {
    id: 'codeCoverage.branchPercentage',
    title: 'Code coverage (Branches)',
    description: 'Percentage of branches covered by tests.',
  },
  branchAvailable: {
    id: 'codeCoverage.branchAvailable',
    title: 'Code coverage - Tracked branches',
    description: 'Total number of branches tracked for code coverage.',
  },
  branchCovered: {
    id: 'codeCoverage.branchCovered',
    title: 'Code coverage - Covered branches',
    description: 'Number of branches covered by tests.',
  },
  branchMissed: {
    id: 'codeCoverage.branchMissed',
    title: 'Code coverage - Missed branches',
    description: 'Number of branches not covered by tests.',
  },
};

/**
 * Maps metric IDs to the path within the code-coverage report aggregate.
 */
export const CODE_COVERAGE_AGGREGATE_KEYS: Record<
  CodeCoverageMetricId,
  {
    section: 'line' | 'branch';
    field: 'percentage' | 'available' | 'covered' | 'missed';
  }
> = {
  linePercentage: { section: 'line', field: 'percentage' },
  lineAvailable: { section: 'line', field: 'available' },
  lineCovered: { section: 'line', field: 'covered' },
  lineMissed: { section: 'line', field: 'missed' },
  branchPercentage: { section: 'branch', field: 'percentage' },
  branchAvailable: { section: 'branch', field: 'available' },
  branchCovered: { section: 'branch', field: 'covered' },
  branchMissed: { section: 'branch', field: 'missed' },
};

const PERCENTAGE_THRESHOLDS: ThresholdConfig = {
  rules: [
    { key: 'success', expression: '>80' },
    { key: 'warning', expression: '50-80' },
    { key: 'error', expression: '<50' },
  ],
};

const COUNT_THRESHOLDS: ThresholdConfig = {
  rules: [],
};

export const CODE_COVERAGE_THRESHOLDS: Record<
  CodeCoverageMetricId,
  ThresholdConfig
> = {
  linePercentage: PERCENTAGE_THRESHOLDS,
  lineAvailable: COUNT_THRESHOLDS,
  lineCovered: COUNT_THRESHOLDS,
  lineMissed: COUNT_THRESHOLDS,
  branchPercentage: PERCENTAGE_THRESHOLDS,
  branchAvailable: COUNT_THRESHOLDS,
  branchCovered: COUNT_THRESHOLDS,
  branchMissed: COUNT_THRESHOLDS,
};

/**
 * Metric provider for all code-coverage metrics.
 * A single instance provides all eight metrics (line/branch × percentage/available/covered/missed).
 */
export class CodeCoverageMetricProvider implements MetricProvider<'number'> {
  private readonly client: CodeCoverageClient;

  constructor(client: CodeCoverageClient) {
    this.client = client;
  }

  getProviderDatasourceId(): string {
    return 'codeCoverage';
  }

  getProviderId(): string {
    return 'codeCoverage.coverageReport';
  }

  getMetrics(): Metric<'number'>[] {
    return CODE_COVERAGE_METRICS.map(metricId => {
      const meta = CODE_COVERAGE_METRIC_CONFIG[metricId];
      return {
        id: meta.id,
        title: meta.title,
        description: meta.description,
        type: 'number' as const,
        thresholds: CODE_COVERAGE_THRESHOLDS[metricId],
        history: true,
      };
    });
  }

  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
    return {
      [`metadata.annotations.${CODE_COVERAGE_ANNOTATION}`]:
        CATALOG_FILTER_EXISTS,
    };
  }

  async calculateMetrics(entity: Entity): Promise<Map<string, number>> {
    const entityRef = stringifyEntityRef(entity);
    const report = await this.client.getReport(entityRef);
    const results = new Map<string, number>();

    for (const metricId of CODE_COVERAGE_METRICS) {
      const mapping = CODE_COVERAGE_AGGREGATE_KEYS[metricId];
      const section = report.aggregate?.[mapping.section];
      if (!section) {
        throw new Error(
          `Code coverage report for ${entityRef} is missing aggregate ${mapping.section} data`,
        );
      }
      const value = section[mapping.field];
      if (value === undefined || value === null) {
        throw new Error(
          `Code coverage report for ${entityRef} is missing ${mapping.section}.${mapping.field} data`,
        );
      }
      results.set(CODE_COVERAGE_METRIC_CONFIG[metricId].id, value);
    }

    return results;
  }
}
