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

/** English (ref) metric title – matches API metadata.title used when i18n falls back. */
export function getMetricTitleEn(
  metricId: 'jira.open_issues' | 'github.open_prs',
): string {
  return scorecardMessages.metric[metricId].title;
}

function transform(messages: typeof scorecardTranslationDe.messages) {
  const result = Object.keys(messages).reduce((res, key) => {
    // metric.github.open_prs.title -> metric['github.open_prs'].title
    // metric.openPrsKpi.title -> metric['openPrsKpi'].title (KPI / aggregation id)
    if (key.startsWith('metric.')) {
      const parts = key.split('.');
      let metricId: string;
      let property: string;
      if (parts.length >= 4) {
        metricId = `${parts[1]}.${parts[2]}`;
        property = parts[3];
      } else if (parts.length === 3) {
        metricId = parts[1];
        property = parts[2];
      } else {
        metricId = '';
        property = '';
      }

      if (metricId && property) {
        if (!res.metric) {
          res.metric = {};
        }
        if (!res.metric[metricId]) {
          res.metric[metricId] = {};
        }
        res.metric[metricId][property] = messages[key];
        return res;
      }
    }

    {
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

/**
 * Fallbacks in the helpers below are defensive (used only if a key is missing
 * from the transformed locale object, e.g. unknown locale). All fallbacks use
 * scorecardMessages (ref) as the single source of truth so they never drift.
 */
export function getEntityCount(
  translations: ScorecardMessages,
  locale: string,
  count: string,
) {
  const useSingular =
    count === '1' || (locale.startsWith('fr') && count === '0');
  const key = useSingular
    ? translations.thresholds.entities_one ??
      scorecardMessages.thresholds.entities_one
    : translations.thresholds.entities_other ??
      scorecardMessages.thresholds.entities_other;
  return evaluateMessage(key, count);
}

/**
 * Mirrors the formatDate logic in entityTableUtils.ts so e2e tests produce
 * the same locale-aware calendar string that the plugin renders in the browser.
 */
export function formatLastUpdatedDate(
  timestamp: string,
  locale: string,
): string {
  const date = new Date(timestamp);
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone,
  }).format(date);
}

/** Returns the translated label for "entities" (e.g. "entities", "entités", "Elemente"). */
export function getEntitiesLabel(translations: ScorecardMessages): string {
  const template =
    translations.thresholds.entities_other ??
    scorecardMessages.thresholds.entities_other;
  return template.replace(/\{\{count\}\}\s*/, '').trim();
}

/** Entities table "no data" message for the drill-down page (locale-aware). */
export function getEntitiesPageNoDataFound(
  translations: ScorecardMessages,
): string {
  return (
    (translations as { entitiesPage?: { noDataFound?: string } }).entitiesPage
      ?.noDataFound ?? scorecardMessages.entitiesPage.noDataFound
  );
}

/** Entities table "missing permission" message for the drill-down page (locale-aware). */
export function getEntitiesPageMissingPermission(
  translations: ScorecardMessages,
): string {
  return (
    (translations as { entitiesPage?: { missingPermission?: string } })
      .entitiesPage?.missingPermission ??
    scorecardMessages.entitiesPage.missingPermission
  );
}

/** Rows-per-page label (e.g. "5 rows", "5 lignes"). Used for dropdown and listbox options. */
export function getEntitiesTableFooterRowsLabel(
  translations: ScorecardMessages,
  count: number,
): string {
  const footer = (
    translations as {
      entitiesPage?: {
        entitiesTable?: { footer?: { rows_one?: string; rows_other?: string } };
      };
    }
  ).entitiesPage?.entitiesTable?.footer;
  const template =
    count === 1
      ? footer?.rows_one ??
        scorecardMessages.entitiesPage.entitiesTable.footer.rows_one
      : footer?.rows_other ??
        scorecardMessages.entitiesPage.entitiesTable.footer.rows_other;
  return template.replace(/\{\{count\}\}/g, String(count));
}

/**
 * Locale-aware table footer aria snapshot. Pass start/end/total for range text;
 * disabled: 'first' | 'last' | 'only' | 'none' controls which pagination buttons are [disabled].
 */
export function getTableFooterSnapshot(
  translations: ScorecardMessages,
  params: {
    start: number;
    end: number;
    total: number;
    rowsLabel?: string;
    disabled: 'first' | 'last' | 'only' | 'none';
  },
): string {
  const footer = (
    translations as {
      entitiesPage?: { entitiesTable?: { footer?: { of?: string } } };
    }
  ).entitiesPage?.entitiesTable?.footer;
  const of =
    footer?.of ?? scorecardMessages.entitiesPage.entitiesTable.footer.of;
  const rangeText = `${params.start}-${params.end} ${of} ${params.total}`;
  const { rowsLabel, disabled: d } = params;
  let first = '';
  let prev = '';
  let next = '';
  let last = '';
  if (d === 'only') {
    first = prev = next = last = ' [disabled]';
  } else if (d === 'first') {
    first = prev = ' [disabled]';
  } else if (d === 'last') {
    next = last = ' [disabled]';
  }
  const rowParts = [
    'first page',
    'previous page',
    rangeText,
    'next page',
    'last page',
  ];
  if (rowsLabel) rowParts.unshift(rowsLabel);
  const rowName = rowParts.join(' ');
  const cellContent: string[] = [];
  if (rowsLabel) {
    cellContent.push('- paragraph', `- combobox "${rowsLabel}"`);
  }
  cellContent.push(
    `- button "first page"${first}`,
    `- button "previous page"${prev}`,
    `- text: ${rangeText}`,
    `- button "next page"${next}`,
    `- button "last page"${last}`,
  );
  return `
- rowgroup:
  - row "${rowName}":
    - cell "${rowName}":
${cellContent.map(l => `      ${l}`).join('\n')}
`;
}

/** Entities table column header labels for the drill-down page (locale-aware). */
export function getEntitiesTableHeaderLabels(translations: ScorecardMessages) {
  const header = (
    translations as {
      entitiesPage?: { entitiesTable?: { header?: Record<string, string> } };
    }
  ).entitiesPage?.entitiesTable?.header;
  const h = scorecardMessages.entitiesPage.entitiesTable.header;
  return {
    /** First column: status/metric state (ref key `header.status`). */
    status: header?.status ?? h.status,
    value: header?.value ?? h.value,
    entity: header?.entity ?? h.entity,
    owner: header?.owner ?? h.owner,
    kind: header?.kind ?? h.kind,
    lastUpdated: header?.lastUpdated ?? h.lastUpdated,
  };
}

export function getLastUpdatedLabel(
  translations: ScorecardMessages,
  formattedTimestamp: string,
) {
  const template =
    (translations.metric as { lastUpdated?: string }).lastUpdated ??
    scorecardMessages.metric.lastUpdated;
  return evaluateMessage(template, formattedTimestamp);
}

/**
 * Homepage KPI drill-down link text: healthy entities vs entities considered (RHIDP-13128).
 */
export function getHomepageEntityCalculationHealthText(
  translations: ScorecardMessages,
  healthy: string,
  total: string,
): string {
  const template =
    (translations.metric as { homepageEntityCalculationHealth?: string })
      .homepageEntityCalculationHealth ??
    scorecardMessages.metric.homepageEntityCalculationHealth;
  return template
    .replaceAll('{{healthy}}', healthy)
    .replaceAll('{{total}}', total);
}

/** Snapshot for the scorecard card on the drill-down page when permission is missing (no entity count in UI). */
export function getDrillDownMissingPermissionSnapshot(
  translations: ScorecardMessages,
  metricId: 'jira.open_issues' | 'github.open_prs',
) {
  return `
        - article:
          - text: ${translations.metric[metricId].title}
          - separator
          - paragraph: ${translations.metric[metricId].description}
          - text: "--"
          - application: ${translations.errors.missingPermission}
        `;
}

/** Snapshot for the scorecard card on the drill-down page when there is no data (no entity count in UI). */
export function getDrillDownNoDataFoundSnapshot(
  translations: ScorecardMessages,
  metricId: 'jira.open_issues' | 'github.open_prs',
) {
  return `
        - article:
          - text: ${translations.metric[metricId].title}
          - separator
          - paragraph: ${translations.metric[metricId].description}
          - text: "--"
          - application: ${translations.errors.noDataFound}
        `;
}

export function getThresholdsSnapshot(
  translations: ScorecardMessages,
  options: {
    drillDownMetricId: 'jira.open_issues' | 'github.open_prs';
    drillDownAggregationId?: string;
    /** Interpolation for `metric.homepageEntityCalculationHealth` (mock data uses 10/10). */
    homepageCalculationHealth?: { healthy: string; total: string };
    cardTitle: string;
    cardDescription: string;
  },
): string {
  const {
    drillDownMetricId,
    drillDownAggregationId,
    cardTitle,
    cardDescription,
  } = options;
  const aggregationSegment = drillDownAggregationId ?? drillDownMetricId;
  const { healthy, total } = options.homepageCalculationHealth ?? {
    healthy: '10',
    total: '10',
  };
  const drillDownLinkText = getHomepageEntityCalculationHealthText(
    translations,
    healthy,
    total,
  );
  return `
        - article:
          - text: ${cardTitle}
          - link "${drillDownLinkText}":
            - /url: /scorecard/aggregations/${aggregationSegment}/metrics/${drillDownMetricId}
          - button
          - separator
          - paragraph: ${cardDescription}
          - paragraph: ${translations.thresholds.success}
          - paragraph: ${translations.thresholds.warning}
          - paragraph: ${translations.thresholds.error}
          - application
        `;
}

/** Snapshot for the scorecard card on the drill-down page (same as thresholds but without the entities link). */
export function getDrillDownCardSnapshot(
  translations: ScorecardMessages,
  metricId: 'jira.open_issues' | 'github.open_prs',
  options?: {
    title?: string;
    description?: string;
  },
) {
  const title = options?.title ?? translations.metric[metricId].title;
  const description =
    options?.description ?? translations.metric[metricId].description;
  return `
        - article:
          - text: ${title}
          - separator
          - paragraph: ${description}
          - paragraph: ${translations.thresholds.success}
          - paragraph: ${translations.thresholds.warning}
          - paragraph: ${translations.thresholds.error}
          - application
        `;
}
