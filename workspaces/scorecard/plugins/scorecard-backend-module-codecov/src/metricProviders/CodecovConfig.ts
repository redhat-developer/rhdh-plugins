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
