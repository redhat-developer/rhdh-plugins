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
 * Italian translation for plugin.orchestrator.
 * @public
 */
const orchestratorTranslationIt = createTranslationMessages({
  ref: orchestratorTranslationRef,
  messages: {
    'alerts.duplicateWorkflowIds.learnMore': 'Scopri di più',
    'alerts.duplicateWorkflowIds.message':
      'Rilevati più flussi di lavoro con lo stesso ID. Assicurati che vengano utilizzati ID univoci per le diverse versioni.',
    'aria.close': 'chiudi',
    'common.back': 'Indietro',
    'common.cancel': 'Annulla',
    'common.close': 'Chiudi',
    'common.details': 'Dettagli',
    'common.execute': 'Esegui',
    'common.goBack': 'Torna indietro',
    'common.links': 'Link',
    'common.next': 'Successivo',
    'common.review': 'Revisione',
    'common.run': 'Esegui',
    'common.unavailable': '---',
    'common.values': 'Valori',
    'duration.aDay': 'un giorno',
    'duration.aFewSeconds': 'pochi secondi',
    'duration.aMinute': 'un minuto',
    'duration.aMonth': 'un mese',
    'duration.aSecond': 'un secondo',
    'duration.aYear': 'anno',
    'duration.anHour': "un'ora",
    'duration.days': '{{count}} giorni',
    'duration.hours': '{{count}} ore',
    'duration.minutes': '{{count}} minuti',
    'duration.months': '{{count}} mesi',
    'duration.seconds': '{{count}} secondi',
    'duration.years': '{{count}} anni',
    'formDecorator.error':
      'Il decoratore del modulo deve fornire dati di contesto.',
    'messages.additionalDetailsAboutThisErrorAreNotAvailable':
      'Non sono disponibili ulteriori dettagli su questo errore',
    'messages.missingJsonSchema.message':
      "Questo flusso di lavoro non prevede uno schema JSON definito per la convalida dell'input. È comunque possibile eseguire il flusso di lavoro, ma la convalida dell'input sarà limitata.",
    'messages.missingJsonSchema.title':
      'Schema JSON mancante per il modulo di input',
    'messages.noDataAvailable': 'Nessun dato disponibile',
    'messages.noInputSchemaWorkflow':
      'Per questo flusso di lavoro non è definito alcuno schema di input.',
    'messages.noVariablesFound':
      'Nessuna variabile trovata per questa esecuzione.',
    'messages.workflowInstanceNoInputs':
      "L'istanza del flusso di lavoro non ha input",
    'page.tabs.allRuns': 'Tutte le esecuzioni',
    'page.tabs.workflowDetails': 'Dettagli flusso di lavoro',
    'page.tabs.workflowRuns': 'Esecuzioni flusso di lavoro',
    'page.tabs.workflows': 'Flussi di lavoro',
    'page.title': 'Orchestratore di flussi di lavoro',
    'permissions.accessDenied': 'Accesso negato',
    'permissions.accessDeniedDescription':
      "Non si dispone dell'autorizzazione per visualizzare l'esecuzione di questo flusso di lavoro.",
    'permissions.contactAdmin':
      'Contatta il tuo amministratore per richiedere le autorizzazioni necessarie.',
    'permissions.missingOwnership':
      "L'esecuzione di questo flusso di lavoro non ha registrate le informazioni di proprietà.",
    'permissions.notYourRun':
      "L'esecuzione di questo flusso di lavoro è stata avviata da un altro utente.",
    'permissions.requiredPermission': 'Autorizzazione obbligatoria',
    'reviewStep.hiddenFieldsNote':
      'Alcuni parametri sono nascosti in questa pagina.',
    'reviewStep.showHiddenParameters': 'Mostra i parametri nascosti',
    'run.abort.button': 'Interrompi',
    'run.abort.completed.message':
      "Non è possibile interrompere l'esecuzione poiché è già stata completata.",
    'run.abort.completed.title': 'Esecuzione completata',
    'run.abort.title': "Interrompere l'esecuzione del flusso di lavoro?",
    'run.abort.warning':
      "L'interruzione fermerà immediatamente tutti gli step in corso e in sospeso. Eventuale lavoro in corso andrà perso.",
    'run.inputs': 'Input',
    'run.logs.noLogsAvailable':
      "Nessun log disponibile per l'esecuzione di questo flusso di lavoro.",
    'run.logs.title': 'Esegui log',
    'run.logs.viewLogs': 'Visualizza log',
    'run.messages.eventTriggered':
      "È stato inviato un evento per attivare questo flusso di lavoro. Apparirà all'avvio dell'esecuzione.",
    'run.pageTitle': 'Esecuzione {{processName}}',
    'run.results': 'Risultati',
    'run.retrigger': 'Riavvia',
    'run.status.aborted': "L'esecuzione è stata interrotta",
    'run.status.completed': 'Esecuzione completata',
    'run.status.completedAt': 'Esecuzione completata {{time}}',
    'run.status.completedWithMessage':
      'Esecuzione completata {{time}} con messaggio',
    'run.status.failed': "L'esecuzione non è riuscita {{time}}",
    'run.status.failedAt': "L'esecuzione non è riuscita {{time}}",
    'run.status.noAdditionalInfo':
      'Il flusso di lavoro non forniva ulteriori informazioni sullo stato.',
    'run.status.resultsWillBeDisplayedHereOnceTheRunIsComplete':
      "I risultati verranno visualizzati qui al termine dell'esecuzione.",
    'run.status.running':
      'Il flusso di lavoro è in esecuzione. Iniziata {{time}}',
    'run.status.runningWaitingAtNode':
      'Il flusso di lavoro è in esecuzione - in attesa al nodo {{node}} da {{formattedTime}}',
    'run.status.workflowIsRunning':
      'Il flusso di lavoro è in esecuzione. Iniziata {{time}}',
    'run.suggestedNextWorkflow': 'Flusso di lavoro successivo suggerito',
    'run.suggestedNextWorkflows': 'Flussi di lavoro successivi suggeriti',
    'run.title': 'Esegui flusso di lavoro',
    'run.variables': 'Variabili di esecuzione',
    'run.viewVariables': 'Visualizza variabili',
    'stepperObjectField.error':
      'Il campo oggetto Stepper non è supportato per gli schemi che non contengono proprietà',
    'table.actions.run': 'Esegui',
    'table.actions.runAsEvent': 'Esegui come evento',
    'table.actions.viewInputSchema': 'Visualizza schema di input',
    'table.actions.viewRuns': 'Visualizza esecuzioni',
    'table.filters.started': 'Iniziato',
    'table.filters.startedOptions.last7days': 'Ultimi 7 giorni',
    'table.filters.startedOptions.thisMonth': 'Questo mese',
    'table.filters.startedOptions.today': 'Oggi',
    'table.filters.startedOptions.yesterday': 'Ieri',
    'table.filters.status': 'Stato',
    'table.headers.description': 'Descrizione',
    'table.headers.duration': 'Durata',
    'table.headers.lastRun': 'Ultima esecuzione',
    'table.headers.lastRunStatus': "Stato dell'ultima esecuzione",
    'table.headers.name': 'Nome',
    'table.headers.runStatus': 'Stato di esecuzione',
    'table.headers.started': 'Iniziato',
    'table.headers.status': 'Stato',
    'table.headers.version': 'Versione',
    'table.headers.workflowName': 'Nome del flusso di lavoro',
    'table.headers.workflowStatus': 'Stato del flusso di lavoro',
    'table.status.aborted': 'Interrotto',
    'table.status.active': 'Attivo',
    'table.status.completed': 'Completato',
    'table.status.failed': 'Non riuscito',
    'table.status.pending': 'In sospeso',
    'table.status.running': 'In esecuzione',
    'table.title.allRuns': 'Tutte le esecuzioni ({{count}})',
    'table.title.allWorkflowRuns': 'Esecuzioni flusso di lavoro ({{count}})',
    'table.title.workflows': 'Flussi di lavoro',
    'tooltips.aborted': 'Interrotto',
    'tooltips.active': 'Attivo',
    'tooltips.completed': 'Completato',
    'tooltips.pending': 'In sospeso',
    'tooltips.suspended': 'Sospeso',
    'tooltips.userNotAuthorizedAbort':
      'utente non autorizzato a interrompere il flusso di lavoro',
    'tooltips.userNotAuthorizedExecute':
      'utente non autorizzato a eseguire il flusso di lavoro',
    'tooltips.workflowDown':
      'Il flusso di lavoro è attualmente inattivo o in stato di errore',
    'workflow.buttons.fromFailurePoint': 'Dal punto di fallimento',
    'workflow.buttons.run': 'Esegui',
    'workflow.buttons.runAgain': 'Esegui di nuovo',
    'workflow.buttons.runAsEvent': 'Esegui come evento',
    'workflow.buttons.runFailedAgain': 'Esecuzione nuovamente non riuscita',
    'workflow.buttons.runWorkflow': 'Esegui flusso di lavoro',
    'workflow.buttons.running': 'In esecuzione...',
    'workflow.definition': 'Definizione del flusso di lavoro',
    'workflow.details': 'Dettagli',
    'workflow.errors.abortFailed':
      "Interruzione non riuscita: l'esecuzione è già stata completata.",
    'workflow.errors.abortFailedWithReason':
      'Interruzione non riuscita: {{reason}}',
    'workflow.errors.failedToLoadDetails':
      "Impossibile caricare i dettagli per l'ID del flusso di lavoro: {{id}}",
    'workflow.errors.retriggerFailed': 'Riavvio non riuscito: {{reason}}',
    'workflow.fields.description': 'Descrizione',
    'workflow.fields.duration': 'Durata',
    'workflow.fields.runStatus': 'Stato di esecuzione',
    'workflow.fields.started': 'Iniziato',
    'workflow.fields.version': 'Versione',
    'workflow.fields.workflow': 'Flusso di lavoro',
    'workflow.fields.workflowId': 'ID esecuzione',
    'workflow.fields.workflowIdCopied': 'ID esecuzione copiato negli appunti',
    'workflow.fields.workflowStatus': 'Stato del flusso di lavoro',
    'workflow.messages.areYouSureYouWantToRunThisWorkflow':
      'Sei sicuro di voler eseguire questo flusso di lavoro?',
    'workflow.messages.userNotAuthorizedExecute':
      'Utente non autorizzato a eseguire il flusso di lavoro.',
    'workflow.messages.workflowDown':
      "Il flusso di lavoro è attualmente inattivo o in stato di errore. L'esecuzione in questo momento potrebbe non riuscire o produrre risultati imprevisti.",
    'workflow.progress': 'Avanzamento del flusso di lavoro',
    'workflow.status.available': 'Disponibile',
    'workflow.status.unavailable': 'Non disponibile',
  },
});

export default orchestratorTranslationIt;
