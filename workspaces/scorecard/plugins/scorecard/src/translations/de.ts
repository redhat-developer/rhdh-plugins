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

import { createTranslationMessages } from '@backstage/core-plugin-api/alpha';
import { scorecardTranslationRef } from './ref';

const scorecardTranslationDe = createTranslationMessages({
  ref: scorecardTranslationRef,
  full: true,
  messages: {
    // Empty state
    'emptyState.title': 'Noch keine Scorecards hinzugefügt',
    'emptyState.description':
      'Scorecards helfen Ihnen, die Komponentengesundheit auf einen Blick zu überwachen. Um zu beginnen, erkunden Sie unsere Dokumentation für Einrichtungsrichtlinien.',
    'emptyState.button': 'Dokumentation anzeigen',
    'emptyState.altText': 'Keine Scorecards',

    // Permission required state
    'permissionRequired.title': 'Berechtigung fehlt',
    'permissionRequired.description':
      'Um das Scorecard-Plugin anzuzeigen, wenden Sie sich an Ihren Administrator, um die {{permission}} Berechtigung zu erteilen.',
    'permissionRequired.button': 'Mehr lesen',
    'permissionRequired.altText': 'Berechtigung erforderlich',

    // Error messages
    'errors.entityMissingProperties':
      'Entität fehlt erforderliche Eigenschaften für Scorecard-Suche',
    'errors.invalidApiResponse':
      'Ungültiges Antwortformat von der Scorecard-API',
    'errors.fetchError': 'Fehler beim Abrufen der Scorecards: {{error}}',
    'errors.metricDataUnavailable': 'Metrikdaten nicht verfügbar',
    'errors.invalidThresholds': 'Ungültige Schwellenwerte',
    'errors.missingPermission': 'Berechtigung fehlt',
    'errors.aggregationSkipped': 'Aggregation übersprungen',
    'errors.missingPermissionMessage':
      'Um die Scorecard-Metriken anzuzeigen, muss Ihr Administrator die erforderliche Berechtigung erteilen.',
    'errors.userNotFoundInCatalogMessage':
      'Benutzer-Entität in Katalog nicht gefunden',
    'errors.aggregationSkippedMessage':
      'Für diesen Metrikanbieter gibt es keine Metriken zum Aggregieren. Überprüfen Sie, ob die zugehörigen Entitäten Metrikwerte haben.',
    // Metric translations
    'metric.github.open_prs.title': 'GitHub offene PRs',
    'metric.github.open_prs.description':
      'Aktuelle Anzahl offener Pull Requests für ein bestimmtes GitHub-Repository.',
    'metric.jira.open_issues.title': 'Jira offene blockierende Tickets',
    'metric.jira.open_issues.description':
      'Hebt die Anzahl kritischer, blockierender Probleme hervor, die derzeit in Jira offen sind.',

    // Threshold translations
    'thresholds.success': 'Erfolg',
    'thresholds.warning': 'Warnung',
    'thresholds.error': 'Fehler',
    'thresholds.noEntities': 'Keine Entitäten in {{category}} Zustand',
    'thresholds.entities_one': '{{count}} Entität',
    'thresholds.entities_other': '{{count}} Entitäten',
  },
});

export default scorecardTranslationDe;
