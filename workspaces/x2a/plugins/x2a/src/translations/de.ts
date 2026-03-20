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
 * German translation for the x2a plugin.
 * @public
 */
const x2aPluginTranslationDe = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'sidebar.x2a.title': 'Konversions Hub',
    'page.title': 'Konversions Hub',
    'page.subtitle':
      'Starten und verfolgen Sie die asynchrone Umwandlung von Chef-Dateien in produktionsreife Ansible Playbooks.',
    'table.columns.name': 'Name',
    'table.columns.status': 'Status',
    'table.columns.sourceRepo': 'Quell-Repository',
    'table.columns.targetRepo': 'Ziel-Repository',
    'table.columns.createdAt': 'Erstellt am',
    'table.actions.deleteProject': 'Projekt löschen',
    'table.actions.retriggerInit': 'Projekt-Init-Phase erneut auslösen',
    'table.actions.expandAll': 'Alle Zeilen aufklappen',
    'table.actions.collapseAll': 'Alle Zeilen zuklappen',
    'table.actions.expandRow': 'Zeile aufklappen',
    'table.actions.collapseRow': 'Zeile zuklappen',
    'table.projectsCount': 'Projekte ({{count}})',
    empty: '-',
    'initPhaseCard.title': 'Entdeckungsphase',
    'projectDetailsCard.title': 'Projektdetails',
    'projectDetailsCard.name': 'Name',
    'projectDetailsCard.abbreviation': 'Abkürzung',
    'projectDetailsCard.status': 'Status',
    'projectDetailsCard.createdBy': 'Eigentümer',
    'projectDetailsCard.description': 'Beschreibung',
    'projectDetailsCard.sourceRepo': 'Quell-Repository',
    'projectDetailsCard.targetRepo': 'Ziel-Repository',
    'projectModulesCard.title': 'Module ({{count}})',
    'projectModulesCard.noModules': 'Noch keine Module gefunden...',
    'projectModulesCard.toReview': 'überprüfen',
    'projectModulesCard.published': 'veröffentlicht',
    'projectPage.title': 'Projekt',
    'projectPage.actionsTooltip':
      'Klicken Sie, um das Menü für Projektaktionen zu öffnen',
    'projectPage.deleteError': 'Fehler beim Löschen des Projekts',
    'projectPage.deleteProject': 'Löschen',
    'projectPage.deleteConfirm.title': 'Projekt "{{name}}" löschen?',
    'projectPage.deleteConfirm.message':
      'Dieses Projekt, alle seine Module und Jobs werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden. Die im Ziel-Repository gespeicherten Artefakte bleiben erhalten.',
    'projectPage.deleteConfirm.cancel': 'Abbrechen',
    'projectPage.deleteConfirm.confirm': 'Löschen',
    'projectTable.deleteError': 'Fehler beim Löschen des Projekts',
    'project.description': 'Beschreibung',
    'project.id': 'ID',
    'project.abbreviation': 'Abkürzung',
    'project.createdBy': 'Eigentümer',
    'project.statuses.none': '-',
    'project.statuses.created': 'Erstellt',
    'project.statuses.initializing': 'Wird initialisiert',
    'project.statuses.initialized': 'Initialisiert',
    'project.statuses.inProgress': 'In Bearbeitung',
    'project.statuses.completed': 'Abgeschlossen',
    'project.statuses.failed': 'Fehlgeschlagen',
    'project.noModules': 'Noch keine Module gefunden...',
    'common.newProject': 'Neues Projekt',
    'emptyPage.noConversionInitiatedYet': 'Noch keine Konversion gestartet',
    'emptyPage.noConversionInitiatedYetDescription':
      'Starten und verfolgen Sie die Konvertierung von Chef-Dateien in produktionsreife Ansible',
    'emptyPage.startFirstConversion': 'Erste Konversion starten',
    'emptyPage.notAllowedTitle': 'Zugriff verweigert',
    'emptyPage.notAllowedDescription':
      'Sie haben keine Berechtigung, auf Konversionsprojekte zuzugreifen.',
    'module.phases.init': 'Init',
    'module.phases.none': '-',
    'module.phases.analyze': 'Analysieren',
    'module.phases.migrate': 'Migrieren',
    'module.phases.publish': 'Veröffentlichen',
    'module.summary.total': 'Gesamt',
    'module.summary.finished': 'Abgeschlossen',
    'module.summary.waiting': 'Wartend',
    'module.summary.pending': 'Ausstehend',
    'module.summary.running': 'Läuft',
    'module.summary.error': 'Fehler',
    'module.summary.cancelled': 'Abgebrochen',
    'module.summary.toReview_one':
      '{{count}} Modul mit zu überprüfenden Artefakten',
    'module.summary.toReview_other':
      '{{count}} Module mit zu überprüfenden Artefakten',
    'module.actions.runNextPhase': 'Nächste {{phase}}-Phase ausführen',
    'module.actions.cancelPhase': 'Die {{phase}}-Phase abbrechen',
    'module.actions.cancelPhaseError':
      'Fehler beim Abbrechen der Phase für das Modul',
    'module.actions.runNextPhaseError':
      'Fehler beim Ausführen der nächsten Phase für das Modul',
    'module.currentPhase': 'Aktuelle Phase',
    'module.lastUpdate': 'Letzte Aktualisierung',
    'module.notStarted': 'Nicht gestartet',
    'module.name': 'Name',
    'module.status': 'Status',
    'module.sourcePath': 'Quellpfad',
    'module.artifacts': 'Artefakte',
    'artifact.types.migration_plan': 'Migrationsplan',
    'artifact.types.module_migration_plan': 'Modulplan',
    'module.statuses.none': '-',
    'module.statuses.pending': 'Ausstehend',
    'module.statuses.running': 'Läuft',
    'module.statuses.success': 'Erfolg',
    'module.statuses.error': 'Fehler',
    'module.statuses.cancelled': 'Abgebrochen',
    'artifact.types.migrated_sources': 'Migrierte Quellen',
    'artifact.types.project_metadata': 'Projektmetadaten',
    'artifact.types.ansible_project': 'AAP-Projekt',
    'modulePage.title': 'Moduldetails',
    'modulePage.artifacts.title': 'Zu überprüfende Artefakte',
    'modulePage.artifacts.migration_plan': 'Gesamter Projektmigrationsplan',
    'modulePage.artifacts.module_migration_plan': 'Modulplan nach Analyse',
    'modulePage.artifacts.migrated_sources': 'Migrierte Quellen',
    'modulePage.artifacts.ansible_project': 'AAP-Projekt',
    'modulePage.artifacts.description':
      'Diese Artefakte werden durch den Konvertierungsprozess generiert und stehen zur Überprüfung bereit.',
    'modulePage.phases.title': 'Migrationsphasen',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.duration': 'Dauer',
    'modulePage.phases.k8sJobName': 'Kubernetes-Jobname',
    'modulePage.phases.startedAt': 'Gestartet am',
    'modulePage.phases.status': 'Status',
    'modulePage.phases.errorDetails': 'Fehlerdetails',
    'modulePage.phases.statuses.notStarted': 'Nicht gestartet',
    'modulePage.phases.statuses.pending': 'Ausstehend',
    'modulePage.phases.statuses.running': 'Läuft',
    'modulePage.phases.statuses.success': 'Erfolg',
    'modulePage.phases.statuses.error': 'Fehler',
    'modulePage.phases.statuses.cancelled': 'Abgebrochen',
    'modulePage.phases.reanalyzeInstructions':
      'Der Modulmigrationsplan ist bereits vorhanden. Falls der gesamte Projektmigrationsplan aktualisiert wurde, lösen Sie die Analyse erneut aus, um die Änderungen widerzuspiegeln.',
    'modulePage.phases.rerunAnalyze': 'Modulmigrationsplan neu erstellen',
    'modulePage.phases.analyzeInstructions':
      'Überprüfen Sie vor der Analyse zunächst den gesamten Projektmigrationsplan. Sein Inhalt bestimmt die Analyse des Moduls.',
    'modulePage.phases.runAnalyze': 'Modulmigrationsplan erstellen',
    'modulePage.phases.migrateInstructions':
      'Überprüfen Sie vor der Migration den Modulmigrationsplan. Der Migrationsprozess konvertiert den Chef-Code basierend auf dem Plan in Ansible.',
    'modulePage.phases.runMigrate': 'Modulquellen migrieren',
    'modulePage.phases.remigrateInstructions':
      'Die migrierten Quellen sind bereits vorhanden. Lösen Sie die Migration erneut aus, um den konvertierten Ansible-Code neu zu erstellen.',
    'modulePage.phases.rerunMigrate': 'Migrierte Quellen neu erstellen',
    'modulePage.phases.publishInstructions':
      'Überprüfen Sie vor der Veröffentlichung die migrierten Quellen. Der Veröffentlichungsprozess committet den konvertierten Code in das Ziel-Repository.',
    'modulePage.phases.runPublish': 'Im Ziel-Repository veröffentlichen',
    'modulePage.phases.republishInstructions':
      'Das Modul wurde bereits veröffentlicht. Lösen Sie die Veröffentlichung erneut aus, um das Ziel-Repository zu aktualisieren.',
    'modulePage.phases.rerunPublish':
      'Im Ziel-Repository erneut veröffentlichen',
    'modulePage.phases.cancel': 'Abbrechen',
    'modulePage.phases.runError':
      'Fehler beim Ausführen der Phase für das Modul',
    'modulePage.phases.cancelError':
      'Fehler beim Abbrechen der Phase für das Modul',
    'modulePage.phases.commitId': 'Letzte Commit-ID',
    'modulePage.phases.viewLog': 'Log anzeigen',
    'modulePage.phases.hideLog': 'Log ausblenden',
    'modulePage.phases.noLogsAvailable': 'Noch keine Logs verfügbar...',
    'modulePage.phases.telemetry.title': 'Telemetrie',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'Keine Telemetrie verfügbar',
    'modulePage.phases.telemetry.agentName': 'Agent-Name',
    'modulePage.phases.telemetry.duration': 'Dauer',
    'modulePage.phases.telemetry.inputTokens': 'Eingabe-Tokens',
    'modulePage.phases.telemetry.outputTokens': 'Ausgabe-Tokens',
    'modulePage.phases.telemetry.toolCalls': 'Anzahl der Werkzeugaufrufe',
    'modulePage.phases.resyncMigrationPlanInstructions':
      'Modulliste synchronisieren, um sie an den Migrationsplan anzupassen.',
    'time.duration.daysAndHours': '{{days}}T {{hours}}Std',
    'time.duration.daysOnly': '{{days}}T',
    'time.duration.hoursAndMinutes': '{{hours}}Std {{minutes}}Min',
    'time.duration.hoursOnly': '{{hours}}Std',
    'time.duration.minutesAndSeconds': '{{minutes}}Min {{seconds}}Sek',
    'time.duration.secondsOnly': '{{seconds}}Sek',
    'time.ago.daysAndHours': 'vor {{days}}T {{hours}}Std',
    'time.ago.daysOnly': 'vor {{days}}T',
    'time.ago.hoursAndMinutes': 'vor {{hours}}Std {{minutes}}Min',
    'time.ago.hoursOnly': 'vor {{hours}}Std',
    'time.ago.minutes': 'vor {{minutes}}Min',
    'time.ago.lessThanMinute': 'vor <1Min',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': 'Läuft seit {{duration}}',
    'time.jobTiming.finished': 'Beendet {{timeAgo}} ({{duration}} gedauert)',
    'bulkRun.projectAction': 'Alle Module ausführen',
    'bulkRun.globalAction': 'Alle ausführen',
    'bulkRun.projectPageAction': 'Alle ausführen',
    'bulkRun.projectConfirm.title':
      'Alle Module im Projekt „{{name}}" ausführen?',
    'bulkRun.projectConfirm.message':
      'Dies löst die nächste Migrationsphase für jedes Modul in diesem Projekt aus, dessen aktueller Status dies zulässt. Stellen Sie sicher, dass Sie alle erforderlichen Artefakte in den Ziel-Repositories überprüft haben, bevor Sie diese Aktion ausführen. Module, die nicht berechtigt sind, werden übersprungen.',
    'bulkRun.globalConfirm.title':
      'Alle berechtigten Projekte und Module ausführen?',
    'bulkRun.globalConfirm.message':
      'Dies löst die nächste Migrationsphase für alle berechtigten Module in allen Projekten aus, auf die Sie Schreibzugriff haben, einschließlich Projekte, die auf der aktuellen Seite nicht sichtbar sind. Stellen Sie sicher, dass Sie alle erforderlichen Artefakte in den Ziel-Repositories überprüft haben, bevor Sie diese Aktion ausführen. Zusätzlich wird die Init-Phase für Projekte erneut ausgelöst, die noch keine Module haben und deren Init-Phase derzeit nicht läuft.',
    'bulkRun.projectPageConfirm.title': 'Alle Module in „{{name}}" ausführen?',
    'bulkRun.projectPageConfirm.message':
      'Dies löst die nächste Migrationsphase für jedes Modul in diesem Projekt aus, dessen aktueller Status dies zulässt. Stellen Sie sicher, dass Sie alle erforderlichen Artefakte in den Ziel-Repositories überprüft haben, bevor Sie diese Aktion ausführen. Module, die nicht berechtigt sind, werden übersprungen.',
    'bulkRun.confirm': 'Alle ausführen',
    'bulkRun.cancel': 'Abbrechen',
    'bulkRun.errorProject':
      'Fehler beim Ausführen der Module im Projekt „{{name}}"',
    'bulkRun.errorGlobal': 'Fehler bei der Massenausführung',
  },
});

export default x2aPluginTranslationDe;
