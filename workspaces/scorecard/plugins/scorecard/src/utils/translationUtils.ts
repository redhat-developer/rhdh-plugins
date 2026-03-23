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

import { TranslationFunction } from '@backstage/core-plugin-api/alpha';
import { scorecardTranslationRef } from '../translations';

type ScorecardTranslationFunction = TranslationFunction<
  typeof scorecardTranslationRef.T
>;

/**
 * Resolves a metric's translated title or description using a cascading lookup:
 *
 * 1. Exact key: metric.metricId.field (e.g. metric.github.open_prs.title)
 * 2. Parent key with instance suffix as name param:
 *    for a metric ID with 3+ dot-separated segments, strips the suffix after
 *    the first two segments and tries metric.base.field with name = suffix.
 *    E.g. github.files_check.readme tries metric.github.files_check.title
 *    with name = readme.
 * 3. Falls back to `fallback` when provided, otherwise returns the raw
 *    translation key.
 */
export function resolveMetricTranslation(
  t: ScorecardTranslationFunction,
  metricId: string,
  field: 'title' | 'description',
  fallback?: string,
): string {
  const key = `metric.${metricId}.${field}`;
  const translated = t(key as any, {});
  if (translated !== key) return translated;

  const segments = metricId.split('.');
  if (segments.length > 2) {
    const base = segments.slice(0, 2).join('.');
    const name = segments.slice(2).join('.');
    const parentKey = `metric.${base}.${field}`;
    const parentTranslated = t(parentKey as any, { name });
    if (parentTranslated !== parentKey) return parentTranslated;
  }

  return fallback ?? translated;
}
