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
    'metric.weightedStatusScoreCenterTooltipMaxLabel':
      'Maximal erreichbare Punktzahl',
    'metric.weightedStatusScoreCenterTooltipTotalLabel': 'Gesamtpunktzahl',
    'metric.weightedStatusScoreCenterTooltipBreakdownRow_one':
      '{{status}}: {{count}} entity, score: {{score}}',
    'metric.weightedStatusScoreCenterTooltipBreakdownRow_other':
      '{{status}}: {{count}} entities, score: {{score}}',
    'metric.weightedStatusScoreLegendTooltipEntitiesEach_one':
      '{{count}} Entitäten, jede {{score}}',
    'metric.weightedStatusScoreLegendTooltipEntitiesEach_other':
      '{{count}} Entitäten, jeweils {{score}}',
    'metric.weightedStatusScoreLegendTooltipRowTotal':
      'Gesamtpunktzahl {{total}}',
    'metric.drillDownCalculationFailures':
      'Bei der Berechnung dieser Kennzahl ist ein oder mehrere Fehler aufgetreten.',
    'metric.filecheck.description':
      'Prüft, ob die Datei {{name}} im Repository existiert.',
    'metric.filecheck.title': 'Dateiprüfung: {{name}}',
    'metric.github.openPRs.description':
      'Aktuelle Anzahl offener Pull Requests für ein bestimmtes GitHub-Repository.',
    'metric.github.openPRs.title': 'GitHub offene PRs',
    'metric.homepageEntityCalculationHealth':
      '{{healthy}} / {{total}} Entitäten ohne Metrikberechnungsfehler',
    'metric.homepageEntityHealthRatio': '{{healthy}}/{{total}} Entitäten',
    'metric.jira.openIssues.description':
      'Zeigt die Anzahl der kritischen, blockierenden Vorgänge an, die aktuell in Jira offen sind.',
    'metric.jira.openIssues.title': 'Jira-Tickets öffnen und blockieren',
    'metric.lastUpdated': 'Letzte Aktualisierung: {{timestamp}}',
    'metric.lastUpdatedNotAvailable': 'Letzte Aktualisierung: Nicht verfügbar',
    'metric.someEntitiesNotReportingValues':
      'Einige Organisationen melden keine Werte, die sich auf diese Kennzahl beziehen.',
    'metric.sonarqube.codeCoverage.description':
      'Gesamtcodeabdeckung in SonarQube in Prozent.',
    'metric.sonarqube.codeCoverage.title': 'SonarQube-Codeabdeckung',
    'metric.sonarqube.codeDuplications.description':
      'Prozentsatz doppelter Zeilen in SonarQube.',
    'metric.sonarqube.codeDuplications.title': 'SonarQube-Code-Duplizierungen',
    'metric.sonarqube.maintainabilityIssues.description':
      'Anzahl offener Code-Smells in SonarQube.',
    'metric.sonarqube.maintainabilityIssues.title':
      'SonarQube-Wartbarkeitsprobleme',
    'metric.sonarqube.maintainabilityRating.description':
      'SonarQube-Wartungsbewertung.',
    'metric.sonarqube.maintainabilityRating.title':
      'SonarQube-Wartbarkeitsbewertung',
    'metric.sonarqube.openIssues.description':
      'Anzahl der offenen Tickets (OFFEN, BESTÄTIGT, WIEDERERÖFFNET) in SonarQube.',
    'metric.sonarqube.openIssues.title': 'Offene Probleme bei SonarQube',
    'metric.sonarqube.qualityGate.description':
      'Ob das Projekt die SonarQube-Qualitätsprüfung besteht.',
    'metric.sonarqube.qualityGate.title': 'SonarQube Qualitätsgate-Status',
    'metric.sonarqube.reliabilityIssues.description':
      'Anzahl offener Fehler in SonarQube.',
    'metric.sonarqube.reliabilityIssues.title':
      'Zuverlässigkeitsprobleme von SonarQube',
    'metric.sonarqube.reliabilityRating.description':
      'SonarQube-Zuverlässigkeitsbewertung.',
    'metric.sonarqube.reliabilityRating.title':
      'SonarQube-Zuverlässigkeitsbewertung',
    'metric.sonarqube.securityHotspots.description':
      'Anzahl der in SonarQube zu überprüfenden Sicherheits-Hotspots.',
    'metric.sonarqube.securityHotspots.title': 'SonarQube Sicherheits-Hotspots',
    'metric.sonarqube.securityIssues.description':
      'Anzahl offener Sicherheitslücken in SonarQube.',
    'metric.sonarqube.securityIssues.title': 'SonarQube-Sicherheitsprobleme',
    'metric.sonarqube.securityRating.description':
      'SonarQube-Sicherheitsbewertung.',
    'metric.sonarqube.securityRating.title': 'SonarQube-Sicherheitsbewertung',
    'metric.sonarqube.securityReviewRating.description':
      'SonarQube-Sicherheitsbewertung.',
    'metric.sonarqube.securityReviewRating.title':
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
