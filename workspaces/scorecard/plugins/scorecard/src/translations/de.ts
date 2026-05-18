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
    'common.loading': 'Ladevorgang',
    'emptyState.altText': 'Keine Scorecards',
    'emptyState.button': 'Dokumentation anzeigen',
    'emptyState.description':
      'Scorecards helfen Ihnen, den Zustand der Komponenten auf einen Blick zu überwachen. Schauen Sie sich zunächst unsere Dokumentation mit den Einrichtungshinweisen an.',
    'emptyState.title': 'Noch keine Scorecards hinzugefügt.',
    'entitiesPage.entitiesTable.footer.allRows': 'Alle Zeilen',
    'entitiesPage.entitiesTable.footer.of': 'von',
    'entitiesPage.entitiesTable.footer.rows_one': '{{count}} Zeile',
    'entitiesPage.entitiesTable.footer.rows_other': '{{count}} Zeilen',
    'entitiesPage.entitiesTable.header.entity': 'Entity',
    'entitiesPage.entitiesTable.header.kind': 'Art',
    'entitiesPage.entitiesTable.header.lastUpdated': 'Letzte Aktualisierung',
    'entitiesPage.entitiesTable.header.owner': 'Eigentümer',
    'entitiesPage.entitiesTable.header.status': 'Status',
    'entitiesPage.entitiesTable.header.value': 'Wert',
    'entitiesPage.entitiesTable.title': 'Entitäten',
    'entitiesPage.entitiesTable.titleWithCount': 'Entitäten ({{count}})',
    'entitiesPage.entitiesTable.unavailable': 'Nicht verfügbar',
    'entitiesPage.metricProviderNotRegistered':
      'Der Metrikanbieter mit der ID {{metricId}} ist nicht registriert.',
    'entitiesPage.missingPermission':
      'Um die Kennzahlen der Scorecard einzusehen, muss Ihnen Ihr Administrator die erforderliche Berechtigung erteilen.',
    'entitiesPage.noDataFound':
      'Um Ihre Daten hier anzuzeigen, überprüfen Sie, ob Ihre Entitäten Werte melden, die sich auf diese Kennzahl beziehen.',
    'entitiesPage.unknownMetric': 'Unbekannte Metrik',
    'errors.authenticationError': 'Authentifizierungsfehler',
    'errors.authenticationErrorMessage':
      'Bitte melden Sie sich an, um Ihre Daten einzusehen.',
    'errors.entityMissingProperties':
      'Für die Scorecard-Suche fehlen der Entität die erforderlichen Eigenschaften.',
    'errors.fetchError': 'Fehler beim Abrufen der Scorecards: {{error}}',
    'errors.invalidApiResponse': 'Ungültiges Antwortformat der Scorecard-API',
    'errors.invalidThresholds': 'Ungültige Schwellenwerte',
    'errors.metricDataUnavailable': 'Metrische Daten nicht verfügbar',
    'errors.missingAggregationId':
      'Die Scorecard ist falsch konfiguriert, die Eigenschaft für die Aggregations-ID (oder Metrik-ID) fehlt.',
    'errors.missingPermission': 'Fehlende Berechtigung',
    'errors.missingPermissionMessage':
      'Um die Kennzahlen der Scorecard einzusehen, muss Ihnen Ihr Administrator die erforderliche Berechtigung erteilen.',
    'errors.noDataFound': 'Keine Daten gefunden',
    'errors.noDataFoundMessage':
      'Um Ihre Daten hier anzuzeigen, überprüfen Sie, ob Ihre Entitäten Werte melden, die sich auf diese Kennzahl beziehen.',
    'errors.unsupportedAggregationType':
      'Diese Scorecard verwendet einen Aggregationstyp, der von dieser Version des Plugins nicht unterstützt wird.',
    'errors.userNotFoundInCatalogMessage':
      'Benutzerentität im Katalog nicht gefunden.',
    'metric.averageCenterTooltipMaxLabel': 'Maximal erreichbare Punktzahl',
    'metric.averageCenterTooltipTotalLabel': 'Gesamtpunktzahl',
    'metric.averageCenterTooltipBreakdownRow_one':
      '{{status}}: {{count}} entity, score: {{score}}',
    'metric.averageCenterTooltipBreakdownRow_other':
      '{{status}}: {{count}} entities, score: {{score}}',
    'metric.averageLegendTooltipEntitiesEach_one':
      '{{count}} Entitäten, jede {{score}}',
    'metric.averageLegendTooltipEntitiesEach_other':
      '{{count}} Entitäten, jeweils {{score}}',
    'metric.averageLegendTooltipRowTotal': 'Gesamtpunktzahl {{total}}',
    'metric.drillDownCalculationFailures':
      'Bei der Berechnung dieser Kennzahl ist ein oder mehrere Fehler aufgetreten.',
    'metric.filecheck.description':
      'Prüft, ob die Datei {{name}} im Repository existiert.',
    'metric.filecheck.title': 'Dateiprüfung: {{name}}',
    'metric.github.open_prs.description':
      'Aktuelle Anzahl offener Pull Requests für ein bestimmtes GitHub-Repository.',
    'metric.github.open_prs.title': 'GitHub offene PRs',
    'metric.homepageEntityCalculationHealth':
      '{{healthy}} / {{total}} Entitäten ohne Metrikberechnungsfehler',
    'metric.homepageEntityHealthRatio': '{{healthy}}/{{total}} Entitäten',
    'metric.jira.open_issues.description':
      'Zeigt die Anzahl der kritischen, blockierenden Vorgänge an, die aktuell in Jira offen sind.',
    'metric.jira.open_issues.title': 'Jira-Tickets öffnen und blockieren',
    'metric.lastUpdated': 'Letzte Aktualisierung: {{timestamp}}',
    'metric.lastUpdatedNotAvailable': 'Letzte Aktualisierung: Nicht verfügbar',
    'metric.someEntitiesNotReportingValues':
      'Einige Organisationen melden keine Werte, die sich auf diese Kennzahl beziehen.',
    'metric.sonarqube.code_coverage.description':
      'Gesamtcodeabdeckung in SonarQube in Prozent.',
    'metric.sonarqube.code_coverage.title': 'SonarQube-Codeabdeckung',
    'metric.sonarqube.code_duplications.description':
      'Prozentsatz doppelter Zeilen in SonarQube.',
    'metric.sonarqube.code_duplications.title': 'SonarQube-Code-Duplizierungen',
    'metric.sonarqube.maintainability_issues.description':
      'Anzahl offener Code-Smells in SonarQube.',
    'metric.sonarqube.maintainability_issues.title':
      'SonarQube-Wartbarkeitsprobleme',
    'metric.sonarqube.maintainability_rating.description':
      'SonarQube-Wartungsbewertung.',
    'metric.sonarqube.maintainability_rating.title':
      'SonarQube-Wartbarkeitsbewertung',
    'metric.sonarqube.open_issues.description':
      'Anzahl der offenen Tickets (OFFEN, BESTÄTIGT, WIEDERERÖFFNET) in SonarQube.',
    'metric.sonarqube.open_issues.title': 'Offene Probleme bei SonarQube',
    'metric.sonarqube.quality_gate.description':
      'Ob das Projekt die SonarQube-Qualitätsprüfung besteht.',
    'metric.sonarqube.quality_gate.title': 'SonarQube Qualitätsgate-Status',
    'metric.sonarqube.reliability_issues.description':
      'Anzahl offener Fehler in SonarQube.',
    'metric.sonarqube.reliability_issues.title':
      'Zuverlässigkeitsprobleme von SonarQube',
    'metric.sonarqube.reliability_rating.description':
      'SonarQube-Zuverlässigkeitsbewertung.',
    'metric.sonarqube.reliability_rating.title':
      'SonarQube-Zuverlässigkeitsbewertung',
    'metric.sonarqube.security_hotspots.description':
      'Anzahl der in SonarQube zu überprüfenden Sicherheits-Hotspots.',
    'metric.sonarqube.security_hotspots.title':
      'SonarQube Sicherheits-Hotspots',
    'metric.sonarqube.security_issues.description':
      'Anzahl offener Sicherheitslücken in SonarQube.',
    'metric.sonarqube.security_issues.title': 'SonarQube-Sicherheitsprobleme',
    'metric.sonarqube.security_rating.description':
      'SonarQube-Sicherheitsbewertung.',
    'metric.sonarqube.security_rating.title': 'SonarQube-Sicherheitsbewertung',
    'metric.sonarqube.security_review_rating.description':
      'SonarQube-Sicherheitsbewertung.',
    'metric.sonarqube.security_review_rating.title':
      'SonarQube Sicherheitsbewertung',
    'notFound.altText': 'Seite nicht gefunden',
    'notFound.contactSupport': 'Kontaktieren Sie den Support.',
    'notFound.description':
      'Versuchen Sie, eine {{indexFile}}-Datei im Stammverzeichnis des docs-Verzeichnisses dieses Repositorys hinzuzufügen.',
    'notFound.goBack': 'Zurück',
    'notFound.readMore': 'Weitere Informationen',
    'notFound.title': '404 Die Seite konnte nicht gefunden werden.',
    'permissionRequired.altText': 'Berechtigung erforderlich',
    'permissionRequired.button': 'Weitere Informationen',
    'permissionRequired.description':
      'Um das Scorecard-Plugin anzuzeigen, wenden Sie sich an Ihren Administrator, um die Berechtigung {{permission}} zu erteilen.',
    'permissionRequired.title': 'Fehlende Berechtigung',
    'thresholds.entities_one': '{{count}} Entität',
    'thresholds.entities_other': '{{count}} Entitäten',
    'thresholds.error': 'Fehler',
    'thresholds.exist': 'Existieren',
    'thresholds.missing': 'Fehlen',
    'thresholds.noEntities': 'Keine Entitäten im Zustand {{category}}',
    'thresholds.success': 'Erfolg',
    'thresholds.warning': 'Warnung',
  },
});

export default scorecardTranslationDe;
