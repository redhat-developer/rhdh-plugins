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
    'common.current': 'aktuell',
    'dataSourcesDialog.title': '{{title}} Quellen',
    'dataSourcesDialog.close': 'Schließen',
    'dataSourcesDialog.unknownPlugin': 'Unbekannt',
    'dataSourcesDialog.statusTooltip':
      'Wert {{value}} entspricht dem Schwellenwert {{status}} {{expression}}',
    'dataSourcesDialog.collectorStatusTooltip':
      'Dieser Collector liefert nur Eingabedaten. Der {{metric}}-Check-Wert wird aus Collectors berechnet und auf der Scorecard-Karte angezeigt.',
    'dataSourcesDialog.collectorEmptyValue': '--',
    'dataSourcesDialog.collectorUnavailableStatus': 'k. A.',
    'dataSourcesDialog.columns.plugin': 'PLUGIN',
    'dataSourcesDialog.columns.check': 'ÜBERPRÜFEN',
    'dataSourcesDialog.columns.value': 'WERT',
    'dataSourcesDialog.columns.status': 'STATUS',
    'dataSourcesDialog.columns.lastSynced': 'ZULETZT SYNCHRONISIERT',
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
      '{{status}}: {{count}} Entity, Punktzahl: {{score}}',
    'metric.weightedStatusScoreCenterTooltipBreakdownRow_other':
      '{{status}}: {{count}} Entitys, Punktzahl: {{score}}',
    'metric.weightedStatusScoreLegendTooltipEntitiesEach_one':
      '{{count}} Entity, jeweils {{score}}',
    'metric.weightedStatusScoreLegendTooltipEntitiesEach_other':
      '{{count}} Entitys, jeweils {{score}}',
    'metric.weightedStatusScoreLegendTooltipRowTotal':
      'Gesamtpunktzahl {{total}}',
    'metric.drillDownCalculationFailures':
      'Bei der Berechnung dieser Kennzahl ist ein oder mehrere Fehler aufgetreten.',
    'metric.dora.deploymentFrequency.description':
      'Erfasst, wie oft Code in den letzten 30 Tagen erfolgreich in der Produktion deployt wurde. Top-Performer werden bedarfsgesteuert deployt (mehrmals täglich).',
    'metric.dora.deploymentFrequency.title': 'DORA – Deployment-Häufigkeit',
    'metric.dora.medianLeadTimeForChanges.description':
      'Misst die mittlere Zeitdauer vom Code-Commit bis zum produktiven Deployment in den letzten 30 Tagen. Top-Performer haben eine Vorlaufzeit von weniger als 24 Stunden.',
    'metric.dora.medianLeadTimeForChanges.title':
      'DORA – Mittlere Vorlaufzeit für Änderungen',
    'metric.dora.changeFailureRate.description':
      'Überwacht den Prozentsatz der Deployments, die in den letzten 30 Tagen zu einem Produktionsausfall geführt haben. Top-Performer weisen eine Änderungsfehlerrate von unter 5 % auf.',
    'metric.dora.changeFailureRate.title': 'DORA – Änderungsfehlerrate',
    'metric.dora.medianTimeToRestore.description':
      'Verfolgt die mittlere Zeitdauer bis zur Wiederherstellung des Dienstes nach einem Vorfall in den letzten 30 Tagen. Top-Performer stellen den Service in weniger als einer Stunde wieder her.',
    'metric.dora.medianTimeToRestore.title':
      'DORA – Mittlere Wiederherstellungszeit',
    'metric.filecheck.description':
      'Prüft, ob die Datei {{name}} im Repository existiert.',
    'metric.filecheck.title': 'Dateiprüfung: {{name}}',
    'metric.github.openPRs.description':
      'Aktuelle Anzahl offener Pull Requests für ein bestimmtes GitHub-Repository.',
    'metric.github.openPRs.title': 'GitHub – offene PRs',
    'metric.homepageEntityCalculationHealth':
      '{{healthy}} / {{total}} Entitäten ohne Metrikberechnungsfehler',
    'metric.homepageEntityHealthRatio': '{{healthy}}/{{total}} Entitäten',
    'aggregation.min': 'Min.',
    'aggregation.max': 'Max.',
    'aggregation.sum': 'Summe',
    'aggregation.count': 'Anzahl',
    'aggregation.average': 'Durchschnitt',
    'metric.jira.openIssues.description':
      'Zeigt die Anzahl der kritischen, blockierenden Probleme an, die aktuell in Jira offen sind.',
    'metric.jira.openIssues.title': 'Offene blockierende Jira-Tickets',
    'metric.lastUpdated': 'Letzte Aktualisierung: {{timestamp}}',
    'metric.lastUpdatedNotAvailable': 'Letzte Aktualisierung: Nicht verfügbar',
    'metric.someEntitiesNotReportingValues':
      'Einige Organisationen melden keine Werte, die sich auf diese Kennzahl beziehen.',
    'metric.sonarqube.codeCoverage.description':
      'Codeabdeckung gesamt in SonarQube in Prozent.',
    'metric.sonarqube.codeCoverage.title': 'SonarQube-Codeabdeckung',
    'metric.sonarqube.codeDuplications.description':
      'Anteil doppelter Zeilen in SonarQube in Prozent.',
    'metric.sonarqube.codeDuplications.title': 'SonarQube-Codeduplizierungen',
    'metric.sonarqube.maintainabilityIssues.description':
      'Anzahl offener Code-Smells in SonarQube.',
    'metric.sonarqube.maintainabilityIssues.title':
      'SonarQube-Wartbarkeitsprobleme',
    'metric.sonarqube.maintainabilityRating.description':
      'Bewertung der SonarQube-Wartbarkeit.',
    'metric.sonarqube.maintainabilityRating.title':
      'SonarQube-Wartbarkeitsbewertung',
    'metric.sonarqube.openIssues.description':
      'Anzahl der offenen Probleme (OFFEN, BESTÄTIGT, WIEDERERÖFFNET) in SonarQube.',
    'metric.sonarqube.openIssues.title': 'Offene Probleme in SonarQube',
    'metric.sonarqube.qualityGate.description':
      'Ob das Projekt die SonarQube-Qualitätsprüfung besteht.',
    'metric.sonarqube.qualityGate.title':
      'Status der SonarQube-Qualitätsprüfung',
    'metric.sonarqube.reliabilityIssues.description':
      'Anzahl offener Probleme in SonarQube.',
    'metric.sonarqube.reliabilityIssues.title':
      'SonarQube-Zuverlässigkeit – Probleme',
    'metric.sonarqube.reliabilityRating.description':
      'Bewertung der SonarQube-Zuverlässigkeit.',
    'metric.sonarqube.reliabilityRating.title':
      'SonarQube-Zuverlässigkeitsbewertung',
    'metric.sonarqube.securityHotspots.description':
      'Anzahl der in SonarQube zu überprüfenden Sicherheits-Hotspots.',
    'metric.sonarqube.securityHotspots.title':
      'Sicherheits-Hotspots in SonarQube',
    'metric.sonarqube.securityIssues.description':
      'Anzahl offener Sicherheitslücken in SonarQube.',
    'metric.sonarqube.securityIssues.title': 'SonarQube-Sicherheitsprobleme',
    'metric.sonarqube.securityRating.description':
      'Bewertung der SonarQube-Sicherheit.',
    'metric.sonarqube.securityRating.title': 'SonarQube-Sicherheitsbewertung',
    'metric.sonarqube.securityReviewRating.description':
      'Bewertung der SonarQube-Sicherheitsprüfung.',
    'metric.sonarqube.securityReviewRating.title':
      'SonarQube-Sicherheitsprüfung – Bewertung',
    'metricGroupCard.menuAriaLabel': 'Mehr Optionen',
    'metricGroupCard.viewDataSources': 'Datenquellen anzeigen',
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
    'thresholds.elite': 'Top',
    'thresholds.entities_one': '{{count}} Entität',
    'thresholds.entities_other': '{{count}} Entitäten',
    'thresholds.error': 'Fehler',
    'thresholds.exist': 'Existieren',
    'thresholds.low': 'Niedrig',
    'thresholds.medium': 'Mittel',
    'thresholds.missing': 'Fehlen',
    'thresholds.noEntities': 'Keine Entitäten im Zustand {{category}}',
    'thresholds.success': 'Erfolg',
    'thresholds.warning': 'Warnung',
  },
});

export default scorecardTranslationDe;
