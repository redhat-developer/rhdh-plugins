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

const orchestratorTranslationIt = createTranslationMessages({
  ref: orchestratorTranslationRef,
  messages: {
    'page.title': 'Orchestratore di Workflow',
    'page.tabs.workflows': 'Workflow',
    'page.tabs.allRuns': 'Tutte le esecuzioni',
    'page.tabs.workflowDetails': 'Dettagli del workflow',
    'page.tabs.workflowRuns': 'Esecuzioni del workflow',
    'table.title.workflows': 'Workflow',
    'table.title.allRuns': 'Tutte le esecuzioni ({{count}})',
    'table.title.allWorkflowRuns': 'Esecuzioni del workflow ({{count}})',
    'table.headers.name': 'Nome',
    'table.headers.runStatus': 'Stato esecuzione',
    'table.headers.started': 'Avviato',
    'table.headers.status': 'Stato',
    'table.headers.lastRun': 'Ultima esecuzione',
    'table.headers.lastRunStatus': "Stato dell'ultima esecuzione",
    'table.headers.workflowStatus': 'Stato del workflow',
    'table.headers.duration': 'Durata',
    'table.headers.description': 'Descrizione',
    'table.headers.workflowName': 'Nome del workflow',
    'table.actions.run': 'Esegui',
    'table.actions.viewRuns': 'Visualizza esecuzioni',
    'table.actions.viewInputSchema': 'Visualizza schema di input',
    'table.status.running': 'In esecuzione',
    'table.status.failed': 'Fallito',
    'table.status.completed': 'Completato',
    'table.status.aborted': 'Interrotto',
    'table.status.pending': 'In attesa',
    'table.status.active': 'Attivo',
    'table.filters.status': 'Stato',
    'table.filters.started': 'Avviato',
    'table.filters.startedOptions.today': 'Oggi',
    'table.filters.startedOptions.yesterday': 'Ieri',
    'table.filters.startedOptions.last7days': 'Ultimi 7 giorni',
    'table.filters.startedOptions.thisMonth': 'Questo mese',
    'workflow.details': 'Dettagli',
    'workflow.definition': 'Definizione del workflow',
    'workflow.progress': 'Progresso del workflow',
    'workflow.status.available': 'Disponibile',
    'workflow.status.unavailable': 'Non disponibile',
    'workflow.fields.workflow': 'Workflow',
    'workflow.fields.workflowStatus': 'Stato del workflow',
    'workflow.fields.runStatus': 'Stato esecuzione',
    'workflow.fields.duration': 'Durata',
    'workflow.fields.description': 'Descrizione',
    'workflow.fields.started': 'Avviato',
    'workflow.errors.retriggerFailed': 'Riattivazione fallita: {{reason}}',
    'workflow.errors.abortFailed':
      "Interruzione fallita: L'esecuzione è già stata completata.",
    'workflow.errors.abortFailedWithReason': 'Interruzione fallita: {{reason}}',
    'workflow.errors.failedToLoadDetails':
      "Impossibile caricare i dettagli per l'ID del workflow: {{id}}",
    'workflow.messages.areYouSureYouWantToRunThisWorkflow':
      'Sei sicuro di voler eseguire questo workflow?',
    'workflow.buttons.run': 'Esegui',
    'workflow.buttons.runWorkflow': 'Esegui workflow',
    'workflow.buttons.runAgain': 'Esegui di nuovo',
    'workflow.buttons.running': 'In esecuzione...',
    'workflow.buttons.fromFailurePoint': 'Dal punto di fallimento',
    'workflow.buttons.runFailedAgain': 'Riattivazione fallita',
    'run.title': 'Esegui workflow',
    'run.variables': 'Variabili di esecuzione',
    'run.inputs': 'Input',
    'run.results': 'Risultati',
    'run.abort.title': "Interrompere l'esecuzione del workflow?",
    'run.abort.button': 'Interrompi',
    'run.abort.warning':
      "L'interruzione fermerà immediatamente tutti i passaggi in corso e in attesa. Qualsiasi lavoro in corso andrà perso.",
    'run.abort.completed.title': 'Esecuzione completata',
    'run.abort.completed.message':
      "Non è possibile interrompere l'esecuzione poiché è già stata completata.",
    'run.status.completed': 'Esecuzione completata',
    'run.status.failed': "L'esecuzione è fallita {{time}}",
    'run.status.aborted': "L'esecuzione è stata interrotta",
    'run.status.completedWithMessage':
      'Esecuzione completata {{time}} con messaggio',
    'run.status.completedAt': 'Esecuzione completata {{time}}',
    'run.status.running': 'Il workflow è in esecuzione. Avviato {{time}}',
    'run.status.runningWaitingAtNode':
      'Il workflow è in esecuzione - in attesa al nodo {{node}} dal {{formattedTime}}',
    'run.status.workflowIsRunning':
      'Il workflow è in esecuzione. Avviato {{time}}',
    'run.status.noAdditionalInfo':
      'Il workflow non ha fornito informazioni aggiuntive sullo stato.',
    'run.status.resultsWillBeDisplayedHereOnceTheRunIsComplete':
      "I risultati verranno visualizzati qui una volta completata l'esecuzione.",
    'run.retrigger': 'Riattiva',
    'run.viewVariables': 'Visualizza variabili',
    'run.suggestedNextWorkflow': 'Workflow suggerito successivo',
    'run.suggestedNextWorkflows': 'Workflow suggeriti successivi',
    'tooltips.completed': 'Completato',
    'tooltips.active': 'Attivo',
    'tooltips.aborted': 'Interrotto',
    'tooltips.suspended': 'Sospeso',
    'tooltips.pending': 'In attesa',
    'tooltips.workflowDown':
      'Il workflow è attualmente non disponibile o in stato di errore',
    'tooltips.userNotAuthorizedAbort':
      'utente non autorizzato a interrompere il workflow',
    'tooltips.userNotAuthorizedExecute':
      'utente non autorizzato a eseguire il workflow',
    'messages.noDataAvailable': 'Nessun dato disponibile',
    'messages.noVariablesFound':
      'Nessuna variabile trovata per questa esecuzione.',
    'messages.noInputSchemaWorkflow':
      'Nessuno schema di input è definito per questo workflow.',
    'messages.workflowInstanceNoInputs': "L'istanza del workflow non ha input",
    'messages.missingJsonSchema.title':
      'Schema JSON mancante per il modulo di input',
    'messages.missingJsonSchema.message':
      'Questo workflow non ha uno schema JSON definito per la validazione degli input. Puoi comunque eseguire il workflow, ma la validazione degli input sarà limitata.',
    'messages.additionalDetailsAboutThisErrorAreNotAvailable':
      'Non sono disponibili dettagli aggiuntivi su questo errore',
    'common.close': 'Chiudi',
    'common.cancel': 'Annulla',
    'common.execute': 'Esegui',
    'common.details': 'Dettagli',
    'common.links': 'Collegamenti',
    'common.values': 'Valori',
    'common.unavailable': '---',
    'common.back': 'Indietro',
    'common.run': 'Esegui',
    'common.next': 'Avanti',
    'stepperObjectField.error':
      'Il campo di oggetto dello stepper non è compatibile con gli schemi che non contengono proprietà',
    'formDecorator.error':
      'Il decoratore di form deve fornire dati di contesto.',
    'aria.close': 'chiudi',
  },
});

export default orchestratorTranslationIt;
