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
      'Starten und verfolgen Sie die asynchrone Umwandlung von bestehender Automatisierung in produktionsreife Ansible Playbooks.',
    'table.columns.name': 'Name',
    'table.columns.status': 'Status',
    'table.columns.statusSortDisabledTooltip':
      'Sortierung nach Status ist nicht verfügbar, wenn die Projektanzahl {{threshold}} überschreitet',
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
    'projectDetailsCard.status': 'Status',
    'projectDetailsCard.ownedBy': 'Im Besitz von',
    'projectDetailsCard.dirName': 'Verzeichnisname',
    'projectDetailsCard.description': 'Beschreibung',
    'projectDetailsCard.sourceRepo': 'Quell-Repository',
    'projectDetailsCard.targetRepo': 'Ziel-Repository',
    'projectDetailsCard.edit': 'Bearbeiten',
    'editProjectDialog.title': 'Projekt bearbeiten',
    'editProjectDialog.cancel': 'Abbrechen',
    'editProjectDialog.update': 'Aktualisieren',
    'editProjectDialog.updateError': 'Projekt konnte nicht aktualisiert werden',
    'editProjectDialog.ownerChangeWarningTitle':
      'Eigentumsübertragung bestätigen',
    'editProjectDialog.ownerChangeWarning':
      'Ein Eigentümerwechsel kann dazu führen, dass Sie den Zugriff auf dieses Projekt verlieren, wenn Ihre Berechtigungen den neuen Eigentümer nicht abdecken. Ein Administrator kann den Zugriff bei Bedarf wiederherstellen.',
    'editProjectDialog.ownerChangeConfirm': 'Eigentum übertragen',
    'editProjectDialog.nameRequired': 'Name ist erforderlich',
    'editProjectDialog.ownerFormatHint':
      'Muss eine Backstage-Entität-Referenz sein, z. B. user:default/name oder group:default/team',
    'projectModulesCard.title': 'Module ({{count}})',
    'projectModulesCard.noModules': 'Noch keine Module gefunden...',
    'projectModulesCard.toReview': 'überprüfen',
    'projectModulesCard.published': 'veröffentlicht',
    'projectModulesCard.spinner':
      'Die Erkennungsphase wird ausgeführt und die Modulliste anhand des Migrationsplans aktualisiert…',
    'projectPage.title': 'Projekt',
    'projectPage.actionsTooltip':
      'Klicken Sie, um das Menü für Projektaktionen zu öffnen',
    'projectPage.deleteError': 'Fehler beim Löschen des Projekts',
    'projectPage.deleteProject': 'Dieses Projekt löschen',
    'projectPage.deleteConfirm.title': 'Projekt "{{name}}" löschen?',
    'projectPage.deleteConfirm.message':
      'Dieses Projekt, alle seine Module und Jobs werden unwiderruflich gelöscht. Diese Aktion kann nicht rückgängig gemacht werden. Die im Ziel-Repository gespeicherten Artefakte bleiben erhalten.',
    'projectPage.deleteConfirm.cancel': 'Abbrechen',
    'projectPage.deleteConfirm.confirm': 'Löschen',
    'projectTable.deleteError': 'Fehler beim Löschen des Projekts',
    'project.description': 'Beschreibung',
    'project.id': 'ID',
    'project.ownedBy': 'Im Besitz von',
    'project.dirName': 'Verzeichnisname',
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
      'Starten und verfolgen Sie die Konvertierung von bestehender Automatisierung in produktionsreife Ansible',
    'emptyPage.startFirstConversion': 'Erste Konversion starten',
    'emptyPage.notAllowedTitle': 'Zugriff verweigert',
    'emptyPage.notAllowedDescription':
      'Sie haben keine Berechtigung, auf Konversionsprojekte zuzugreifen.',
    'module.phases.init': 'Init',
    'module.phases.none': '-',
    'module.phases.analyze': 'Analysieren',
    'module.phases.migrate': 'Migrieren',
    'module.phases.publish': 'Veröffentlichen',
    'module.phases.adversarial-analyze': 'Adversarielle Analyse',
    'module.phases.adversarial-migrate': 'Adversarielle Migration',
    'module.summary.total': 'Gesamt',
    'module.summary.finished': 'Abgeschlossen',
    'module.summary.waiting': 'Wartend',
    'module.summary.pending': 'Ausstehend',
    'module.summary.running': 'Läuft',
    'module.summary.error': 'Fehler',
    'module.summary.cancelled': 'Abgebrochen',
    'module.summary.removed': 'Entfernt',
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
    'module.statuses.stale': 'Veraltet',
    'module.statuses.removed': 'Entfernt',
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
    'modulePage.phases.statuses.stale': 'Veraltet',
    'modulePage.phases.reanalyzeInstructions':
      'Der Modulmigrationsplan ist bereits vorhanden. Falls der gesamte Projektmigrationsplan aktualisiert wurde, lösen Sie die Analyse erneut aus, um die Änderungen widerzuspiegeln.',
    'modulePage.phases.rerunAnalyze': 'Modulmigrationsplan neu erstellen',
    'modulePage.phases.analyzeInstructions':
      'Überprüfen Sie vor der Analyse zunächst den gesamten Projektmigrationsplan. Sein Inhalt bestimmt die Analyse des Moduls.',
    'modulePage.phases.runAnalyze': 'Modulmigrationsplan erstellen',
    'modulePage.phases.migrateInstructions':
      'Überprüfen Sie vor der Migration den Modulmigrationsplan. Der Migrationsprozess konvertiert den Quellcode basierend auf dem Plan in Ansible.',
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
    'modulePage.phases.attempts': 'Versuche',
    'modulePage.phases.totalElapsed': 'Insgesamt verstrichene Zeit',
    'modulePage.phases.commitId': 'Letzte Commit-ID',
    'modulePage.phases.viewLog': 'Log anzeigen',
    'modulePage.phases.hideLog': 'Log ausblenden',
    'modulePage.phases.noLogsAvailable': 'Noch keine Logs verfügbar...',
    'modulePage.phases.logWaitingForStream':
      'Warte auf Log-Ausgabe vom Cluster...',
    'modulePage.phases.telemetry.title': 'Telemetrie',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'Keine Telemetrie verfügbar',
    'modulePage.phases.telemetry.agentName': 'Agent-Name',
    'modulePage.phases.telemetry.duration': 'Dauer',
    'modulePage.phases.telemetry.inputTokens': 'Eingabe-Tokens',
    'modulePage.phases.telemetry.outputTokens': 'Ausgabe-Tokens',
    'modulePage.phases.telemetry.toolCalls': 'Anzahl der Werkzeugaufrufe',
    'modulePage.phases.telemetry.totalInputTokens':
      'Gesamtzahl der Eingabe-Token',
    'modulePage.phases.telemetry.totalOutputTokens':
      'Gesamtzahl der Ausgabe-Token',
    'modulePage.phases.resyncMigrationPlanInstructions':
      'Modulliste synchronisieren, um sie an den Migrationsplan anzupassen.',
    'modulePage.phases.staleInstructions':
      'Dieses Phasenergebnis ist veraltet, da eine vorgelagerte Phase erneut ausgeführt wurde. Zum Aktualisieren erneut ausführen.',
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
    'bulkRun.projectPageAction': 'Alle Module ausführen',
    'bulkRun.projectConfirm.title':
      'Alle Module im Projekt „{{name}}" ausführen?',
    'bulkRun.projectConfirm.message':
      'Dies löst die nächste Migrationsphase für jedes Modul in diesem Projekt aus, dessen aktueller Status dies zulässt. Stellen Sie sicher, dass Sie alle erforderlichen Artefakte in den Ziel-Repositories überprüft haben, bevor Sie diese Aktion ausführen. Module, die nicht berechtigt sind, werden übersprungen.',
    'bulkRun.globalConfirm.title':
      'Alle berechtigten Projekte und Module ausführen?',
    'bulkRun.globalConfirm.message':
      'Dies löst die nächste Migrationsphase für alle berechtigten Module in allen Projekten aus, auf die Sie Schreibzugriff haben, einschließlich Projekte, die auf der aktuellen Seite nicht sichtbar sind. Stellen Sie sicher, dass Sie alle erforderlichen Artefakte in den Ziel-Repositories überprüft haben, bevor Sie diese Aktion ausführen.',
    'bulkRun.globalConfirm.messageInitRetrigger':
      'Einige Projekte sind berechtigt, die Init-Phase erneut auszuführen. Deren Erkennungsphase wird ebenfalls erneut ausgelöst.',
    'bulkRun.globalConfirm.noInitEligible':
      'Derzeit sind keine Projekte für eine erneute Ausführung der Init-Phase berechtigt.',
    'bulkRun.globalConfirm.userPromptLabel':
      'Benutzeranweisung für Init-Neustart (optional)',
    'bulkRun.globalConfirm.userPromptPlaceholder':
      'Falls Projekte ihre Init-Phase erneut durchlaufen müssen, wird diese Anweisung zur Anpassung der Konvertierung verwendet…',
    'bulkRun.projectPageConfirm.title': 'Alle Module in „{{name}}" ausführen?',
    'bulkRun.projectPageConfirm.message':
      'Dies löst die nächste Migrationsphase für jedes Modul in diesem Projekt aus, dessen aktueller Status dies zulässt. Stellen Sie sicher, dass Sie alle erforderlichen Artefakte in den Ziel-Repositories überprüft haben, bevor Sie diese Aktion ausführen. Module, die nicht berechtigt sind, werden übersprungen.',
    'bulkRun.confirm': 'Alle ausführen',
    'bulkRun.cancel': 'Abbrechen',
    'bulkRun.errorProject':
      'Fehler beim Ausführen der Module im Projekt „{{name}}"',
    'bulkRun.errorModuleStart':
      'Fehler beim Starten der Phase „{{phase}}" für Modul „{{moduleName}}"',
    'bulkRun.errorGlobal': 'Fehler bei der Massenausführung',
    'retriggerInit.confirm.title': 'Init-Phase für „{{name}}" erneut auslösen?',
    'retriggerInit.confirm.message':
      'Dies löst die Erkennungsphase für das Projekt erneut aus und startet einen neuen Init-Job. Vorherige Init-Ergebnisse werden ersetzt.',
    'retriggerInit.confirm.userPromptLabel': 'Benutzeranweisung (optional)',
    'retriggerInit.confirm.userPromptPlaceholder':
      'Zusätzliche Anweisungen für die Konvertierung angeben…',
    'retriggerInit.confirm.confirmButton': 'Erneut auslösen',
    'retriggerInit.firstTrigger.title': 'Init-Phase für „{{name}}" starten?',
    'retriggerInit.firstTrigger.message':
      'Nach der Bestätigung wird die Erkennungsphase für dieses Projekt gestartet. Möglicherweise werden Sie nach Ihren SCM-Tokens für Quelle und Ziel gefragt.',
    'retriggerInit.firstTrigger.userPromptLabel':
      'Benutzeranweisung (optional)',
    'retriggerInit.firstTrigger.userPromptPlaceholder':
      'Zusätzliche Anweisungen für die Konvertierung angeben…',
    'retriggerInit.firstTrigger.confirmButton': 'Init-Phase starten',
    'retriggerInit.error':
      'Fehler beim erneuten Auslösen der Init-Phase für Projekt „{{name}}"',
    'retriggerInit.errorStart':
      'Fehler beim Starten der Projektinitialisierung',
    'resyncMigrationPlan.action': 'Migrationsplan erneut synchronisieren',
    'resyncMigrationPlan.confirm.title':
      'Migrationsplan für „{{name}}“ erneut synchronisieren?',
    'resyncMigrationPlan.confirm.message':
      'Dadurch wird der Migrationsplan aus dem Ziel-Repository erneut gelesen und die Modulliste entsprechend aktualisiert. Neue Module werden hinzugefügt und Module, die nicht mehr im Plan enthalten sind, werden als entfernt markiert. Wenn Sie Änderungen am Dokument vornehmen, z. B. ein Modul entfernen, achten Sie darauf, dass das Dokument weiterhin schlüssig bleibt.',
    'resyncMigrationPlan.confirm.warning':
      'Als entfernt markierte Module behalten ihre Auftragsverlauf, können aber nicht mehr für neue Phasenausführungen verwendet werden. Diese Aktion kann für entfernte Module nicht rückgängig gemacht werden, es sei denn, sie werden dem Migrationsplan erneut hinzugefügt.',
    'resyncMigrationPlan.confirm.confirmButton': 'Erneut synchronisieren',
    'resyncMigrationPlan.running':
      'Modulliste wird aus dem Migrationsplan erneut synchronisiert…',
    'resyncMigrationPlan.error':
      'Erneute Synchronisierung des Migrationsplans für Projekt „{{name}}“ fehlgeschlagen',
    'resyncMigrationPlan.errorStart':
      'Erneute Synchronisierung des Migrationsplans konnte nicht gestartet werden',
    'scaffolder.rulesAcceptance.loadingRules': 'Regeln werden geladen...',
    'scaffolder.rulesAcceptance.noRulesConfigured':
      'Es sind keine Regeln konfiguriert.',
    'scaffolder.rulesAcceptance.required': 'erforderlich',
    'scaffolder.rulesAcceptance.fetchError':
      'Regeln konnten nicht abgerufen werden',
    'rulesPage.title': 'Konvertierungsregeln',
    'rulesPage.subtitle':
      'Verwalten Sie Regeln, die Projekte bei ihrer Erstellung akzeptieren müssen.',
    'rulesPage.addRule': 'Regel hinzufügen',
    'rulesPage.manageRules': 'Regeln verwalten',
    'rulesPage.notAllowed':
      'Sie haben keine Berechtigung, Regeln zu verwalten.',
    'rulesPage.table.id': 'ID',
    'rulesPage.table.title': 'Titel',
    'rulesPage.table.description': 'Beschreibung',
    'rulesPage.table.required': 'Erforderlich',
    'rulesPage.table.optional': 'Optional',
    'rulesPage.table.createdAt': 'Erstellt',
    'rulesPage.table.editRule': 'Regel bearbeiten',
    'rulesPage.table.deleteRule': 'Regel löschen',
    'rulesPage.table.noRules': 'Es wurden noch keine Regeln definiert.',
    'rulesPage.deleteConfirm.title': 'Regel „{{title}}“ löschen?',
    'rulesPage.deleteConfirm.message':
      'Diese Regel wird dauerhaft gelöscht. Vorhandene Projekte, die diese Regel bereits akzeptiert haben, sind davon nicht betroffen.',
    'rulesPage.deleteConfirm.confirm': 'Löschen',
    'rulesPage.deleteConfirm.cancel': 'Abbrechen',
    'rulesPage.deleteConfirm.deleteError': 'Regel konnte nicht gelöscht werden',
    'rulesPage.dialog.createTitle': 'Regel erstellen',
    'rulesPage.dialog.editTitle': 'Regel bearbeiten',
    'rulesPage.dialog.titleField': 'Titel',
    'rulesPage.dialog.descriptionField': 'Beschreibung',
    'rulesPage.dialog.requiredField': 'Für alle Projekte erforderlich',
    'rulesPage.dialog.save': 'Speichern',
    'rulesPage.dialog.cancel': 'Abbrechen',
    'rulesPage.dialog.createError': 'Regel konnte nicht erstellt werden',
    'rulesPage.dialog.updateError': 'Regel konnte nicht aktualisiert werden',
    'modulePage.phases.runAdversarialReview':
      'Gegnerische Überprüfung ausführen',
    'modulePage.phases.adversarialReview': 'Gegnerische Überprüfung',
    'modulePage.phases.adversarialNoRuns': 'Noch keine Ausführungen',
    'modulePage.phases.adversarialRunning': 'Gegnerische Überprüfung läuft…',
    'modulePage.phases.adversarialCriticalAgentsWarning':
      'Kritische gegnerische Agents sind konfiguriert, wurden aber für diese Phase noch nicht ausgeführt.',
    'modulePage.phases.adversarialAgentLabel': 'gegnerisch',
    'modulePage.phases.adversarialCriticalFindings': 'Kritische Befunde',
    'modulePage.phases.adversarialWarningFindings': 'Warnungsbefunde',
    'modulePage.phases.adversarialCompleted': 'Abgeschlossen',
    'modulePage.phases.adversarialNoFindings': 'Keine Befunde',
    'modulePage.phases.adversarialResult': 'Ergebnis',
    'modulePage.phases.adversarialAgents.title': 'Gegnerische Agents',
    'modulePage.phases.adversarialAgents.placeholder': 'Agents auswählen…',
    'modulePage.phases.adversarialAgents.noAgentsAvailable':
      'Für diese Phase stehen keine gegnerischen Agents zur Verfügung. Erstellen Sie Agents auf der Seite „Gegnerische Agents“.',
    'modulePage.phases.adversarialAgents.loadingError':
      'Laden der gegnerischen Agents fehlgeschlagen',
    'modulePage.phases.adversarialRunError':
      'Gegnerische Überprüfung konnte nicht gestartet werden',
    'artifact.types.adversarial_report': 'Gegnerischer Bericht',
    'artifact.types.adversarial_report_json': 'Gegnerischer Bericht (JSON)',
    'adversarialAgentsPage.title': 'Gegnerische Agents',
    'adversarialAgentsPage.subtitle':
      'Verwalten Sie KI-Agents, die Migrationsergebnisse auf Sicherheitsrisiken, Funktionslücken und Korrektheitsprobleme überprüfen.',
    'adversarialAgentsPage.manageAdversarialAgents':
      'Gegnerische Agents verwalten',
    'adversarialAgentsPage.addAgent': 'Agent hinzufügen',
    'adversarialAgentsPage.notAllowed':
      'Sie haben keine Berechtigung zum Verwalten generischer Agents.',
    'adversarialAgentsPage.table.name': 'Name',
    'adversarialAgentsPage.table.prompt': 'Prompt',
    'adversarialAgentsPage.table.phases': 'Phasen',
    'adversarialAgentsPage.table.severity': 'Schweregrad',
    'adversarialAgentsPage.table.critical': 'Kritisch',
    'adversarialAgentsPage.table.warning': 'Warnung',
    'adversarialAgentsPage.table.createdAt': 'Erstellt',
    'adversarialAgentsPage.table.createdBy': 'Erstellt von',
    'adversarialAgentsPage.table.editAgent': 'Agent bearbeiten',
    'adversarialAgentsPage.table.deleteAgent': 'Agent löschen',
    'adversarialAgentsPage.table.noAgents':
      'Es wurden noch keine gegnerischen Agents definiert.',
    'adversarialAgentsPage.table.fetchError':
      'Gegnerische Agents konnten nicht abgerufen werden',
    'adversarialAgentsPage.deleteConfirm.title': 'Agent „{{name}}“ löschen?',
    'adversarialAgentsPage.deleteConfirm.message':
      'Diese Aktion kann nicht rückgängig gemacht werden.',
    'adversarialAgentsPage.deleteConfirm.confirm': 'Löschen',
    'adversarialAgentsPage.deleteConfirm.cancel': 'Abbrechen',
    'adversarialAgentsPage.deleteConfirm.deleteError':
      'Agent konnte nicht gelöscht werden',
    'adversarialAgentsPage.dialog.createTitle': 'Gegnerischen Agent erstellen',
    'adversarialAgentsPage.dialog.editTitle': 'Gegnerischen Agent bearbeiten',
    'adversarialAgentsPage.dialog.nameField': 'Name',
    'adversarialAgentsPage.dialog.namePlaceholder':
      'z. B. Überprüfung der Rechteerweiterung',
    'adversarialAgentsPage.dialog.promptField': 'Prompt',
    'adversarialAgentsPage.dialog.promptPlaceholder':
      'Beschreiben Sie, worauf dieser Agent achten sollte...',
    'adversarialAgentsPage.dialog.promptHelper':
      'Beschreiben Sie genau, wonach gesucht und wie Ergebnisse zurückgegeben werden sollen (50–5.000 Zeichen)',
    'adversarialAgentsPage.dialog.promptCharacterCount':
      '/5.000 Zeichen (mind. 50)',
    'adversarialAgentsPage.dialog.phasesField': 'Workflow-Phasen',
    'adversarialAgentsPage.dialog.phasesHelper':
      'Wählen Sie aus, in welchen Workflow-Phasen dieser Agent ausgeführt wird',
    'adversarialAgentsPage.dialog.phaseAnalyze': 'Analysieren',
    'adversarialAgentsPage.dialog.phaseMigrate': 'Migrieren',
    'adversarialAgentsPage.dialog.criticalField': 'Kritischer Agent',
    'adversarialAgentsPage.dialog.criticalHelper':
      'Kritische Agents erzeugen Befunde mit dem Schweregrad „kritisch“; nicht kritische Agents erzeugen Warnungen',
    'adversarialAgentsPage.dialog.nameValidation':
      'Der Name muss zwischen 3 und 100 Zeichen lang sein',
    'adversarialAgentsPage.dialog.phasesValidation':
      'Mindestens eine Phase ist erforderlich',
    'adversarialAgentsPage.dialog.save': 'Speichern',
    'adversarialAgentsPage.dialog.cancel': 'Abbrechen',
    'adversarialAgentsPage.dialog.createError':
      'Agent konnte nicht erstellt werden',
    'adversarialAgentsPage.dialog.updateError':
      'Agent-Aktualisierung fehlgeschlagen',
  },
});

export default x2aPluginTranslationDe;
