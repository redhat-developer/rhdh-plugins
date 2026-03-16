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
 * Italian translation for the x2a plugin.
 * @public
 */
const x2aPluginTranslationIt = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'sidebar.x2a.title': 'Hub di conversione',
    'page.title': 'Hub di conversione',
    'page.subtitle':
      'Avvia e monitora le conversioni asincrone di file Chef in playbook Ansible pronti per la produzione.',
    'table.columns.name': 'Nome',
    'table.columns.status': 'Stato',
    'table.columns.sourceRepo': 'Repository sorgente',
    'table.columns.targetRepo': 'Repository di destinazione',
    'table.columns.createdAt': 'Creato il',
    'table.actions.deleteProject': 'Elimina progetto',
    'table.actions.expandAll': 'Espandi tutte le righe',
    'table.actions.collapseAll': 'Comprimi tutte le righe',
    'table.actions.expandRow': 'Espandi riga',
    'table.actions.collapseRow': 'Comprimi riga',
    'table.projectsCount': 'Progetti ({{count}})',
    empty: '-',
    'initPhaseCard.title': 'Fase di scoperta',
    'projectDetailsCard.title': 'Dettagli del progetto',
    'projectDetailsCard.name': 'Nome',
    'projectDetailsCard.abbreviation': 'Abbreviazione',
    'projectDetailsCard.status': 'Stato',
    'projectDetailsCard.createdBy': 'Proprietario',
    'projectDetailsCard.description': 'Descrizione',
    'projectDetailsCard.sourceRepo': 'Repository sorgente',
    'projectDetailsCard.targetRepo': 'Repository di destinazione',
    'projectModulesCard.title': 'Moduli ({{count}})',
    'projectModulesCard.noModules': 'Nessun modulo trovato finora...',
    'projectModulesCard.toReview': 'rivedere',
    'projectModulesCard.published': 'pubblicato',
    'projectPage.title': 'Progetto',
    'projectPage.actionsTooltip':
      'Clicca per aprire il menu per le azioni del progetto',
    'projectPage.deleteError': "Errore nell'eliminazione del progetto",
    'projectPage.deleteProject': 'Elimina',
    'projectPage.deleteConfirm.title': 'Eliminare il progetto "{{name}}"?',
    'projectPage.deleteConfirm.message':
      'Questo progetto, tutti i suoi moduli e job saranno eliminati permanentemente. Questa azione non può essere annullata. Gli artefatti persistiti nel repository di destinazione saranno preservati.',
    'projectPage.deleteConfirm.cancel': 'Annulla',
    'projectPage.deleteConfirm.confirm': 'Elimina',
    'projectTable.deleteError': "Errore nell'eliminazione del progetto",
    'project.description': 'Descrizione',
    'project.id': 'ID',
    'project.abbreviation': 'Abbreviazione',
    'project.createdBy': 'Proprietario',
    'project.statuses.none': '-',
    'project.statuses.created': 'Creato',
    'project.statuses.initializing': 'In inizializzazione',
    'project.statuses.initialized': 'Inizializzato',
    'project.statuses.inProgress': 'In corso',
    'project.statuses.completed': 'Completato',
    'project.statuses.failed': 'Fallito',
    'project.noModules': 'Nessun modulo trovato finora...',
    'common.newProject': 'Nuovo progetto',
    'emptyPage.noConversionInitiatedYet': 'Nessuna conversione avviata ancora',
    'emptyPage.noConversionInitiatedYetDescription':
      'Avvia e monitora la conversione di file Chef in playbook Ansible pronti per la produzione',
    'emptyPage.startFirstConversion': 'Avvia prima conversione',
    'emptyPage.notAllowedTitle': 'Accesso negato',
    'emptyPage.notAllowedDescription':
      'Non sei autorizzato ad accedere ai progetti di conversione.',
    'module.phases.init': 'Init',
    'module.phases.none': '-',
    'module.phases.analyze': 'Analizzare',
    'module.phases.migrate': 'Migrare',
    'module.phases.publish': 'Pubblicare',
    'module.summary.total': 'Totale',
    'module.summary.finished': 'Completato',
    'module.summary.waiting': 'In attesa',
    'module.summary.pending': 'In attesa',
    'module.summary.running': 'In esecuzione',
    'module.summary.error': 'Errore',
    'module.summary.toReview_one': '{{count}} modulo con artefatti da rivedere',
    'module.summary.toReview_other':
      '{{count}} moduli con artefatti da rivedere',
    'module.actions.runNextPhase': 'Esegui fase successiva',
    'module.currentPhase': 'Fase corrente',
    'module.lastUpdate': 'Ultimo aggiornamento',
    'module.notStarted': 'Non avviato',
    'module.name': 'Nome',
    'module.status': 'Stato',
    'module.sourcePath': 'Percorso sorgente',
    'module.artifacts': 'Artefatti',
    'artifact.types.migration_plan': 'Piano di migrazione',
    'artifact.types.module_migration_plan': 'Piano del modulo',
    'module.statuses.none': '-',
    'module.statuses.pending': 'In attesa',
    'module.statuses.running': 'In esecuzione',
    'module.statuses.success': 'Successo',
    'module.statuses.error': 'Errore',
    'artifact.types.migrated_sources': 'Sorgenti migrate',
    'artifact.types.project_metadata': 'Metadati del progetto',
    'artifact.types.ansible_project': 'Progetto AAP',
    'modulePage.title': 'Dettagli del modulo',
    'modulePage.artifacts.title': 'Artefatti da rivedere',
    'modulePage.artifacts.migration_plan':
      'Piano di migrazione complessivo del progetto',
    'modulePage.artifacts.module_migration_plan':
      'Piano del modulo per analisi',
    'modulePage.artifacts.migrated_sources': 'Sorgenti migrate',
    'modulePage.artifacts.ansible_project': 'Progetto AAP',
    'modulePage.artifacts.description':
      'Questi artefatti sono generati dal processo di conversione e sono disponibili per la revisione.',
    'modulePage.phases.title': 'Fasi di migrazione',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.duration': 'Durata',
    'modulePage.phases.k8sJobName': 'Nome del job Kubernetes',
    'modulePage.phases.startedAt': 'Avviato il',
    'modulePage.phases.status': 'Stato',
    'modulePage.phases.errorDetails': "Dettagli dell'errore",
    'modulePage.phases.statuses.notStarted': 'Non avviato',
    'modulePage.phases.statuses.pending': 'In attesa',
    'modulePage.phases.statuses.running': 'In esecuzione',
    'modulePage.phases.statuses.success': 'Successo',
    'modulePage.phases.statuses.error': 'Errore',
    'modulePage.phases.reanalyzeInstructions':
      "Il piano di migrazione del modulo è già presente. Se il piano di migrazione complessivo del progetto è stato aggiornato, riavvia l'analisi per riflettere le modifiche.",
    'modulePage.phases.rerunAnalyze':
      'Ricrea il piano di migrazione del modulo',
    'modulePage.phases.analyzeInstructions':
      "Prima di eseguire l'analisi, esamina il piano di migrazione complessivo del progetto; il suo contenuto guiderà l'analisi del modulo.",
    'modulePage.phases.runAnalyze': 'Crea il piano di migrazione del modulo',
    'modulePage.phases.migrateInstructions':
      'Prima di eseguire la migrazione, esamina il piano di migrazione del modulo. Il processo di migrazione convertirà il codice Chef in Ansible in base al piano.',
    'modulePage.phases.runMigrate': 'Migra le sorgenti del modulo',
    'modulePage.phases.remigrateInstructions':
      'Le sorgenti migrate sono già presenti. Riavvia la migrazione per ricreare il codice Ansible convertito.',
    'modulePage.phases.rerunMigrate': 'Ricrea le sorgenti migrate',
    'modulePage.phases.publishInstructions':
      'Prima di pubblicare, esamina le sorgenti migrate. Il processo di pubblicazione committa il codice convertito nel repository di destinazione.',
    'modulePage.phases.runPublish': 'Pubblica nel repository di destinazione',
    'modulePage.phases.republishInstructions':
      'Il modulo è già stato pubblicato. Riavvia la pubblicazione per aggiornare il repository di destinazione.',
    'modulePage.phases.rerunPublish':
      'Ripubblica nel repository di destinazione',
    'modulePage.phases.commitId': 'Ultimo ID commit',
    'modulePage.phases.viewLog': 'Visualizza log',
    'modulePage.phases.hideLog': 'Nascondi log',
    'modulePage.phases.noLogsAvailable': 'Nessun log disponibile ancora...',
    'modulePage.phases.telemetry.title': 'Telemetria',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'Nessuna telemetria disponibile',
    'modulePage.phases.telemetry.agentName': "Nome dell'agente",
    'modulePage.phases.telemetry.duration': 'Durata',
    'modulePage.phases.telemetry.inputTokens': 'Token di input',
    'modulePage.phases.telemetry.outputTokens': 'Token di output',
    'modulePage.phases.telemetry.toolCalls':
      'Conteggio delle chiamate agli strumenti',
    'modulePage.phases.resyncMigrationPlanInstructions':
      "Sincronizza l'elenco dei moduli con il piano di migrazione.",
    'time.duration.daysAndHours': '{{days}}g {{hours}}h',
    'time.duration.daysOnly': '{{days}}g',
    'time.duration.hoursAndMinutes': '{{hours}}h {{minutes}}min',
    'time.duration.hoursOnly': '{{hours}}h',
    'time.duration.minutesAndSeconds': '{{minutes}}min {{seconds}}s',
    'time.duration.secondsOnly': '{{seconds}}s',
    'time.ago.daysAndHours': '{{days}}g {{hours}}h fa',
    'time.ago.daysOnly': '{{days}}g fa',
    'time.ago.hoursAndMinutes': '{{hours}}h {{minutes}}min fa',
    'time.ago.hoursOnly': '{{hours}}h fa',
    'time.ago.minutes': '{{minutes}}min fa',
    'time.ago.lessThanMinute': '<1min fa',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': 'In esecuzione da {{duration}}',
    'time.jobTiming.finished': 'Terminato {{timeAgo}} (durata {{duration}})',
    'bulkRun.projectAction': 'Esegui tutti i moduli',
    'bulkRun.globalAction': 'Esegui tutto',
    'bulkRun.projectPageAction': 'Esegui tutto',
    'bulkRun.projectConfirm.title':
      'Eseguire tutti i moduli nel progetto "{{name}}"?',
    'bulkRun.projectConfirm.message':
      'Questo attiverà la prossima fase di migrazione per ogni modulo di questo progetto il cui stato attuale lo consente. Assicurati di aver esaminato tutti gli artefatti necessari nei repository di destinazione prima di eseguire questa azione. I moduli non idonei verranno saltati.',
    'bulkRun.globalConfirm.title': 'Eseguire tutti i moduli idonei?',
    'bulkRun.globalConfirm.message':
      'Questo attiverà la prossima fase di migrazione per tutti i moduli idonei in tutti i progetti a cui hai accesso in scrittura, inclusi i progetti non visibili nella pagina corrente. Assicurati di aver esaminato tutti gli artefatti necessari nei repository di destinazione prima di eseguire questa azione.',
    'bulkRun.projectPageConfirm.title':
      'Eseguire tutti i moduli in "{{name}}"?',
    'bulkRun.projectPageConfirm.message':
      'Questo attiverà la prossima fase di migrazione per ogni modulo di questo progetto il cui stato attuale lo consente. Assicurati di aver esaminato tutti gli artefatti necessari nei repository di destinazione prima di eseguire questa azione. I moduli non idonei verranno saltati.',
    'bulkRun.confirm': 'Esegui tutto',
    'bulkRun.cancel': 'Annulla',
    'bulkRun.errorProject':
      'Errore nell\'esecuzione dei moduli nel progetto "{{name}}"',
    'bulkRun.errorGlobal': "Errore nell'operazione di massa",
  },
});

export default x2aPluginTranslationIt;
