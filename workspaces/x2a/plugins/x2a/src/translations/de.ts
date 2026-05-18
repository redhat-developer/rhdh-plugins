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
    'artifact.types.ansible_project': 'AAP-Projekt',
    'artifact.types.migrated_sources': 'Migrierte Quellen',
    'artifact.types.migration_plan': 'Projektmigrationsplan',
    'artifact.types.module_migration_plan': 'Modulmigrationsplan',
    'artifact.types.project_metadata': 'Projektmetadaten',
    'bulkRun.cancel': 'Abbrechen',
    'bulkRun.confirm': 'Alle ausführen',
    'bulkRun.errorGlobal': 'Massenoperation konnte nicht ausgeführt werden',
    'bulkRun.errorModuleStart':
      'Phase "{{phase}}" für Modul "{{moduleName}}" konnte nicht gestartet werden',
    'bulkRun.errorProject':
      'Die Module im Projekt "{{name}}" konnten nicht ausgeführt werden.',
    'bulkRun.globalAction': 'Alle ausführen',
    'bulkRun.globalConfirm.message':
      'Dies löst die nächste Migrationsphase für alle in Frage kommenden Module in allen Projekten aus, für die Sie Schreibzugriff haben, einschließlich Projekten, die auf der aktuellen Seite nicht sichtbar sind. Stellen Sie sicher, dass alle notwendigen Artefakte in den Ziel-Repositories überprüft wurden, bevor Sie diese Aktion ausführen.',
    'bulkRun.globalConfirm.messageInitRetrigger':
      'Bei einigen Projekten kann die Initialisierungsphase erneut durchgeführt werden. Auch ihre Entdeckungsphase wird erneut ausgelöst.',
    'bulkRun.globalConfirm.noInitEligible':
      'Derzeit sind keine Projekte für eine erneute Durchführung der Initialisierungsphase geeignet.',
    'bulkRun.globalConfirm.title':
      'Alle infrage kommenden Projekte und Module ausführen?',
    'bulkRun.globalConfirm.userPromptLabel':
      'Benutzeraufforderung für erneuten Initialisierungs-Trigger (optional)',
    'bulkRun.globalConfirm.userPromptPlaceholder':
      'Falls bei Projekten die Initialisierungsphase erneut ausgelöst werden muss, wird diese Eingabeaufforderung verwendet, um die Konvertierung anzupassen…',
    'bulkRun.projectAction': 'Alle Module ausführen',
    'bulkRun.projectConfirm.message':
      'Dies löst die nächste Migrationsphase für jedes Modul in diesem Projekt aus, dessen aktueller Zustand dies zulässt. Stellen Sie sicher, dass alle notwendigen Artefakte in den Ziel-Repositories überprüft wurden, bevor Sie diese Aktion ausführen. Module, die nicht geeignet sind, werden übersprungen.',
    'bulkRun.projectConfirm.title':
      'Alle Module im Projekt "{{name}}" ausführen?',
    'bulkRun.projectPageAction': 'Alle ausführen',
    'bulkRun.projectPageConfirm.message':
      'Dies löst die nächste Migrationsphase für jedes Modul in diesem Projekt aus, dessen aktueller Zustand dies zulässt. Stellen Sie sicher, dass alle notwendigen Artefakte in den Ziel-Repositories überprüft wurden, bevor Sie diese Aktion ausführen. Module, die nicht geeignet sind, werden übersprungen.',
    'bulkRun.projectPageConfirm.title': 'Alle Module in "{{name}}" ausführen?',
    'common.newProject': 'Neues Projekt',
    'editProjectDialog.cancel': 'Abbrechen',
    'editProjectDialog.nameRequired': 'Name ist erforderlich',
    'editProjectDialog.ownerChangeConfirm': 'Eigentum übertragen',
    'editProjectDialog.ownerChangeWarning':
      'Das Ändern des Eigentümers kann dazu führen, dass Sie den Zugriff auf dieses Projekt verlieren, wenn Ihre Berechtigungen den neuen Eigentümer nicht abdecken. Ein Administrator kann den Zugriff bei Bedarf wiederherstellen.',
    'editProjectDialog.ownerChangeWarningTitle':
      'Eigentumsübertragung bestätigen',
    'editProjectDialog.ownerFormatHint':
      'Muss eine Backstage-Entitätsreferenz sein, z.B. user:default/name oder group:default/team',
    'editProjectDialog.title': 'Projekt bearbeiten',
    'editProjectDialog.update': 'Aktualisieren',
    'editProjectDialog.updateError': 'Fehler beim Aktualisieren des Projekts',
    empty: '-',
    'emptyPage.noConversionInitiatedYet':
      'Es wurde noch keine Konvertierung eingeleitet.',
    'emptyPage.noConversionInitiatedYetDescription':
      'Initiieren und verfolgen Sie die Umwandlung bestehender Automatisierungen in produktionsreife Ansible-Lösungen.',
    'emptyPage.notAllowedDescription':
      'Sie haben keinen Zugriff auf Konvertierungsprojekte.',
    'emptyPage.notAllowedTitle': 'Zugriff verweigert',
    'emptyPage.startFirstConversion': 'Starten Sie die erste Konvertierung.',
    'initPhaseCard.title': 'Entdeckungsphase',
    'module.actions.cancelPhase': 'Die {{phase}}-Phase abbrechen',
    'module.actions.cancelPhaseError':
      'Phase für Modul konnte nicht abgebrochen werden',
    'module.actions.runNextPhase': 'Führe die nächste {{phase}} Phase aus',
    'module.actions.runNextPhaseError':
      'Die nächste Phase für das Modul konnte nicht ausgeführt werden.',
    'module.artifacts': 'Artefakte',
    'module.currentPhase': 'Aktuelle Phase',
    'module.lastUpdate': 'Letzte Aktualisierung',
    'module.name': 'Name',
    'module.notStarted': 'Nicht gestartet',
    'module.phases.analyze': 'Analysieren',
    'module.phases.init': 'Init',
    'module.phases.migrate': 'Wandern',
    'module.phases.none': '-',
    'module.phases.publish': 'Veröffentlichen',
    'module.sourcePath': 'Quellpfad',
    'module.status': 'Status',
    'module.statuses.cancelled': 'Storniert',
    'module.statuses.error': 'Fehler',
    'module.statuses.none': '-',
    'module.statuses.pending': 'Ausstehend',
    'module.statuses.running': 'Wird ausgeführt',
    'module.statuses.success': 'Erfolg',
    'module.summary.cancelled': 'Storniert',
    'module.summary.error': 'Fehler',
    'module.summary.finished': 'Fertig',
    'module.summary.pending': 'Ausstehend',
    'module.summary.running': 'Wird ausgeführt',
    'module.summary.toReview_one':
      '{{count}} Modul mit zu überprüfenden Artefakten',
    'module.summary.toReview_other':
      '{{count}} Module mit zu überprüfenden Artefakten',
    'module.summary.total': 'Gesamt',
    'module.summary.waiting': 'Warten',
    'modulePage.artifacts.ansible_project': 'AAP-Projekt',
    'modulePage.artifacts.description':
      'Diese Artefakte entstehen im Rahmen des Konvertierungsprozesses und stehen zur Überprüfung bereit.',
    'modulePage.artifacts.migrated_sources': 'Migrierte Quellen',
    'modulePage.artifacts.migration_plan': 'Gesamtprojektmigrationsplan',
    'modulePage.artifacts.module_migration_plan': 'Modulplan nach Analyse',
    'modulePage.artifacts.title': 'Zu überprüfende Artefakte',
    'modulePage.phases.analyzeInstructions':
      'Bevor Sie die Analyse durchführen, überprüfen Sie zunächst den gesamten Projektmigrationsplan. Der Inhalt dieses Moduls bildet die Grundlage für dessen Analyse.',
    'modulePage.phases.cancel': 'Abbrechen',
    'modulePage.phases.cancelError':
      'Phase für Modul konnte nicht abgebrochen werden',
    'modulePage.phases.commitId': 'Letzte Commit-ID',
    'modulePage.phases.duration': 'Dauer',
    'modulePage.phases.errorDetails': 'Fehlerdetails',
    'modulePage.phases.hideLog': 'Protokoll ausblenden',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.k8sJobName': 'Kubernetes-Jobname',
    'modulePage.phases.logWaitingForStream':
      'Warte auf die Protokollausgabe des Clusters...',
    'modulePage.phases.migrateInstructions':
      'Vor der Durchführung der Migration sollte der Modulmigrationsplan überprüft werden. Der Migrationsprozess wird den Quellcode gemäß dem Plan in Ansible konvertieren.',
    'modulePage.phases.noLogsAvailable': 'Noch keine Protokolle verfügbar...',
    'modulePage.phases.publishInstructions':
      'Vor der Veröffentlichung sollten die migrierten Quellen überprüft werden. Der Veröffentlichungsprozess überträgt den konvertierten Code in das Ziel-Repository.',
    'modulePage.phases.reanalyzeInstructions':
      'Der Modulmigrationsplan ist bereits vorhanden. Falls der Gesamtplan für die Projektmigration aktualisiert wurde, sollte die Analyse erneut ausgelöst werden, um die Änderungen widerzuspiegeln.',
    'modulePage.phases.remigrateInstructions':
      'Die migrierten Quellen sind bereits vorhanden. Starten Sie die Migration erneut, um den konvertierten Ansible-Code neu zu erstellen.',
    'modulePage.phases.republishInstructions':
      'Das Modul wurde bereits veröffentlicht. Um das Ziel-Repository zu aktualisieren, muss der Veröffentlichungsvorgang erneut ausgelöst werden.',
    'modulePage.phases.rerunAnalyze': 'Modulmigrationsplan neu erstellen',
    'modulePage.phases.rerunMigrate': 'Migrierte Quellen neu erstellen',
    'modulePage.phases.rerunPublish':
      'Im Ziel-Repository erneut veröffentlichen',
    'modulePage.phases.resyncMigrationPlanInstructions':
      'Die Modulliste muss nun mit dem Migrationsplan übereinstimmen.',
    'modulePage.phases.runAnalyze': 'Modulmigrationsplan erstellen',
    'modulePage.phases.runError':
      'Phase für Modul konnte nicht ausgeführt werden',
    'modulePage.phases.runMigrate': 'Modulquellen migrieren',
    'modulePage.phases.runPublish': 'Im Ziel-Repository veröffentlichen',
    'modulePage.phases.startedAt': 'Begann bei',
    'modulePage.phases.status': 'Status',
    'modulePage.phases.statuses.cancelled': 'Storniert',
    'modulePage.phases.statuses.error': 'Fehler',
    'modulePage.phases.statuses.notStarted': 'Nicht gestartet',
    'modulePage.phases.statuses.pending': 'Ausstehend',
    'modulePage.phases.statuses.running': 'Wird ausgeführt',
    'modulePage.phases.statuses.success': 'Erfolg',
    'modulePage.phases.telemetry.agentName': 'Name des Agenten',
    'modulePage.phases.telemetry.duration': 'Dauer',
    'modulePage.phases.telemetry.inputTokens': 'Eingabe-Tokens',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'Keine Telemetriedaten verfügbar',
    'modulePage.phases.telemetry.outputTokens': 'Ausgabetoken',
    'modulePage.phases.telemetry.title': 'Telemetrie',
    'modulePage.phases.telemetry.toolCalls': 'Anzahl der Werkzeugaufrufe',
    'modulePage.phases.title': 'Migrationsphasen',
    'modulePage.phases.viewLog': 'Protokoll anzeigen',
    'modulePage.title': 'Moduldetails',
    'page.subtitle':
      'Initiieren und verfolgen Sie die asynchrone Umwandlung bestehender Automatisierungen in produktionsreife Ansible Playbooks.',
    'page.title': 'Konvertierungszentrum',
    'project.description': 'Beschreibung',
    'project.dirName': 'Verzeichnisname',
    'project.id': 'ID',
    'project.noModules': 'Es wurden noch keine Module gefunden...',
    'project.ownedBy': 'Eigentümer',
    'project.statuses.completed': 'Abgeschlossen',
    'project.statuses.created': 'Erstellt',
    'project.statuses.failed': 'Fehlgeschlagen',
    'project.statuses.inProgress': 'Im Gange',
    'project.statuses.initialized': 'Initialisiert',
    'project.statuses.initializing': 'Initialisierung',
    'project.statuses.none': '-',
    'projectDetailsCard.description': 'Beschreibung',
    'projectDetailsCard.dirName': 'Verzeichnisname',
    'projectDetailsCard.edit': 'Bearbeiten',
    'projectDetailsCard.name': 'Name',
    'projectDetailsCard.ownedBy': 'Eigentümer',
    'projectDetailsCard.sourceRepo': 'Quellcode-Repository',
    'projectDetailsCard.status': 'Status',
    'projectDetailsCard.targetRepo': 'Ziel-Repository',
    'projectDetailsCard.title': 'Projektdetails',
    'projectModulesCard.noModules': 'Es wurden noch keine Module gefunden...',
    'projectModulesCard.published': 'veröffentlicht',
    'projectModulesCard.title': 'Module ({{count}})',
    'projectModulesCard.toReview': 'Rezension',
    'projectPage.actionsTooltip':
      'Klicken Sie hier, um das Menü für Projektaktionen zu öffnen.',
    'projectPage.deleteConfirm.cancel': 'Abbrechen',
    'projectPage.deleteConfirm.confirm': 'Löschen',
    'projectPage.deleteConfirm.message':
      'Dieses Projekt, alle seine Module und Jobs werden endgültig gelöscht. Diese Handlung kann nicht rückgängig gemacht werden. Die im Zielrepository gespeicherten Artefakte bleiben erhalten.',
    'projectPage.deleteConfirm.title': 'Projekt "{{name}}" löschen?',
    'projectPage.deleteError': 'Projekt konnte nicht gelöscht werden',
    'projectPage.deleteProject': 'Löschen',
    'projectPage.title': 'Projekt',
    'projectTable.deleteError': 'Projekt konnte nicht gelöscht werden',
    'retriggerInit.confirm.confirmButton': 'erneut auslösen',
    'retriggerInit.confirm.message':
      'Dadurch wird die Erkennungsphase für das Projekt erneut ausgelöst und ein neuer Initialisierungsauftrag gestartet. Alle vorherigen Initialisierungsergebnisse werden überschrieben.',
    'retriggerInit.confirm.title':
      'Initialisierungsphase für "{{name}}" erneut auslösen?',
    'retriggerInit.confirm.userPromptLabel': 'Benutzeraufforderung (optional)',
    'retriggerInit.confirm.userPromptPlaceholder':
      'Geben Sie weitere Anweisungen für die Umstellung an…',
    'retriggerInit.error':
      'Fehler beim erneuten Auslösen der Initialisierung für das Projekt "{{name}}"',
    'retriggerInit.errorStart':
      'Projektinitialisierung konnte nicht gestartet werden',
    'retriggerInit.firstTrigger.confirmButton': 'Trigger-Initialisierungsphase',
    'retriggerInit.firstTrigger.message':
      'Nach Bestätigung wird die Recherchephase für dieses Projekt eingeleitet. Möglicherweise werden Sie nach Ihren Quell- und Ziel-SCM-Tokens gefragt.',
    'retriggerInit.firstTrigger.title':
      'Initialisierungsphase für "{{name}}" auslösen?',
    'retriggerInit.firstTrigger.userPromptLabel':
      'Benutzeraufforderung (optional)',
    'retriggerInit.firstTrigger.userPromptPlaceholder':
      'Geben Sie weitere Anweisungen für die Umstellung an…',
    'rulesPage.addRule': 'Regel hinzufügen',
    'rulesPage.deleteConfirm.cancel': 'Abbrechen',
    'rulesPage.deleteConfirm.confirm': 'Löschen',
    'rulesPage.deleteConfirm.deleteError': 'Fehler beim Löschen der Regel',
    'rulesPage.deleteConfirm.message':
      'Diese Regel wird dauerhaft gelöscht. Bestehende Projekte, die diese Regel bereits akzeptiert haben, sind nicht betroffen.',
    'rulesPage.deleteConfirm.title': 'Regel „{{title}}" löschen?',
    'rulesPage.dialog.cancel': 'Abbrechen',
    'rulesPage.dialog.createError': 'Fehler beim Erstellen der Regel',
    'rulesPage.dialog.createTitle': 'Regel erstellen',
    'rulesPage.dialog.descriptionField': 'Beschreibung',
    'rulesPage.dialog.editTitle': 'Regel bearbeiten',
    'rulesPage.dialog.requiredField': 'Für alle Projekte erforderlich',
    'rulesPage.dialog.save': 'Speichern',
    'rulesPage.dialog.titleField': 'Titel',
    'rulesPage.dialog.updateError': 'Fehler beim Aktualisieren der Regel',
    'rulesPage.manageRules': 'Regeln verwalten',
    'rulesPage.notAllowed':
      'Sie haben keine Berechtigung, Regeln zu verwalten.',
    'rulesPage.subtitle':
      'Verwalten Sie Regeln, die Projekte bei der Erstellung akzeptieren müssen.',
    'rulesPage.table.createdAt': 'Erstellt',
    'rulesPage.table.deleteRule': 'Regel löschen',
    'rulesPage.table.description': 'Beschreibung',
    'rulesPage.table.editRule': 'Regel bearbeiten',
    'rulesPage.table.id': 'ID',
    'rulesPage.table.noRules': 'Noch keine Regeln definiert.',
    'rulesPage.table.optional': 'Optional',
    'rulesPage.table.required': 'Erforderlich',
    'rulesPage.table.title': 'Titel',
    'rulesPage.title': 'Konvertierungsregeln',
    'scaffolder.rulesAcceptance.fetchError': 'Fehler beim Laden der Regeln',
    'scaffolder.rulesAcceptance.loadingRules': 'Regeln werden geladen...',
    'scaffolder.rulesAcceptance.noRulesConfigured':
      'Keine Regeln konfiguriert.',
    'scaffolder.rulesAcceptance.required': 'erforderlich',
    'sidebar.x2a.title': 'Konvertierungszentrum',
    'table.actions.collapseAll': 'Alle Zeilen ausblenden',
    'table.actions.collapseRow': 'Zeile ausblenden',
    'table.actions.deleteProject': 'Projekt löschen',
    'table.actions.expandAll': 'Alle Zeilen erweitern',
    'table.actions.expandRow': 'Zeile erweitern',
    'table.actions.retriggerInit':
      'Projektinitialisierungsphase erneut auslösen',
    'table.columns.createdAt': 'Erstellt am',
    'table.columns.name': 'Name',
    'table.columns.sourceRepo': 'Quellcode-Repository',
    'table.columns.status': 'Status',
    'table.columns.statusSortDisabledTooltip':
      'Die Sortierung nach Status ist nicht verfügbar, wenn die Anzahl der Projekte {{threshold}} überschreitet.',
    'table.columns.targetRepo': 'Ziel-Repository',
    'table.projectsCount': 'Projekte ({{count}})',
    'time.ago.daysAndHours': '{{days}}d {{hours}}h ago',
    'time.ago.daysOnly': '{{days}}d vor',
    'time.ago.hoursAndMinutes': '{{hours}}h {{minutes}}m ago',
    'time.ago.hoursOnly': '{{hours}}h vor',
    'time.ago.lessThanMinute': 'vor weniger als einer Minute',
    'time.ago.minutes': '{{minutes}}m vor',
    'time.duration.daysAndHours': '{{days}}d {{hours}}h',
    'time.duration.daysOnly': '{{days}}d',
    'time.duration.hoursAndMinutes': '{{hours}}h {{minutes}}m',
    'time.duration.hoursOnly': '{{hours}}h',
    'time.duration.minutesAndSeconds': '{{minutes}}m {{seconds}}s',
    'time.duration.secondsOnly': '{{seconds}}s',
    'time.jobTiming.finished':
      'Fertiggestellt vor {{timeAgo}} (dauerte {{duration}})',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': 'Laufzeit für {{duration}}',
  },
});

export default x2aPluginTranslationDe;
