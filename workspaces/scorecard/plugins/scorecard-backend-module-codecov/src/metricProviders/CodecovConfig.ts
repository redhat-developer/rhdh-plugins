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

import { Entity, stringifyEntityRef } from '@backstage/catalog-model';
import { ThresholdConfig } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import type { CodecovTotals } from '../clients/types';

export const CODECOV_REPO_ANNOTATION = 'codecov.io/repo';
export const CODECOV_ACCOUNT_ANNOTATION = 'codecov.io/account';
export const CODECOV_SERVICE_ANNOTATION = 'codecov.io/service';
export const CODECOV_OWNER_ANNOTATION = 'codecov.io/owner';
export const GITHUB_PROJECT_SLUG_ANNOTATION = 'github.com/project-slug';

export type CodecovEntityInfo = {
  service: string;
  owner: string;
  repo: string;
  accountName?: string;
};

/**
 * Resolves the Codecov entity information from annotations.
 */
export function resolveCodecovEntityInfo(entity: Entity): CodecovEntityInfo {
  const repoAnnotation = entity.metadata.annotations?.[CODECOV_REPO_ANNOTATION];
  if (!repoAnnotation) {
    throw new Error(
      `Missing annotation '${CODECOV_REPO_ANNOTATION}' for entity ${stringifyEntityRef(
        entity,
      )}`,
    );
  }

  const accountName = entity.metadata.annotations?.[CODECOV_ACCOUNT_ANNOTATION];

  // Resolve service
  const serviceAnnotation =
    entity.metadata.annotations?.[CODECOV_SERVICE_ANNOTATION];
  let service: string;
  if (serviceAnnotation) {
    service = serviceAnnotation;
  } else if (entity.metadata.annotations?.[GITHUB_PROJECT_SLUG_ANNOTATION]) {
    service = 'github';
  } else {
    throw new Error(
      `Cannot determine Codecov service for entity ${stringifyEntityRef(
        entity,
      )}. ` +
        `Set the '${CODECOV_SERVICE_ANNOTATION}' annotation or add '${GITHUB_PROJECT_SLUG_ANNOTATION}'.`,
    );
  }

  // Resolve owner and repo
  const ownerAnnotation =
    entity.metadata.annotations?.[CODECOV_OWNER_ANNOTATION];
  let owner: string;
  let repo: string;

  if (repoAnnotation.includes('/')) {
    const slashIndex = repoAnnotation.indexOf('/');
    owner = ownerAnnotation ?? repoAnnotation.substring(0, slashIndex);
    repo = repoAnnotation.substring(slashIndex + 1);
  } else {
    if (!ownerAnnotation) {
      throw new Error(
        `Cannot determine Codecov owner for entity ${stringifyEntityRef(
          entity,
        )}. ` +
          `Set the '${CODECOV_OWNER_ANNOTATION}' annotation or use 'owner/repo' format in '${CODECOV_REPO_ANNOTATION}'.`,
      );
    }
    owner = ownerAnnotation;
    repo = repoAnnotation;
  }

  return { service, owner, repo, accountName };
}

export const CODECOV_METRICS = [
  'coverage',
  'coverage_trend',
  'tracked_files',
  'tracked_lines',
  'covered_lines',
  'partial_lines',
  'missed_lines',
] as const;

export type CodecovMetricId = (typeof CODECOV_METRICS)[number];

export const CODECOV_METRIC_CONFIG: Record<
  CodecovMetricId,
  { id: string; title: string; description: string }
> = {
  coverage: {
    id: 'codecov.coverage',
    title: 'Codecov Code Coverage',
    description: 'Current code coverage percentage for the default branch.',
  },
  coverage_trend: {
    id: 'codecov.coverage_trend',
    title: 'Codecov Coverage Trend (7d)',
    description: 'Code coverage trend for the last 7 days.',
  },
  tracked_files: {
    id: 'codecov.tracked_files',
    title: 'Codecov Tracked Files',
    description: 'Number of files tracked by Codecov.',
  },
  tracked_lines: {
    id: 'codecov.tracked_lines',
    title: 'Codecov Tracked Lines',
    description: 'Total lines of code tracked by Codecov.',
  },
  covered_lines: {
    id: 'codecov.covered_lines',
    title: 'Codecov Covered Lines',
    description: 'Number of lines covered by tests.',
  },
  partial_lines: {
    id: 'codecov.partial_lines',
    title: 'Codecov Partial Lines',
    description: 'Number of partially covered lines.',
  },
  missed_lines: {
    id: 'codecov.missed_lines',
    title: 'Codecov Missed Lines',
    description: 'Number of lines not covered by tests.',
  },
};

/**
 * Maps scorecard metric IDs to the field in the Codecov API totals response.
 */
export const CODECOV_TOTALS_FIELD_MAP: Record<
  CodecovMetricId,
  keyof CodecovTotals | 'diff'
> = {
  coverage: 'coverage',
  coverage_trend: 'diff',
  tracked_files: 'files',
  tracked_lines: 'lines',
  covered_lines: 'hits',
  partial_lines: 'partials',
  missed_lines: 'misses',
};

export const CODECOV_NUMBER_THRESHOLDS: Record<
  CodecovMetricId,
  ThresholdConfig
> = {
  coverage: {
    rules: [
      { key: 'success', expression: '>80' },
      { key: 'warning', expression: '50-80' },
      { key: 'error', expression: '<50' },
    ],
  },
  coverage_trend: {
    rules: [
      { key: 'success', expression: '>0' },
      { key: 'warning', expression: '==0' },
      { key: 'error', expression: '<0' },
    ],
  },
  tracked_files: {
    rules: [
      { key: 'success', expression: '>0' },
      { key: 'error', expression: '==0' },
    ],
  },
  tracked_lines: {
    rules: [
      { key: 'success', expression: '>0' },
      { key: 'error', expression: '==0' },
    ],
  },
  covered_lines: {
    rules: [
      { key: 'success', expression: '>0' },
      { key: 'error', expression: '==0' },
    ],
  },
  partial_lines: {
    rules: [
      { key: 'success', expression: '<10' },
      { key: 'warning', expression: '10-50' },
      { key: 'error', expression: '>50' },
    ],
  },
  missed_lines: {
    rules: [
      { key: 'success', expression: '<10' },
      { key: 'warning', expression: '10-50' },
      { key: 'error', expression: '>50' },
    ],
  },
};
