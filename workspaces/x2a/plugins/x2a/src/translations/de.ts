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
import { x2aPluginTranslationRef } from './ref';

/**
 * de translation for plugin.x2a.
 * @public
 */
const x2aPluginTranslationDe = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'sidebar.x2a.title': 'Konvertierungszentrum',
    'page.title': 'Konvertierungszentrum',
    'page.subtitle':
      'Initiieren und verfolgen Sie die asynchrone Umwandlung bestehender Automatisierungen in produktionsreife Ansible Playbooks.',
    'projectPage.title': 'Projekt',
    'projectPage.deleteProject': 'Löschen',
    'projectPage.actionsTooltip':
      'Klicken Sie hier, um das Menü für Projektaktionen zu öffnen.',
    'projectPage.deleteError': 'Projekt konnte nicht gelöscht werden',
    'projectPage.deleteConfirm.title': 'Projekt "{{name}}" löschen?',
    'projectModulesCard.title': 'Module ({{count}})',
    'projectModulesCard.published': 'veröffentlicht',
    'initPhaseCard.title': 'Entdeckungsphase',
    'modulePage.title': 'Moduldetails',
    'modulePage.artifacts.title': 'Zu überprüfende Artefakte',
    'modulePage.artifacts.migration_plan': 'Gesamtprojektmigrationsplan',
    'modulePage.artifacts.module_migration_plan': 'Modulplan nach Analyse',
    'modulePage.artifacts.migrated_sources': 'Migrierte Quellen',
    'modulePage.artifacts.ansible_project': 'AAP-Projekt',
    'modulePage.artifacts.description':
      'Diese Artefakte entstehen im Rahmen des Konvertierungsprozesses und stehen zur Überprüfung bereit.',
    'modulePage.phases.title': 'Migrationsphasen',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.duration': 'Dauer',
    'modulePage.phases.k8sJobName': 'Kubernetes-Jobname',
    'modulePage.phases.startedAt': 'Begann bei',
    'modulePage.phases.status': 'Status',
    'modulePage.phases.errorDetails': 'Fehlerdetails',
    'modulePage.phases.statuses.notStarted': 'Nicht gestartet',
    'modulePage.phases.statuses.pending': 'Ausstehend',
    'modulePage.phases.statuses.running': 'Wird ausgeführt',
    'modulePage.phases.statuses.success': 'Erfolg',
    'modulePage.phases.statuses.error': 'Fehler',
    'modulePage.phases.statuses.cancelled': 'Storniert',
    'modulePage.phases.resyncMigrationPlanInstructions':
      'Die Modulliste muss nun mit dem Migrationsplan übereinstimmen.',
    'modulePage.phases.reanalyzeInstructions':
      'Der Modulmigrationsplan ist bereits vorhanden. Falls der Gesamtplan für die Projektmigration aktualisiert wurde, sollte die Analyse erneut ausgelöst werden, um die Änderungen widerzuspiegeln.',
    'modulePage.phases.analyzeInstructions':
      'Bevor Sie die Analyse durchführen, überprüfen Sie zunächst den gesamten Projektmigrationsplan. Der Inhalt dieses Moduls bildet die Grundlage für dessen Analyse.',
    'modulePage.phases.migrateInstructions':
      'Vor der Durchführung der Migration sollte der Modulmigrationsplan überprüft werden. Der Migrationsprozess wird den Quellcode gemäß dem Plan in Ansible konvertieren.',
    'modulePage.phases.remigrateInstructions':
      'Die migrierten Quellen sind bereits vorhanden. Starten Sie die Migration erneut, um den konvertierten Ansible-Code neu zu erstellen.',
    'modulePage.phases.rerunMigrate': 'Migrierte Quellen neu erstellen',
    'modulePage.phases.publishInstructions':
      'Vor der Veröffentlichung sollten die migrierten Quellen überprüft werden. Der Veröffentlichungsprozess überträgt den konvertierten Code in das Ziel-Repository.',
    'modulePage.phases.republishInstructions':
      'Das Modul wurde bereits veröffentlicht. Um das Ziel-Repository zu aktualisieren, muss der Veröffentlichungsvorgang erneut ausgelöst werden.',
    'modulePage.phases.rerunPublish':
      'Im Ziel-Repository erneut veröffentlichen',
    'modulePage.phases.cancel': 'Abbrechen',
    'modulePage.phases.runError':
      'Phase für Modul konnte nicht ausgeführt werden',
    'modulePage.phases.cancelError':
      'Phase für Modul konnte nicht abgebrochen werden',
    'modulePage.phases.commitId': 'Letzte Commit-ID',
    'modulePage.phases.viewLog': 'Protokoll anzeigen',
    'modulePage.phases.hideLog': 'Protokoll ausblenden',
    'modulePage.phases.noLogsAvailable': 'Noch keine Protokolle verfügbar...',
    'modulePage.phases.logWaitingForStream':
      'Warte auf die Protokollausgabe des Clusters...',
    'modulePage.phases.telemetry.title': 'Telemetrie',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'Keine Telemetriedaten verfügbar',
    'modulePage.phases.telemetry.agentName': 'Name des Agenten',
    'modulePage.phases.telemetry.duration': 'Dauer',
    'modulePage.phases.telemetry.inputTokens': 'Eingabe-Tokens',
    'modulePage.phases.telemetry.outputTokens': 'Ausgabetoken',
    'modulePage.phases.telemetry.toolCalls': 'Anzahl der Werkzeugaufrufe',
    'table.columns.name': 'Name',
    'table.columns.status': 'Status',
    'table.columns.statusSortDisabledTooltip':
      'Die Sortierung nach Status ist nicht verfügbar, wenn die Anzahl der Projekte {{threshold}} überschreitet.',
    'table.columns.targetRepo': 'Ziel-Repository',
    'table.columns.createdAt': 'Erstellt am',
    'table.actions.deleteProject': 'Projekt löschen',
    'table.actions.retriggerInit':
      'Projektinitialisierungsphase erneut auslösen',
    'table.actions.expandAll': 'Alle Zeilen erweitern',
    'table.actions.collapseAll': 'Alle Zeilen ausblenden',
    'table.actions.expandRow': 'Zeile erweitern',
    'table.actions.collapseRow': 'Zeile ausblenden',
    'table.projectsCount': 'Projekte ({{count}})',
    'common.newProject': 'Neues Projekt',
    'emptyPage.noConversionInitiatedYet':
      'Es wurde noch keine Konvertierung eingeleitet.',
    'emptyPage.noConversionInitiatedYetDescription':
      'Initiieren und verfolgen Sie die Umwandlung bestehender Automatisierungen in produktionsreife Ansible-Lösungen.',
    'emptyPage.startFirstConversion': 'Starten Sie die erste Konvertierung.',
    'emptyPage.notAllowedTitle': 'Zugriff verweigert',
    'emptyPage.notAllowedDescription':
      'Sie haben keinen Zugriff auf Konvertierungsprojekte.',
    'bulkRun.projectAction': 'Alle Module ausführen',
    'bulkRun.globalAction': 'Alle ausführen',
    'bulkRun.projectPageAction': 'Alle ausführen',
    'bulkRun.projectConfirm.title':
      'Alle Module im Projekt "{{name}}" ausführen?',
    'bulkRun.cancel': 'Abbrechen',
    'bulkRun.errorProject':
      'Die Module im Projekt "{{name}}" konnten nicht ausgeführt werden.',
    'artifact.types.migration_plan': 'Projektmigrationsplan',
    'artifact.types.module_migration_plan': 'Modulmigrationsplan',
    'artifact.types.migrated_sources': 'Migrierte Quellen',
    'artifact.types.project_metadata': 'Projektmetadaten',
    'artifact.types.ansible_project': 'AAP-Projekt',
    'time.duration.daysAndHours': '{{days}}d {{hours}}h',
    'time.duration.daysOnly': '{{days}}d',
    'time.duration.hoursAndMinutes': '{{hours}}h {{minutes}}m',
    'time.duration.hoursOnly': '{{hours}}h',
    'time.duration.minutesAndSeconds': '{{minutes}}m {{seconds}}s',
    'time.duration.secondsOnly': '{{seconds}}s',
    'time.ago.daysAndHours': '{{days}}d {{hours}}h ago',
    'time.ago.daysOnly': '{{days}}d vor',
    'time.ago.hoursAndMinutes': '{{hours}}h {{minutes}}m ago',
    'time.ago.hoursOnly': '{{hours}}h vor',
    'time.ago.minutes': '{{minutes}}m vor',
    'time.ago.lessThanMinute': 'vor weniger als einer Minute',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': 'Laufzeit für {{duration}}',
    empty: '-',
  },
});

export default x2aPluginTranslationDe;
