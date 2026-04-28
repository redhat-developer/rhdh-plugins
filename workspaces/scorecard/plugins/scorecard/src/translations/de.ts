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

/**
 * de translation for plugin.scorecard.
 * @public
 */
const scorecardTranslationDe = createTranslationMessages({
  ref: scorecardTranslationRef,
  messages: {
    // Empty state translations
    'emptyState.title': 'Noch keine Scorecards hinzugefügt',
    'emptyState.description':
      'Scorecards helfen Ihnen, den Zustand der Komponenten auf einen Blick zu überwachen. Schauen Sie sich zunächst unsere Dokumentation mit den Einrichtungshinweisen an.',
    'emptyState.button': 'Dokumentation anzeigen',
    'emptyState.altText': 'Keine Scorecards',

    // Permission required translations
    'permissionRequired.title': 'Fehlende Berechtigung',
    'permissionRequired.description':
      'Wenn Sie das Scorecard-Plugin anzeigen möchten, wenden Sie sich an den Administrator, um die Berechtigung {{permission}} zu erhalten.',
    'permissionRequired.button': 'Mehr erfahren',
    'permissionRequired.altText': 'Berechtigung erforderlich',

    // Common UI
    'common.loading': 'Wird geladen',

    // Not found state
    'notFound.title': '404 Diese Seite wurde nicht gefunden',
    'notFound.description':
      'Fügen Sie eine {{indexFile}}-Datei im Stammverzeichnis des docs-Ordners dieses Repositorys hinzu.',
    'notFound.readMore': 'Mehr erfahren',
    'notFound.goBack': 'Zurück',
    'notFound.contactSupport': 'Support kontaktieren',
    'notFound.altText': 'Seite nicht gefunden',

    // Error messages
    'errors.entityMissingProperties':
      'Für die Scorecard-Suche fehlen dem Element die erforderlichen Eigenschaften.',
    'errors.missingAggregationId':
      'Die Scorecard ist falsch konfiguriert; die Eigenschaft „Aggregations-ID“ (oder „Metrik-ID“) wurde nicht angegeben',
    'errors.invalidApiResponse': 'Ungültiges Antwortformat der Scorecard-API',
    'errors.fetchError': 'Fehler beim Abrufen der Scorecards: {{error}}',
    'errors.metricDataUnavailable': 'Metrikdaten nicht verfügbar',
    'errors.invalidThresholds': 'Ungültige Schwellenwerte',
    'errors.missingPermission': 'Fehlende Berechtigung',
    'errors.noDataFound': 'Keine Daten gefunden',
    'errors.authenticationError': 'Authentifizierungsfehler',
    'errors.missingPermissionMessage':
      'Um die Metriken der Scorecard einzusehen, muss Ihnen der Administrator die erforderliche Berechtigung erteilen.',
    'errors.userNotFoundInCatalogMessage':
      'Benutzer-Element nicht im Katalog gefunden.',
    'errors.noDataFoundMessage':
      'Um Ihre Daten hier anzuzeigen, überprüfen Sie, ob Ihre Elemente Werte melden, die mit dieser Metrik in Verbindung stehen.',
    'errors.unsupportedAggregationType':
      'Diese Scorecard verwendet einen Aggregationstyp, der von dieser Plugin-Version nicht unterstützt wird.',
    'errors.authenticationErrorMessage':
      'Bitte melden Sie sich an, um Ihre Daten anzuzeigen.',

    // Metric translations
    'metric.github.open_prs.title': 'GitHub PRs offen',
    'metric.github.open_prs.description':
      'Aktuelle Anzahl offener Pull Requests für ein bestimmtes GitHub-Repository.',
    'metric.jira.open_issues.title': 'Jira offene blockierende Tickets',
    'metric.jira.open_issues.description':
      'Hervorhebt die Anzahl der kritischen, blockierenden Probleme, die derzeit in Jira offen sind.',
    'metric.filecheck.title': 'Dateiprüfung: {{name}}',
    'metric.filecheck.description':
      'Prüft, ob die Datei {{name}} im Repository vorhanden ist.',
    'metric.lastUpdated': 'Zuletzt aktualisiert: {{timestamp}}',
    'metric.lastUpdatedNotAvailable': 'Zuletzt aktualisiert: Nicht verfügbar',
    'metric.someEntitiesNotReportingValues':
      'Einige Elemente melden keine Werte, die mit dieser Metrik in Verbindung stehen.',
    'metric.averageCenterTooltipTotalLabel': 'Gesamtpunktzahl',
    'metric.averageCenterTooltipMaxLabel': 'Maximal mögliche Punktzahl',
    'metric.averageLegendTooltipEntitiesEach_one':
      '{{count}} Element, je {{score}}',
    'metric.averageLegendTooltipEntitiesEach_other':
      '{{count}} Elemente, je {{score}}',
    'metric.averageLegendTooltipRowTotal': 'Gesamtpunktzahl {{total}}',

    // Threshold translations
    'thresholds.success': 'Erfolg',
    'thresholds.warning': 'Warnung',
    'thresholds.error': 'Fehler',
    'thresholds.exist': 'Vorhanden',
    'thresholds.missing': 'Fehlend',
    'thresholds.noEntities': 'Keine Elemente im {{category}}-Zustand',
    'thresholds.entities_one': '{{count}} Element',
    'thresholds.entities_other': '{{count}} Elemente',

    // Entities page translations
    'entitiesPage.unknownMetric': 'Unbekannte Metrik',
    'entitiesPage.noDataFound':
      'Um Ihre Daten hier anzuzeigen, überprüfen Sie, ob Ihre Elemente Werte melden, die mit dieser Metrik in Verbindung stehen.',
    'entitiesPage.missingPermission':
      'Um die Metriken der Scorecard einzusehen, muss Ihnen der Administrator die erforderliche Berechtigung erteilen.',
    'entitiesPage.metricProviderNotRegistered':
      'Metrik-Anbieter mit ID {{metricId}} ist nicht registriert.',
    'entitiesPage.entitiesTable.title': 'Elemente',
    'entitiesPage.entitiesTable.unavailable': 'Nicht verfügbar',
    'entitiesPage.entitiesTable.titleWithCount': 'Elemente ({{count}})',
    'entitiesPage.entitiesTable.header.status': 'Status',
    'entitiesPage.entitiesTable.header.value': 'Wert',
    'entitiesPage.entitiesTable.header.entity': 'Element',
    'entitiesPage.entitiesTable.header.owner': 'Eigentümer',
    'entitiesPage.entitiesTable.header.kind': 'Art',
    'entitiesPage.entitiesTable.header.lastUpdated': 'Zuletzt aktualisiert',
    'entitiesPage.entitiesTable.footer.allRows': 'Alle Zeilen',
    'entitiesPage.entitiesTable.footer.rows_one': '{{count}} Zeile',
    'entitiesPage.entitiesTable.footer.rows_other': '{{count}} Zeilen',
    'entitiesPage.entitiesTable.footer.of': 'von',
  },
});

export default scorecardTranslationDe;
