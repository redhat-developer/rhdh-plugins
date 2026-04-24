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
 * 1. Exact key: metric.<metricId>.<field> (e.g. metric.github.open_prs.title)
 * 2. Template key: metric.<provider>.<field> with name = <rest of metricId>
 *    The first dot-separated segment is always the provider/namespace.
 *    E.g. filecheck.codeowners -> metric.filecheck.title with name = codeowners
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

  const dotIndex = metricId.indexOf('.');
  if (dotIndex !== -1) {
    const base = metricId.slice(0, dotIndex);
    const name = metricId.slice(dotIndex + 1);
    const templateKey = `metric.${base}.${field}`;
    const templateTranslated = t(templateKey as any, { name });
    if (templateTranslated !== templateKey) return templateTranslated;
  }

  return fallback ?? translated;
}
