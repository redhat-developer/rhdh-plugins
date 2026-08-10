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

import type { Entity } from '@backstage/catalog-model';
import {
  sanitizeValue,
  validateIdentifier,
  validateJQLValue,
} from '../clients/utils';
import type { JiraFilterAnnotations, JiraJqlFilters } from './types';

/**
 * Reads entity annotations via the given filter-slot map and returns JQL
 * clauses ready to AND together.
 */
export function buildJqlFiltersFromEntity(
  entity: Entity,
  filterAnnotations: JiraFilterAnnotations,
  options?: { projectFallback?: string },
): JiraJqlFilters {
  const annotations = entity?.metadata?.annotations || {};
  const projectValue =
    annotations[filterAnnotations.project] ??
    (options?.projectFallback
      ? annotations[options.projectFallback]
      : undefined);

  if (!projectValue) {
    const requiredKeys = options?.projectFallback
      ? `'${filterAnnotations.project}' or '${options.projectFallback}'`
      : `'${filterAnnotations.project}'`;
    throw new Error(
      `Missing required ${requiredKeys} annotation for entity '${
        entity.metadata?.name || 'unknown'
      }'`,
    );
  }

  const projectAnnotationKey = annotations[filterAnnotations.project]
    ? filterAnnotations.project
    : options?.projectFallback ?? filterAnnotations.project;

  const filters: JiraJqlFilters = {
    project: `project = "${validateJQLValue(
      sanitizeValue(projectValue),
      projectAnnotationKey,
    )}"`,
  };

  if (filterAnnotations.component) {
    const component = annotations[filterAnnotations.component];
    if (component) {
      filters.component = `component = "${validateJQLValue(
        sanitizeValue(component),
        filterAnnotations.component,
      )}"`;
    }
  }

  if (filterAnnotations.label) {
    const label = annotations[filterAnnotations.label];
    if (label) {
      filters.label = `labels = "${validateJQLValue(
        sanitizeValue(label),
        filterAnnotations.label,
      )}"`;
    }
  }

  if (filterAnnotations.team) {
    const team = annotations[filterAnnotations.team];
    if (team) {
      filters.team = `team = ${validateIdentifier(
        sanitizeValue(team),
        filterAnnotations.team,
      )}`;
    }
  }

  if (filterAnnotations.customFilter) {
    const customFilter = annotations[filterAnnotations.customFilter];
    if (customFilter) {
      filters.customFilter = customFilter;
    }
  }

  return filters;
}
