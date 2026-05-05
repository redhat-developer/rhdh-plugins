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

import { orchestratorTranslationRef } from './ref';

/**
 * de translation for plugin.orchestrator.
 * @public
 */
const orchestratorTranslationDe = createTranslationMessages({
  ref: orchestratorTranslationRef,
  messages: {
    'page.title': 'Workflow-Orchestrator',
    'page.tabs.workflows': 'Workflows',
    'page.tabs.allRuns': 'Alle Ausführungen',
    'page.tabs.workflowDetails': 'Workflow-Details',
    'page.tabs.workflowRuns': 'Der Workflow wird ausgeführt',
    'table.title.workflows': 'Workflows',
    'table.title.allRuns': 'Alle Ausführungen ({{count}})',
    'table.actions.run': 'Ausführung',
    'table.actions.runAsEvent': 'Als Ereignis ausführen',
    'table.actions.viewRuns': 'Ausführungen anzeigen',
    'table.actions.viewInputSchema': 'Eingabeschema anzeigen',
    'table.status.running': 'Wird ausgeführt',
    'table.status.failed': 'Fehlgeschlagen',
    'table.status.completed': 'Abgeschlossen',
    'table.status.aborted': 'Abgebrochen',
    'table.status.pending': 'Ausstehend',
    'table.status.active': 'Aktiv',
    'table.filters.status': 'Status',
    'table.filters.started': 'Gestartet',
    'table.filters.startedOptions.today': 'Heute',
    'table.filters.startedOptions.yesterday': 'Gestern',
    'table.filters.startedOptions.last7days': 'Letzte 7 Tage',
    'table.filters.startedOptions.thisMonth': 'Dieser Monat',
    'workflow.details': 'Details',
    'workflow.definition': 'Workflow-Definition',
    'workflow.progress': 'Workflow-Fortschritt',
    'workflow.status.available': 'Verfügbar',
    'workflow.status.unavailable': 'Nicht verfügbar',
    'workflow.fields.workflow': 'Workflow',
    'workflow.fields.workflowStatus': 'Workflow-Status',
    'workflow.fields.runStatus': 'Ausführungsstatus',
    'workflow.fields.duration': 'Dauer',
    'workflow.fields.description': 'Beschreibung',
    'workflow.fields.started': 'Gestartet',
    'workflow.fields.workflowId': 'Ausführungs-ID',
    'workflow.fields.workflowIdCopied':
      'Ausführungs-ID wurde in die Zwischenablage kopiert',
    'workflow.fields.version': 'Version',
    'table.headers.version': 'Version',
    'workflow.errors.retriggerFailed':
      'Erneuter Auslöser fehlgeschlagen: {{reason}}',
    'workflow.errors.abortFailedWithReason':
      'Abbruch fehlgeschlagen: {{reason}}',
    'workflow.buttons.runAsEvent': 'Als Ereignis ausführen',
    'run.title': 'Workflow ausführen',
    'run.pageTitle': 'Ausführung von {{processName}}',
    'run.variables': 'Ausführungsvariablen',
    'run.inputs': 'Eingaben',
    'run.results': 'Ergebnisse',
    'run.logs.viewLogs': 'Logs anzeigen',
    'run.logs.title': 'Ausführungs-Logs',
    'run.logs.noLogsAvailable':
      'Für diese Workflow-Ausführung sind keine Logs verfügbar.',
    'run.abort.title': 'Workflow-Ausführung abbrechen?',
    'run.abort.button': 'Abbrechen',
    'run.abort.warning':
      'Durch einen Abbruch werden alle laufenden und ausstehenden Schritte sofort beendet. Sämtliche laufenden Arbeiten gehen verloren.',
    'run.abort.completed.title': 'Ausführung abgeschlossen',
    'run.abort.completed.message':
      'Abbruch der Ausführung ist nicht möglich, da sie bereits abgeschlossen wurde.',
    'run.status.completed': 'Ausführung abgeschlossen',
    'run.status.failed': 'Ausführung ist fehlgeschlagen {{time}}',
    'run.status.completedWithMessage':
      'Ausführung {{time}} mit folgender Nachricht abgeschlossen',
    'run.status.failedAt': 'Ausführung ist fehlgeschlagen {{time}}',
    'run.messages.eventTriggered':
      'Ein Ereignis wurde gesendet, um diesen Workflow zu starten. Es wird angezeigt, sobald die Ausführung beginnt.',
    'run.viewVariables': 'Variablen anzeigen',
    'run.suggestedNextWorkflow': 'Vorgeschlagener nächster Workflow',
    'run.suggestedNextWorkflows': 'Empfohlene nächste Workflows',
    'tooltips.completed': 'Abgeschlossen',
    'tooltips.active': 'Aktiv',
    'tooltips.aborted': 'Abgebrochen',
    'tooltips.suspended': 'Ausgesetzt',
    'tooltips.pending': 'Ausstehend',
    'tooltips.workflowDown':
      'Der Workflow ist momentan nicht verfügbar oder befindet sich in einem Fehlerzustand.',
    'tooltips.userNotAuthorizedAbort':
      'Der Benutzer ist nicht berechtigt, den Workflow abzubrechen',
    'tooltips.userNotAuthorizedExecute':
      'Der Benutzer ist nicht berechtigt, den Workflow auszuführen',
    'messages.noDataAvailable': 'Keine Daten verfügbar',
    'messages.noVariablesFound':
      'Für diese Ausführung wurden keine Variablen gefunden.',
    'messages.noInputSchemaWorkflow':
      'Für diesen Workflow ist kein Eingabeschema definiert.',
    'messages.workflowInstanceNoInputs':
      'Die Workflow-Instanz hat keine Eingaben.',
    'messages.missingJsonSchema.title':
      'Fehlendes JSON-Schema für das Eingabeformular',
    'messages.missingJsonSchema.message':
      'Für diesen Workflow ist kein JSON-Schema zur Eingabevalidierung definiert. Der Workflow kann weiterhin ausgeführt werden, die Eingabevalidierung ist jedoch eingeschränkt.',
    'reviewStep.hiddenFieldsNote':
      'Einige Parameter sind auf dieser Seite ausgeblendet.',
    'reviewStep.showHiddenParameters': 'Ausgeblendete Parameter anzeigen',
    'common.close': 'Schließen',
    'common.cancel': 'Abbrechen',
    'common.execute': 'Ausführen',
    'common.details': 'Details',
    'common.links': 'Verknüpfungen',
    'common.values': 'Werte',
    'common.back': 'Zurück',
    'common.run': 'Ausführung',
    'common.next': 'Weiter',
    'common.review': 'Überprüfen',
    'common.unavailable': '---',
    'common.goBack': 'Zurück',
    'permissions.accessDenied': 'Zugriff verweigert',
    'permissions.accessDeniedDescription':
      'Sie haben keine Berechtigung, diese Workflow-Ausführung anzuzeigen.',
    'permissions.requiredPermission': 'Erforderliche Berechtigung',
    'permissions.contactAdmin':
      'Wenden Sie sich an den Administrator, um die erforderlichen Berechtigungen anzufordern.',
    'permissions.missingOwnership':
      'Bei dieser Workflow-Ausführung wurden keine Eigentümerinformationen protokolliert.',
    'permissions.notYourRun':
      'Diese Workflow-Ausführung wurde von einem anderen Benutzer initiiert.',
    'duration.aFewSeconds': 'ein paar Sekunden',
    'duration.aSecond': 'eine Sekunde',
    'duration.seconds': '{{count}} Sekunden',
    'duration.aMinute': 'eine Minute',
    'duration.minutes': '{{count}} Minuten',
    'duration.anHour': 'eine Stunde',
    'duration.hours': '{{count}} Stunden',
    'duration.aDay': 'ein Tag',
    'duration.days': '{{count}} Tage',
    'duration.aMonth': 'ein Monat',
    'duration.months': '{{count}} Monate',
    'duration.aYear': 'Ein Jahr',
    'duration.years': '{{count}} Jahre',
    'alerts.duplicateWorkflowIds.message':
      'Es wurden mehrere Workflows mit derselben ID erkannt. Verwenden Sie eindeutige IDs über verschiedene Versionen hinweg.',
    'alerts.duplicateWorkflowIds.learnMore': 'Weitere Informationen',
    'stepperObjectField.error':
      'Das Stepper-Objektfeld wird für Schemata, die keine Eigenschaften enthalten, nicht unterstützt.',
    'formDecorator.error':
      'Der Formulardekorator muss Kontextdaten bereitstellen.',
    'aria.close': 'schließen',
  },
});

export default orchestratorTranslationDe;
