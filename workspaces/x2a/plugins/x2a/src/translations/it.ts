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
 * Italian translation for plugin.x2a.
 * @public
 */
const x2aPluginTranslationIt = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'sidebar.x2a.title': 'Conversion Hub',
    'page.title': 'Conversion Hub',
    'page.subtitle':
      'Avvia e monitora la conversione asincrona delle automazioni esistenti in Ansible Playbook production-ready.',
    'projectPage.title': 'Progetto',
    'projectPage.deleteProject': 'Elimina',
    'projectPage.actionsTooltip':
      'Fai clic per aprire il menu delle azioni del progetto',
    'projectPage.deleteError': 'Impossibile eliminare il progetto',
    'projectPage.deleteConfirm.title': 'Eliminare il progetto "{{name}}"?',
    'projectModulesCard.title': 'Moduli ({{count}})',
    'projectModulesCard.published': 'pubblicato',
    'initPhaseCard.title': 'Fase di discovery',
    'modulePage.title': 'Dettagli modulo',
    'modulePage.artifacts.title': 'Artefatti da rivedere',
    'modulePage.artifacts.migration_plan':
      'Piano generale di migrazione del progetto',
    'modulePage.artifacts.module_migration_plan':
      "Piano del modulo basato sull'analisi",
    'modulePage.artifacts.migrated_sources': 'Sorgenti migrate',
    'modulePage.artifacts.ansible_project': 'Progetto AAP',
    'modulePage.artifacts.description':
      'Questi artefatti sono generati dal processo di conversione e sono disponibili per la revisione.',
    'modulePage.phases.title': 'Fasi migrazione',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.duration': 'Durata',
    'modulePage.phases.k8sJobName': 'Nome processo Kubernetes',
    'modulePage.phases.startedAt': 'Iniziato il',
    'modulePage.phases.status': 'Stato',
    'modulePage.phases.errorDetails': "Dettagli dell'errore",
    'modulePage.phases.statuses.notStarted': 'Non avviato',
    'modulePage.phases.statuses.pending': 'In sospeso',
    'modulePage.phases.statuses.running': 'In esecuzione',
    'modulePage.phases.statuses.success': 'Successo',
    'modulePage.phases.statuses.error': 'Errore',
    'modulePage.phases.statuses.cancelled': 'Annullato',
    'modulePage.phases.resyncMigrationPlanInstructions':
      "Risincronizza l'elenco dei moduli in modo che corrisponda al piano di migrazione.",
    'modulePage.phases.reanalyzeInstructions':
      "Il piano di migrazione dei moduli è già presente. Nel caso in cui il piano di migrazione complessivo del progetto sia stato aggiornato, riavviare l'analisi per riflettere le modifiche.",
    'modulePage.phases.analyzeInstructions':
      "Prima di eseguire l'analisi, occorre prima rivedere il piano di migrazione complessivo del progetto. Il suo contenuto guiderà l'analisi del modulo.",
    'modulePage.phases.migrateInstructions':
      'Prima di eseguire la migrazione, rivedere il piano di migrazione dei moduli. Il processo di migrazione convertirà il codice sorgente in Ansible in base al piano.',
    'modulePage.phases.remigrateInstructions':
      'Le sorgenti migrate sono già presenti. Riavvia la migrazione per ricreare il codice Ansible convertito.',
    'modulePage.phases.rerunMigrate': 'Ricrea le sorgenti migrate',
    'modulePage.phases.publishInstructions':
      'Prima della pubblicazione, rivedi le sorgenti migrate. Il processo di pubblicazione eseguirà il commit del codice convertito nel repository di destinazione.',
    'modulePage.phases.republishInstructions':
      'Il modulo è già stato pubblicato. Riavvia la pubblicazione per aggiornare il repository di destinazione.',
    'modulePage.phases.rerunPublish':
      'Ripubblica nel repository di destinazione',
    'modulePage.phases.cancel': 'Annulla',
    'modulePage.phases.runError': 'Impossibile eseguire la fase per il modulo',
    'modulePage.phases.cancelError':
      'Impossibile annullare la fase per il modulo',
    'modulePage.phases.commitId': 'ID ultimo commit',
    'modulePage.phases.viewLog': 'Visualizza log',
    'modulePage.phases.hideLog': 'Nascondi log',
    'modulePage.phases.noLogsAvailable': 'Nessun log ancora disponibile...',
    'modulePage.phases.logWaitingForStream':
      "In attesa dell'output del log dal cluster...",
    'modulePage.phases.telemetry.title': 'Telemetria',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'Nessun dato di telemetria disponibile',
    'modulePage.phases.telemetry.agentName': 'Nome agente',
    'modulePage.phases.telemetry.duration': 'Durata',
    'modulePage.phases.telemetry.inputTokens': 'Token di input',
    'modulePage.phases.telemetry.outputTokens': 'Token di output',
    'modulePage.phases.telemetry.toolCalls':
      'Numero di chiamate agli strumenti',
    'table.columns.name': 'Nome',
    'table.columns.status': 'Stato',
    'table.columns.statusSortDisabledTooltip':
      "L'ordinamento per stato non è disponibile quando il numero di progetti supera {{threshold}}",
    'table.columns.targetRepo': 'Repository di destinazione',
    'table.columns.createdAt': 'Creato il',
    'table.actions.deleteProject': 'Elimina progetto',
    'table.actions.retriggerInit':
      'Riavvia la fase di inizializzazione del progetto',
    'table.actions.expandAll': 'Espandi tutte le righe',
    'table.actions.collapseAll': 'Comprimi tutte le righe',
    'table.actions.expandRow': 'Espandi riga',
    'table.actions.collapseRow': 'Comprimi riga',
    'table.projectsCount': 'Progetti ({{count}})',
    'common.newProject': 'Nuovo progetto',
    'emptyPage.noConversionInitiatedYet':
      'Nessuna conversione è stata ancora avviata',
    'emptyPage.noConversionInitiatedYetDescription':
      'Avvia e monitora la conversione delle automazioni esistenti in Ansible production-ready',
    'emptyPage.startFirstConversion': 'Avvia la prima conversione',
    'emptyPage.notAllowedTitle': 'Accesso negato',
    'emptyPage.notAllowedDescription':
      'Non sei autorizzato ad accedere ai progetti di conversione.',
    'bulkRun.projectAction': 'Esegui tutti i moduli',
    'bulkRun.globalAction': 'Esegui tutto',
    'bulkRun.projectPageAction': 'Esegui tutto',
    'bulkRun.projectConfirm.title':
      'Eseguire tutti i moduli del progetto "{{name}}"?',
    'bulkRun.cancel': 'Annulla',
    'bulkRun.errorProject':
      'Impossibile eseguire i moduli nel progetto "{{name}}"',
    'artifact.types.migration_plan': 'Piano di migrazione dei progetti',
    'artifact.types.module_migration_plan': 'Piano di migrazione dei moduli',
    'artifact.types.migrated_sources': 'Sorgenti migrate',
    'artifact.types.project_metadata': 'Metadati progetto',
    'artifact.types.ansible_project': 'Progetto AAP',
    'time.duration.daysAndHours': '{{days}}g {{hours}}h',
    'time.duration.daysOnly': '{{days}}g',
    'time.duration.hoursAndMinutes': '{{hours}}h {{minutes}}m',
    'time.duration.hoursOnly': '{{hours}}h',
    'time.duration.minutesAndSeconds': '{{minutes}}m {{seconds}}s',
    'time.duration.secondsOnly': '{{seconds}}s',
    'time.ago.daysAndHours': '{{days}}g {{hours}}h fa',
    'time.ago.daysOnly': '{{days}}g fa',
    'time.ago.hoursAndMinutes': '{{hours}}h {{minutes}}m fa',
    'time.ago.hoursOnly': '{{hours}}h fa',
    'time.ago.minutes': '{{minutes}}m fa',
    'time.ago.lessThanMinute': '&lt;1m fa',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': 'In esecuzione per {{durata}}',
    empty: '-',
  },
});

export default x2aPluginTranslationIt;
