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
    'alerts.duplicateWorkflowIds.learnMore': 'Weitere Informationen',
    'alerts.duplicateWorkflowIds.message':
      'Es wurden mehrere Workflows mit derselben ID erkannt. Bitte stellen Sie sicher, dass in allen Versionen eindeutige IDs verwendet werden.',
    'aria.close': 'Schließen',
    'common.back': 'Zurück',
    'common.cancel': 'Abbrechen',
    'common.close': 'Schließen',
    'common.details': 'Details',
    'common.execute': 'Ausführen',
    'common.goBack': 'Zurück',
    'common.links': 'Verknüpfungen',
    'common.next': 'Weiter',
    'common.review': 'Überprüfen',
    'common.run': 'Laufen',
    'common.unavailable': '---',
    'common.values': 'Werte',
    'duration.aDay': 'ein Tag',
    'duration.aFewSeconds': 'ein paar Sekunden',
    'duration.aMinute': 'eine Minute',
    'duration.aMonth': 'einen Monat',
    'duration.aSecond': 'eine Sekunde',
    'duration.aYear': 'pro Jahr',
    'duration.anHour': 'eine Stunde',
    'duration.days': '{{count}} Tage',
    'duration.hours': '{{count}} Stunden',
    'duration.minutes': '{{count}} Minuten',
    'duration.months': '{{count}} Monate',
    'duration.seconds': '{{count}} Sekunden',
    'duration.years': '{{count}} Jahre',
    'emptyState.illustrationAlt': 'Keine Workflows oder Läufe Illustration',
    'emptyState.runs.description':
      'Workflow-Läufe werden hier angezeigt, sobald Workflows ausgeführt wurden.',
    'emptyState.runs.runWorkflow': 'Workflow ausführen',
    'emptyState.runs.title': 'Noch keine Läufe',
    'emptyState.workflows.description':
      'Fügen Sie zunächst einen neuen Workflow hinzu.',
    'emptyState.workflows.title': 'Noch keine Workflows hinzugefügt',
    'emptyState.workflows.viewDocumentation': 'Dokumentation anzeigen',
    'formDecorator.error':
      'Der Formulardekorator muss Kontextdaten bereitstellen.',
    'messages.additionalDetailsAboutThisErrorAreNotAvailable':
      'Weitere Details zu diesem Fehler sind nicht verfügbar.',
    'messages.missingJsonSchema.message':
      'Für diesen Workflow ist kein JSON-Schema zur Eingabevalidierung definiert. Der Workflow kann weiterhin ausgeführt werden, die Eingabevalidierung ist jedoch eingeschränkt.',
    'messages.missingJsonSchema.title':
      'Fehlendes JSON-Schema für das Eingabeformular',
    'messages.noDataAvailable': 'Keine Daten verfügbar',
    'messages.noInputSchemaWorkflow':
      'Für diesen Workflow ist kein Eingabeschema definiert.',
    'messages.noVariablesFound':
      'Für diesen Durchlauf wurden keine Variablen gefunden.',
    'messages.workflowInstanceNoInputs':
      'Die Workflow-Instanz hat keine Eingaben.',
    'page.tabs.allRuns': 'Alle Läufe',
    'page.tabs.workflowDetails': 'Workflow-Details',
    'page.tabs.workflowRuns': 'Der Workflow wird ausgeführt',
    'page.tabs.workflows': 'Workflows',
    'page.title': 'Workflow-Orchestrator',
    'permissions.accessDenied': 'Zugriff verweigert',
    'permissions.accessDeniedDescription':
      'Sie haben keine Berechtigung, diesen Workflow-Lauf anzuzeigen.',
    'permissions.contactAdmin':
      'Bitte wenden Sie sich an Ihren Administrator, um die erforderlichen Berechtigungen anzufordern.',
    'permissions.missingOwnership':
      'Bei diesem Workflow-Lauf wurden keine Eigentümerinformationen protokolliert.',
    'permissions.notYourRun':
      'Dieser Workflow-Lauf wurde von einem anderen Benutzer initiiert.',
    'permissions.requiredPermission': 'Erforderliche Genehmigung',
    'reviewStep.hiddenFieldsNote':
      'Einige Parameter sind auf dieser Seite ausgeblendet.',
    'reviewStep.showHiddenParameters': 'Versteckte Parameter anzeigen',
    'run.abort.button': 'Abbrechen',
    'run.abort.completed.message':
      'Ein Abbruch des Laufs ist nicht möglich, da er bereits abgeschlossen wurde.',
    'run.abort.completed.title': 'Lauf abgeschlossen',
    'run.abort.title': 'Workflow-Ausführung abbrechen?',
    'run.abort.warning':
      'Durch einen Abbruch werden alle laufenden und ausstehenden Schritte sofort gestoppt. Sämtliche laufenden Arbeiten gehen verloren.',
    'run.inputs': 'Eingaben',
    'run.logs.noLogsAvailable':
      'Für diesen Workflow-Lauf sind keine Protokolle verfügbar.',
    'run.logs.title': 'Workflow-Protokolle {{processName}}',
    'run.logs.viewLogs': 'Protokolle anzeigen',
    'run.messages.eventTriggered':
      'Es wurde ein Ereignis gesendet, um diesen Workflow auszulösen. Es wird erscheinen, sobald der Lauf beginnt.',
    'run.pageTitle': '{{processName}} ausführen',
    'run.results': 'Ergebnisse',
    'run.retrigger': 'erneut auslösen',
    'run.status.aborted': 'Der Lauf wurde vor {{time}} abgebrochen.',
    'run.status.abortedWithoutTime': 'Der Lauf wurde abgebrochen.',
    'run.status.completed': 'Lauf abgeschlossen',
    'run.status.completedAt': 'Lauf abgeschlossen {{time}}',
    'run.status.completedWithMessage':
      'Lauf abgeschlossen {{time}} mit folgender Nachricht',
    'run.status.failed': 'Der Lauf ist fehlgeschlagen {{time}}',
    'run.status.failedAt': 'Der Lauf ist fehlgeschlagen {{time}}',
    'run.status.noAdditionalInfo':
      'Der Workflow lieferte keine weiteren Informationen zum Status.',
    'run.status.resultsWillBeDisplayedHereOnceTheRunIsComplete':
      'Die Ergebnisse werden hier angezeigt, sobald der Lauf abgeschlossen ist.',
    'run.status.running': 'Der Workflow läuft. Gestartet um {{time}}',
    'run.status.runningWaitingAtNode':
      'Der Workflow wird ausgeführt – wartet seit {{formattedTime}} am Knoten {{node}}',
    'run.status.workflowIsRunning': 'Der Workflow läuft. Gestartet um {{time}}',
    'run.suggestedNextWorkflow': 'Vorgeschlagener nächster Arbeitsablauf',
    'run.suggestedNextWorkflows': 'Empfohlene nächste Arbeitsabläufe',
    'run.title': 'Workflow ausführen',
    'run.variables': 'Laufzeitvariablen',
    'run.viewVariables': 'Variablen anzeigen',
    'stepperObjectField.error':
      'Das Stepper-Objektfeld wird für Schemata, die keine Eigenschaften enthalten, nicht unterstützt.',
    'table.actions.run': 'Laufen',
    'table.actions.runAsEvent': 'Als Ereignis ausführen',
    'table.actions.viewInputSchema': 'Eingabeschema anzeigen',
    'table.actions.viewRuns': 'View läuft',
    'table.actions.viewRunVariables': 'Laufvariablen anzeigen',
    'table.filters.started': 'Begonnen',
    'table.filters.entity': 'Entity',
    'table.filters.runBy': 'Run by',
    'table.filters.startedOptions.last7days': 'Letzte 7 Tage',
    'table.filters.startedOptions.thisMonth': 'Diesen Monat',
    'table.filters.startedOptions.today': 'Heute',
    'table.filters.startedOptions.yesterday': 'Gestern',
    'table.filters.status': 'Status',
    'table.headers.description': 'Beschreibung',
    'table.headers.duration': 'Dauer',
    'table.headers.lastRun': 'Letzter Lauf',
    'table.headers.lastRunStatus': 'Letzter Laufstatus',
    'table.headers.runsLastMonth': 'Läufe (letzter Monat)',
    'table.headers.successRatio': 'Erfolgsquote',
    'table.headers.name': 'Name',
    'table.headers.runStatus': 'Ausführungsstatus',
    'table.headers.started': 'Begonnen',
    'table.headers.status': 'Status',
    'table.headers.version': 'Version',
    'table.headers.entity': 'Entity',
    'table.headers.runBy': 'Run by',
    'table.headers.workflowName': 'Workflow-Name',
    'table.headers.workflowStatus': 'Workflow-Status',
    'table.status.aborted': 'Abgebrochen',
    'table.status.active': 'Aktiv',
    'table.status.completed': 'Abgeschlossen',
    'table.status.failed': 'Fehlgeschlagen',
    'table.status.pending': 'Ausstehend',
    'table.status.running': 'Wird ausgeführt',
    'table.title.allRuns': 'Alle Läufe ({{count}})',
    'table.title.allWorkflowRuns': 'Workflow-Ausführungen ({{count}})',
    'table.title.workflows': 'Workflows ({{count}})',
    'tooltips.aborted': 'Abgebrochen',
    'tooltips.active': 'Aktiv',
    'tooltips.completed': 'Abgeschlossen',
    'tooltips.pending': 'Ausstehend',
    'tooltips.suspended': 'Ausgesetzt',
    'tooltips.userNotAuthorizedAbort':
      'Benutzer nicht berechtigt, den Workflow abzubrechen',
    'tooltips.userNotAuthorizedExecute':
      'Benutzer nicht berechtigt, Workflow auszuführen',
    'tooltips.retriggerNotSupportedForAborted':
      'Erneutes Auslösen vom Abbruchpunkt wird nicht unterstützt. Verwenden Sie „Gesamter Workflow“, um einen neuen Lauf mit denselben Eingaben zu starten.',
    'tooltips.workflowDown':
      'Der Workflow ist momentan nicht verfügbar oder befindet sich in einem Fehlerzustand.',
    'workflow.buttons.entireWorkflow': 'Gesamter Workflow',
    'workflow.buttons.fromAbortedPoint': 'Vom Abbruchpunkt',
    'workflow.buttons.fromFailurePoint': 'Vom Versagenspunkt',
    'workflow.buttons.run': 'Laufen',
    'workflow.buttons.runAgain': 'Lauf erneut',
    'workflow.buttons.runAsEvent': 'Als Ereignis ausführen',
    'workflow.buttons.runFailedAgain': 'Der Lauf ist erneut fehlgeschlagen.',
    'workflow.buttons.runWorkflow': 'Workflow ausführen',
    'workflow.buttons.running': 'Wird ausgeführt...',
    'workflow.definition': 'Workflow-Definition',
    'workflow.inputSchema': 'Eingabeschema',
    'workflow.inputSchemaDescription':
      'Definiert erforderliche Datenfelder und Validierung für diesen Workflow.',
    'workflow.successRatio': 'Erfolgsquote',
    'workflow.successRatioDescription':
      'Anteil erfolgreicher Ausführungen im Vergleich zu fehlgeschlagenen Ausführungen für diesen Workflow.',
    'workflow.runSuccess': 'Lauferfolg',
    'workflow.statsSuccess': 'Erfolg',
    'workflow.statsFailed': 'Fehlgeschlagen',
    'workflow.details': 'Details',
    'workflow.errors.abortFailed':
      'Abbruch fehlgeschlagen: Der Lauf wurde bereits abgeschlossen.',
    'workflow.errors.abortFailedWithReason':
      'Abbruch fehlgeschlagen: {{reason}}',
    'workflow.errors.failedToLoadDetails':
      'Details für den Workflow mit der ID {{id}} konnten nicht geladen werden.',
    'workflow.errors.retriggerFailed':
      'Erneuter Auslöser fehlgeschlagen: {{reason}}',
    'workflow.fields.description': 'Beschreibung',
    'workflow.fields.duration': 'Dauer',
    'workflow.fields.entity': 'Entität',
    'workflow.fields.runStatus': 'Ausführungsstatus',
    'workflow.fields.started': 'Begonnen',
    'workflow.fields.version': 'Version',
    'workflow.fields.workflow': 'Workflow',
    'workflow.fields.workflowId': 'Lauf-ID',
    'workflow.fields.workflowIdCopied': 'Lauf-ID in die Zwischenablage kopiert',
    'workflow.fields.workflowStatus': 'Workflow-Status',
    'workflow.messages.areYouSureYouWantToRunThisWorkflow':
      'Sind Sie sicher, dass Sie diesen Workflow ausführen möchten?',
    'workflow.messages.userNotAuthorizedExecute':
      'Benutzer ist nicht berechtigt, den Workflow auszuführen.',
    'workflow.messages.workflowDown':
      'Der Workflow ist momentan nicht verfügbar oder befindet sich in einem Fehlerzustand. Die Ausführung jetzt kann fehlschlagen oder zu unerwarteten Ergebnissen führen.',
    'workflow.progress': 'Workflow-Fortschritt',
    'workflow.status.available': 'Verfügbar',
    'workflow.status.unavailable': 'Nicht verfügbar',
    'samlSso.title': 'GitHub SAML SSO-Sitzung abgelaufen',
    'samlSso.reauthorizeButton': 'SSO erneut autorisieren',
    'samlSso.body':
      'Ihre GitHub SAML SSO-Sitzung ist abgelaufen. Ihre Organisation erfordert eine aktive SAML-Sitzung, um auf ihre Ressourcen zugreifen zu können.',
    'samlSso.reauthorizeHint':
      "Klicken Sie auf 'SSO erneut autorisieren', um sich bei dem Identitätsanbieter Ihrer Organisation erneut zu authentifizieren.",
    'samlSso.fallbackHint':
      'Bitte melden Sie sich ab und über Einstellungen > Auth-Anbieter erneut an, um Ihre SAML-Sitzung wiederherzustellen.',
  },
});

export default orchestratorTranslationDe;
