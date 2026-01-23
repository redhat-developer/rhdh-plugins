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
    'page.title': 'Orchestratore del flusso di lavoro',
    'page.tabs.workflows': 'Flussi di lavoro',
    'page.tabs.allRuns': 'Tutte le esecuzioni',
    'page.tabs.workflowDetails': 'Dettagli del flusso di lavoro',
    'page.tabs.workflowRuns': 'Esecuzioni del flusso di lavoro',
    'table.title.workflows': 'Flussi di lavoro',
    'table.title.allRuns': 'Tutte le esecuzioni ({{count}})',
    'table.title.allWorkflowRuns':
      'Esecuzioni del flusso di lavoro ({{count}})',
    'table.headers.name': 'Nome',
    'table.headers.runStatus': "Stato dell'esecuzione",
    'table.headers.started': 'Iniziata',
    'table.headers.status': 'Stato',
    'table.headers.workflowStatus': 'Stato del flusso di lavoro',
    'table.headers.duration': 'Durata',
    'table.headers.description': 'Descrizione',
    'table.headers.lastRun': 'Ultima esecuzione',
    'table.headers.lastRunStatus': "Stato dell'ultima esecuzione",
    'table.headers.workflowName': 'Nome flusso di lavoro',
    'table.actions.run': 'Esecuzione',
    'table.actions.viewRuns': 'Visualizza esecuzioni',
    'table.actions.viewInputSchema': 'Visualizza schema di input',
    'table.status.running': 'In esecuzione',
    'table.status.failed': 'Non riuscito',
    'table.status.completed': 'Completato',
    'table.status.aborted': 'Interrotto',
    'table.status.pending': 'In pausa',
    'table.status.active': 'Attivo',
    'table.filters.status': 'Stato',
    'table.filters.started': 'Iniziata',
    'table.filters.startedOptions.today': 'Oggi',
    'table.filters.startedOptions.yesterday': 'Ieri',
    'table.filters.startedOptions.last7days': 'Ultimi 7 giorni',
    'table.filters.startedOptions.thisMonth': 'Questo mese',
    'workflow.details': 'Dettagli',
    'workflow.definition': 'Definizione flusso di lavoro',
    'workflow.progress': 'Avanzamento flusso di lavoro',
    'workflow.status.available': 'Disponibile',
    'workflow.status.unavailable': 'Non disponibile',
    'workflow.fields.workflow': 'Flusso di lavoro',
    'workflow.fields.workflowStatus': 'Stato del flusso di lavoro',
    'workflow.fields.runStatus': "Stato dell'esecuzione",
    'workflow.fields.duration': 'Durata',
    'workflow.fields.description': 'Descrizione',
    'workflow.fields.started': 'Iniziata',
    'workflow.fields.workflowId': 'ID esecuzione',
    'workflow.fields.workflowIdCopied': 'ID esecuzione copiato negli appunti',
    'workflow.errors.retriggerFailed': 'Riattivazione non riuscita: {{reason}}',
    'workflow.errors.abortFailed':
      "Interruzione non riuscita: l'esecuzione è già stata completata.",
    'workflow.errors.abortFailedWithReason':
      'Interruzione non riuscita: {{reason}}',
    'workflow.errors.failedToLoadDetails':
      "Impossibile caricare i dettagli dell'ID del flusso di lavoro: {{id}}",
    'workflow.messages.areYouSureYouWantToRunThisWorkflow':
      'Eseguire questo flusso di lavoro?',
    'workflow.messages.userNotAuthorizedExecute':
      'Utente non autorizzato a eseguire il flusso di lavoro.',
    'workflow.messages.workflowDown':
      "Al momento lo stato del flusso di lavoro è inattivo o in errore. L'esecuzione potrebbe non riuscire o produrre risultati imprevisti.",
    'workflow.buttons.run': 'Esecuzione',
    'workflow.buttons.runWorkflow': 'Esegui flusso di lavoro',
    'workflow.buttons.runAgain': 'Esegui di nuovo',
    'workflow.buttons.running': 'Esecuzione in corso...',
    'workflow.buttons.fromFailurePoint': 'Dal punto di errore',
    'workflow.buttons.runFailedAgain': 'Esecuzione non riuscita di nuovo',
    'run.title': 'Esegui flusso di lavoro',
    'run.pageTitle': 'Esecuzione di {{processName}}',
    'run.variables': 'Esegui variabili',
    'run.inputs': 'Input',
    'run.results': 'Risultati',
    'run.logs.viewLogs': 'Visualizza log',
    'run.logs.title': 'Log di esecuzione',
    'run.logs.noLogsAvailable':
      'Nessun log disponibile per questa esecuzione del workflow.',
    'run.abort.title': "Interrompere l'esecuzione del flusso di lavoro?",
    'run.abort.button': 'Interrompi',
    'run.abort.warning':
      "L'interruzione arresta immediatamente tutti i passaggi in corso e in sospeso. Tutti i lavori in corso andranno persi.",
    'run.abort.completed.title': 'Esecuzione completata',
    'run.abort.completed.message':
      "Non è possibile interrompere l'esecuzione poiché è già stata completata.",
    'run.status.completed': 'Esecuzione completata',
    'run.status.failed': 'Esecuzione non riuscita {{time}}',
    'run.status.failedAt': 'Esecuzione non riuscita {{time}}',
    'run.status.aborted': 'Esecuzione interrotta',
    'run.status.completedWithMessage':
      'Esecuzione completata {{time}} con messaggio',
    'run.status.completedAt': 'Esecuzione completata {{time}}',
    'run.status.running':
      'Flusso di lavoro in esecuzione. Avviato alle {{time}}',
    'run.status.runningWaitingAtNode':
      'Flusso di lavoro in esecuzione: in attesa sul nodo {{node}} dalle {{formattedTime}}',
    'run.status.workflowIsRunning':
      'Flusso di lavoro in esecuzione. Avviato alle {{time}}',
    'run.status.noAdditionalInfo':
      'Il flusso di lavoro non ha fornito ulteriori informazioni sullo stato.',
    'run.status.resultsWillBeDisplayedHereOnceTheRunIsComplete':
      "I risultati verranno visualizzati qui una volta completata l'esecuzione.",
    'run.retrigger': 'Riattiva',
    'run.viewVariables': 'Visualizza variabili',
    'run.suggestedNextWorkflow': 'Flusso di lavoro successivo suggerito',
    'run.suggestedNextWorkflows': 'Flussi di lavoro successivi suggeriti',
    'tooltips.completed': 'Completato',
    'tooltips.active': 'Attivo',
    'tooltips.aborted': 'Interrotto',
    'tooltips.suspended': 'Sospeso',
    'tooltips.pending': 'In pausa',
    'tooltips.workflowDown':
      'Al momento il flusso di lavoro è inattivo o in errore',
    'tooltips.userNotAuthorizedAbort':
      'utente non autorizzato a interrompere il flusso di lavoro',
    'tooltips.userNotAuthorizedExecute':
      'utente non autorizzato a eseguire il flusso di lavoro',
    'messages.noDataAvailable': 'Nessun dato disponibile',
    'messages.noVariablesFound':
      'Nessuna variabile trovata per questa esecuzione.',
    'messages.noInputSchemaWorkflow':
      'Nessuno schema di input definito per questo flusso di lavoro.',
    'messages.workflowInstanceNoInputs':
      "L'istanza del flusso di lavoro non ha input",
    'messages.missingJsonSchema.title':
      'Schema JSON mancante per il modulo di input',
    'messages.missingJsonSchema.message':
      "Nessuno schema JSON definito per la convalida dell'input di questo flusso di lavoro. È comunque possibile eseguire il flusso di lavoro, ma la convalida degli input sarà limitata.",
    'messages.additionalDetailsAboutThisErrorAreNotAvailable':
      'Non sono disponibili ulteriori dettagli su questo errore',
    'reviewStep.hiddenFieldsNote':
      'Alcuni parametri sono nascosti in questa pagina.',
    'reviewStep.showHiddenParameters': 'Mostra parametri nascosti',
    'common.close': 'Chiudi',
    'common.cancel': 'Cancella',
    'common.execute': 'Esegui',
    'common.details': 'Dettagli',
    'common.links': 'Collegamenti',
    'common.values': 'Valori',
    'common.back': 'Indietro',
    'common.run': 'Esecuzione',
    'common.next': 'Successivo',
    'common.review': 'Revisione',
    'common.unavailable': '---',
    'common.goBack': 'Torna indietro',
    'permissions.accessDenied': 'Accesso negato',
    'permissions.accessDeniedDescription':
      'Non hai il permesso di visualizzare questa esecuzione del workflow.',
    'permissions.requiredPermission': 'Permesso richiesto',
    'permissions.contactAdmin':
      'Contatta il tuo amministratore per richiedere i permessi necessari.',
    'permissions.missingOwnership':
      'Questa esecuzione del workflow non ha informazioni di proprietà registrate.',
    'permissions.notYourRun':
      'Questa esecuzione del workflow è stata avviata da un altro utente.',
    'duration.aFewSeconds': 'alcuni secondi',
    'duration.aSecond': 'un secondo',
    'duration.seconds': '{{count}} secondi',
    'duration.aMinute': 'un minuto',
    'duration.minutes': '{{count}} minuti',
    'duration.anHour': "un'ora",
    'duration.hours': '{{count}} ore',
    'duration.aDay': 'un giorno',
    'duration.days': '{{count}} giorni',
    'duration.aMonth': 'un mese',
    'duration.months': '{{count}} mesi',
    'duration.aYear': 'un anno',
    'duration.years': '{{count}} anni',
    'stepperObjectField.error':
      "Il campo dell'oggetto Stepper non è supportato per lo schema che non contiene proprietà",
    'formDecorator.error':
      'Il decorator del modulo deve fornire dati di contesto.',
    'aria.close': 'chiudi',
  },
});

export default orchestratorTranslationIt;
