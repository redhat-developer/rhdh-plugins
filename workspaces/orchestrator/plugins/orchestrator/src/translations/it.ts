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
    'page.title': 'Orchestratore di flussi di lavoro',
    'page.tabs.workflows': 'Flussi di lavoro',
    'page.tabs.allRuns': 'Tutte le esecuzioni',
    'page.tabs.workflowDetails': 'Dettagli flusso di lavoro',
    'page.tabs.workflowRuns': 'Esecuzioni flusso di lavoro',
    'table.title.workflows': 'Flussi di lavoro',
    'table.title.allRuns': 'Tutte le esecuzioni ({{count}})',
    'table.actions.run': 'Esegui',
    'table.actions.runAsEvent': 'Esegui come evento',
    'table.actions.viewRuns': 'Visualizza esecuzioni',
    'table.actions.viewInputSchema': 'Visualizza schema di input',
    'table.status.running': 'In esecuzione',
    'table.status.failed': 'Non riuscito',
    'table.status.completed': 'Completato',
    'table.status.aborted': 'Interrotto',
    'table.status.pending': 'In sospeso',
    'table.status.active': 'Attivo',
    'table.filters.status': 'Stato',
    'table.filters.started': 'Iniziato',
    'table.filters.startedOptions.today': 'Oggi',
    'table.filters.startedOptions.yesterday': 'Ieri',
    'table.filters.startedOptions.last7days': 'Ultimi 7 giorni',
    'table.filters.startedOptions.thisMonth': 'Questo mese',
    'workflow.details': 'Dettagli',
    'workflow.definition': 'Definizione del flusso di lavoro',
    'workflow.progress': 'Avanzamento del flusso di lavoro',
    'workflow.status.available': 'Disponibile',
    'workflow.status.unavailable': 'Non disponibile',
    'workflow.fields.workflow': 'Flusso di lavoro',
    'workflow.fields.workflowStatus': 'Stato del flusso di lavoro',
    'workflow.fields.runStatus': 'Stato di esecuzione',
    'workflow.fields.duration': 'Durata',
    'workflow.fields.description': 'Descrizione',
    'workflow.fields.started': 'Iniziato',
    'workflow.fields.workflowId': 'ID esecuzione',
    'workflow.fields.workflowIdCopied': 'ID esecuzione copiato negli appunti',
    'workflow.fields.version': 'Versione',
    'workflow.errors.retriggerFailed': 'Riavvio non riuscito: {{reason}}',
    'workflow.errors.abortFailedWithReason':
      'Interruzione non riuscita: {{reason}}',
    'run.title': 'Esegui flusso di lavoro',
    'run.pageTitle': 'Esecuzione {{processName}}',
    'run.variables': 'Variabili di esecuzione',
    'run.inputs': 'Input',
    'run.results': 'Risultati',
    'run.logs.viewLogs': 'Visualizza log',
    'run.logs.title': 'Esegui log',
    'run.logs.noLogsAvailable':
      "Nessun log disponibile per l'esecuzione di questo flusso di lavoro.",
    'run.abort.title': "Interrompere l'esecuzione del flusso di lavoro?",
    'run.abort.button': 'Interrompi',
    'run.abort.warning':
      "L'interruzione fermerà immediatamente tutti gli step in corso e in sospeso. Eventuale lavoro in corso andrà perso.",
    'run.abort.completed.title': 'Esecuzione completata',
    'run.abort.completed.message':
      "Non è possibile interrompere l'esecuzione poiché è già stata completata.",
    'run.status.completed': 'Esecuzione completata',
    'run.status.failed': "L'esecuzione non è riuscita {{time}}",
    'run.status.completedWithMessage':
      'Esecuzione completata {{time}} con messaggio',
    'run.status.failedAt': "L'esecuzione non è riuscita {{time}}",
    'run.viewVariables': 'Visualizza variabili',
    'run.suggestedNextWorkflow': 'Flusso di lavoro successivo suggerito',
    'run.suggestedNextWorkflows': 'Flussi di lavoro successivi suggeriti',
    'tooltips.completed': 'Completato',
    'tooltips.active': 'Attivo',
    'tooltips.aborted': 'Interrotto',
    'tooltips.suspended': 'Sospeso',
    'tooltips.pending': 'In sospeso',
    'tooltips.workflowDown':
      'Il flusso di lavoro è attualmente inattivo o in stato di errore',
    'tooltips.userNotAuthorizedAbort':
      'utente non autorizzato a interrompere il flusso di lavoro',
    'tooltips.userNotAuthorizedExecute':
      'utente non autorizzato a eseguire il flusso di lavoro',
    'messages.noDataAvailable': 'Nessun dato disponibile',
    'messages.noVariablesFound':
      'Nessuna variabile trovata per questa esecuzione.',
    'messages.noInputSchemaWorkflow':
      'Per questo flusso di lavoro non è definito alcuno schema di input.',
    'messages.workflowInstanceNoInputs':
      "L'istanza del flusso di lavoro non ha input",
    'messages.missingJsonSchema.title':
      'Schema JSON mancante per il modulo di input',
    'messages.missingJsonSchema.message':
      "Questo flusso di lavoro non prevede uno schema JSON definito per la convalida dell'input. È comunque possibile eseguire il flusso di lavoro, ma la convalida dell'input sarà limitata.",
    'reviewStep.hiddenFieldsNote':
      'Alcuni parametri sono nascosti in questa pagina.',
    'reviewStep.showHiddenParameters': 'Mostra i parametri nascosti',
    'common.close': 'Chiudi',
    'common.cancel': 'Annulla',
    'common.execute': 'Esegui',
    'common.details': 'Dettagli',
    'common.links': 'Link',
    'common.values': 'Valori',
    'common.back': 'Indietro',
    'common.run': 'Esegui',
    'common.next': 'Successivo',
    'common.review': 'Revisione',
    'common.unavailable': '---',
    'common.goBack': 'Torna indietro',
    'permissions.accessDenied': 'Accesso negato',
    'permissions.accessDeniedDescription':
      "Non si dispone dell'autorizzazione per visualizzare l'esecuzione di questo flusso di lavoro.",
    'permissions.requiredPermission': 'Autorizzazione obbligatoria',
    'permissions.contactAdmin':
      'Contatta il tuo amministratore per richiedere le autorizzazioni necessarie.',
    'permissions.missingOwnership':
      "L'esecuzione di questo flusso di lavoro non ha registrate le informazioni di proprietà.",
    'permissions.notYourRun':
      "L'esecuzione di questo flusso di lavoro è stata avviata da un altro utente.",
    'duration.aFewSeconds': 'pochi secondi',
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
    'duration.aYear': 'anno',
    'duration.years': '{{count}} anni',
    'alerts.duplicateWorkflowIds.message':
      'Rilevati più flussi di lavoro con lo stesso ID. Assicurati che vengano utilizzati ID univoci per le diverse versioni.',
    'alerts.duplicateWorkflowIds.learnMore': 'Scopri di più',
    'stepperObjectField.error':
      'Il campo oggetto Stepper non è supportato per gli schemi che non contengono proprietà',
    'formDecorator.error':
      'Il decoratore del modulo deve fornire dati di contesto.',
    'aria.close': 'chiudi',
  },
});

export default orchestratorTranslationIt;
