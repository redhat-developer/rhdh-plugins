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

/* eslint-disable @backstage/no-relative-monorepo-imports */
import { scorecardMessages } from '../../../../plugins/scorecard/src/translations/ref';
import scorecardTranslationDe from '../../../../plugins/scorecard/src/translations/de';
import scorecardTranslationFr from '../../../../plugins/scorecard/src/translations/fr';
import scorecardTranslationEs from '../../../../plugins/scorecard/src/translations/es';
import scorecardTranslationIt from '../../../../plugins/scorecard/src/translations/it';
import scorecardTranslationJa from '../../../../plugins/scorecard/src/translations/ja';
/* eslint-enable @backstage/no-relative-monorepo-imports */

export type ScorecardMessages = typeof scorecardMessages;

function transform(messages: typeof scorecardTranslationDe.messages) {
  const result = Object.keys(messages).reduce((res, key) => {
    // Special handling for metric keys: metric.github.open_prs.title -> metric['github.open_prs'].title
    if (key.startsWith('metric.') && key.split('.').length >= 4) {
      const parts = key.split('.');
      const metricId = `${parts[1]}.${parts[2]}`;
      const property = parts[3];

      if (!res.metric) {
        res.metric = {};
      }
      if (!res.metric[metricId]) {
        res.metric[metricId] = {};
      }
      res.metric[metricId][property] = messages[key];
    } else {
      // Standard path handling for other keys
      const path = key.split('.');
      const lastIndex = path.length - 1;
      path.reduce((acc, currentPath, i) => {
        acc[currentPath] =
          lastIndex === i ? messages[key] : acc[currentPath] || {};
        return acc[currentPath];
      }, res);
    }
    return res;
  }, {} as any);

  return result as ScorecardMessages;
}

export function getTranslations(locale: string) {
  const lang = locale.split('-')[0];
  switch (lang) {
    case 'en':
      return scorecardMessages;
    case 'fr':
      return transform(scorecardTranslationFr.messages);
    case 'de':
      return transform(scorecardTranslationDe.messages);
    case 'es':
      return transform(scorecardTranslationEs.messages);
    case 'it':
      return transform(scorecardTranslationIt.messages);
    case 'ja':
      return transform(scorecardTranslationJa.messages);
    default:
      return scorecardMessages;
  }
}

export function evaluateMessage(message: string, value: string) {
  const startIndex = message.indexOf('{{');
  if (startIndex === -1) {
    return message;
  }
  const endIndex = message.indexOf('}}', startIndex + 2);
  if (endIndex === -1) {
    return message;
  }
  return (
    message.substring(0, startIndex) + value + message.substring(endIndex + 2)
  );
}

export function getEntityCount(
  translations: ScorecardMessages,
  locale: string,
  count: string,
) {
  const useSingular =
    count === '1' || (locale.startsWith('fr') && count === '0');
  const key = useSingular
    ? translations.thresholds.entities_one ?? '{{count}} entity'
    : translations.thresholds.entities_other ?? '{{count}} entities';
  return evaluateMessage(key, count);
}

export function getMissingPermissionSnapshot(
  translations: ScorecardMessages,
  metricId: 'jira.open_issues' | 'github.open_prs',
  entityCount: string,
) {
  return `
        - article:
          - text: ${translations.metric[metricId].title} ${entityCount}
          - separator
          - paragraph: ${translations.metric[metricId].description}
          - text: "--"
          - application: ${translations.errors.missingPermission}
        `;
}

export function getThresholdsSnapshot(
  translations: ScorecardMessages,
  metricId: 'jira.open_issues' | 'github.open_prs',
  entityCount: string,
) {
  return `
        - article:
          - text: ${translations.metric[metricId].title} ${entityCount}
          - separator
          - paragraph: ${translations.metric[metricId].description}
          - paragraph: ${translations.thresholds.success}
          - paragraph: ${translations.thresholds.warning}
          - paragraph: ${translations.thresholds.error}
          - application
        `;
}
