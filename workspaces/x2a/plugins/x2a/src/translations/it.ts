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
    'artifact.types.ansible_project': 'Progetto AAP',
    'artifact.types.migrated_sources': 'Sorgenti migrate',
    'artifact.types.migration_plan': 'Piano di migrazione dei progetti',
    'artifact.types.module_migration_plan': 'Piano di migrazione dei moduli',
    'artifact.types.project_metadata': 'Metadati progetto',
    'bulkRun.cancel': 'Annulla',
    'bulkRun.confirm': 'Esegui tutto',
    'bulkRun.errorGlobal': "Impossibile eseguire l'operazione in blocco",
    'bulkRun.errorModuleStart':
      'Impossibile avviare la fase "{{phase}}" per il modulo "{{moduleName}}"',
    'bulkRun.errorProject':
      'Impossibile eseguire i moduli nel progetto "{{name}}"',
    'bulkRun.globalAction': 'Esegui tutto',
    'bulkRun.globalConfirm.message':
      'Questo avvierà la fase di migrazione successiva per tutti i moduli idonei in ogni progetto a cui hai accesso in scrittura, inclusi i progetti non visibili nella pagina corrente. Assicurati di aver rivisto tutti gli artefatti necessari nei repository di destinazione prima di eseguire questa azione.',
    'bulkRun.globalConfirm.messageInitRetrigger':
      'Alcuni progetti possono ripetere la fase di inizializzazione. Anche la loro fase di discovery verrà riavviata.',
    'bulkRun.globalConfirm.noInitEligible':
      'Al momento nessun progetto è idoneo a ripetere la fase di inizializzazione.',
    'bulkRun.globalConfirm.title':
      'Eseguire tutti i progetti e i moduli idonei?',
    'bulkRun.globalConfirm.userPromptLabel':
      'Prompt utente per il riavvio iniziale (opzionale)',
    'bulkRun.globalConfirm.userPromptPlaceholder':
      'Se è necessario riavviare la fase di inizializzazione di un progetto, questo messaggio verrà utilizzato per personalizzare la conversione...',
    'bulkRun.projectAction': 'Esegui tutti i moduli',
    'bulkRun.projectConfirm.message':
      'Ciò avvierà la fase di migrazione successiva per ogni modulo di questo progetto il cui stato attuale lo consenta. Assicurati di aver rivisto tutti gli artefatti necessari nei repository di destinazione prima di eseguire questa azione. I moduli non idonei verranno saltati.',
    'bulkRun.projectConfirm.title':
      'Eseguire tutti i moduli del progetto "{{name}}"?',
    'bulkRun.projectPageAction': 'Esegui tutto',
    'bulkRun.projectPageConfirm.message':
      'Ciò avvierà la fase di migrazione successiva per ogni modulo di questo progetto il cui stato attuale lo consenta. Assicurati di aver rivisto tutti gli artefatti necessari nei repository di destinazione prima di eseguire questa azione. I moduli non idonei verranno saltati.',
    'bulkRun.projectPageConfirm.title':
      'Eseguire tutti i moduli in "{{name}}"?',
    'common.newProject': 'Nuovo progetto',
    'editProjectDialog.cancel': 'Annulla',
    'editProjectDialog.nameRequired': 'Il nome è obbligatorio',
    'editProjectDialog.ownerChangeConfirm': 'Trasferisci proprietà',
    'editProjectDialog.ownerChangeWarning':
      "La modifica del proprietario potrebbe causare la perdita dell'accesso a questo progetto se i propri permessi non coprono il nuovo proprietario. Un amministratore può ripristinare l'accesso se necessario.",
    'editProjectDialog.ownerChangeWarningTitle':
      'Conferma trasferimento di proprietà',
    'editProjectDialog.ownerFormatHint':
      'Deve essere un riferimento di entità Backstage, ad es. user:default/nome o group:default/team',
    'editProjectDialog.title': 'Modifica progetto',
    'editProjectDialog.update': 'Aggiorna',
    'editProjectDialog.updateError': 'Aggiornamento del progetto non riuscito',
    empty: '-',
    'emptyPage.noConversionInitiatedYet':
      'Nessuna conversione è stata ancora avviata',
    'emptyPage.noConversionInitiatedYetDescription':
      'Avvia e monitora la conversione delle automazioni esistenti in Ansible production-ready',
    'emptyPage.notAllowedDescription':
      'Non sei autorizzato ad accedere ai progetti di conversione.',
    'emptyPage.notAllowedTitle': 'Accesso negato',
    'emptyPage.startFirstConversion': 'Avvia la prima conversione',
    'initPhaseCard.title': 'Fase di discovery',
    'module.actions.cancelPhase': 'Annulla la fase {{phase}}',
    'module.actions.cancelPhaseError':
      'Impossibile annullare la fase per il modulo',
    'module.actions.runNextPhase': 'Esegui la fase successiva {{phase}}',
    'module.actions.runNextPhaseError':
      'Impossibile eseguire la fase successiva per il modulo',
    'module.artifacts': 'Artefatti',
    'module.currentPhase': 'Fase attuale',
    'module.lastUpdate': 'Ultimo aggiornamento',
    'module.name': 'Nome',
    'module.notStarted': 'Non avviato',
    'module.phases.analyze': 'Analizza',
    'module.phases.init': 'Inizializzazione',
    'module.phases.migrate': 'Migra',
    'module.phases.none': '-',
    'module.phases.publish': 'Pubblica',
    'module.sourcePath': 'Percorso sorgente',
    'module.status': 'Stato',
    'module.statuses.cancelled': 'Annullato',
    'module.statuses.error': 'Errore',
    'module.statuses.none': '-',
    'module.statuses.pending': 'In sospeso',
    'module.statuses.running': 'In esecuzione',
    'module.statuses.success': 'Successo',
    'module.summary.cancelled': 'Annullato',
    'module.summary.error': 'Errore',
    'module.summary.finished': 'Finito',
    'module.summary.pending': 'In sospeso',
    'module.summary.running': 'In esecuzione',
    'module.summary.toReview_one': '{{count}} modulo con artefatti da rivedere',
    'module.summary.toReview_other':
      '{{count}} moduli con artefatti da rivedere',
    'module.summary.total': 'Totale',
    'module.summary.waiting': 'In attesa',
    'modulePage.artifacts.ansible_project': 'Progetto AAP',
    'modulePage.artifacts.description':
      'Questi artefatti sono generati dal processo di conversione e sono disponibili per la revisione.',
    'modulePage.artifacts.migrated_sources': 'Sorgenti migrate',
    'modulePage.artifacts.migration_plan':
      'Piano generale di migrazione del progetto',
    'modulePage.artifacts.module_migration_plan':
      "Piano del modulo basato sull'analisi",
    'modulePage.artifacts.title': 'Artefatti da rivedere',
    'modulePage.phases.analyzeInstructions':
      "Prima di eseguire l'analisi, occorre prima rivedere il piano di migrazione complessivo del progetto. Il suo contenuto guiderà l'analisi del modulo.",
    'modulePage.phases.cancel': 'Annulla',
    'modulePage.phases.cancelError':
      'Impossibile annullare la fase per il modulo',
    'modulePage.phases.commitId': 'ID ultimo commit',
    'modulePage.phases.duration': 'Durata',
    'modulePage.phases.errorDetails': "Dettagli dell'errore",
    'modulePage.phases.hideLog': 'Nascondi log',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.k8sJobName': 'Nome processo Kubernetes',
    'modulePage.phases.logWaitingForStream':
      "In attesa dell'output del log dal cluster...",
    'modulePage.phases.migrateInstructions':
      'Prima di eseguire la migrazione, rivedere il piano di migrazione dei moduli. Il processo di migrazione convertirà il codice sorgente in Ansible in base al piano.',
    'modulePage.phases.noLogsAvailable': 'Nessun log ancora disponibile...',
    'modulePage.phases.publishInstructions':
      'Prima della pubblicazione, rivedi le sorgenti migrate. Il processo di pubblicazione eseguirà il commit del codice convertito nel repository di destinazione.',
    'modulePage.phases.reanalyzeInstructions':
      "Il piano di migrazione dei moduli è già presente. Nel caso in cui il piano di migrazione complessivo del progetto sia stato aggiornato, riavviare l'analisi per riflettere le modifiche.",
    'modulePage.phases.remigrateInstructions':
      'Le sorgenti migrate sono già presenti. Riavvia la migrazione per ricreare il codice Ansible convertito.',
    'modulePage.phases.republishInstructions':
      'Il modulo è già stato pubblicato. Riavvia la pubblicazione per aggiornare il repository di destinazione.',
    'modulePage.phases.rerunAnalyze':
      'Ricrea il piano di migrazione dei moduli',
    'modulePage.phases.rerunMigrate': 'Ricrea le sorgenti migrate',
    'modulePage.phases.rerunPublish':
      'Ripubblica nel repository di destinazione',
    'modulePage.phases.resyncMigrationPlanInstructions':
      "Risincronizza l'elenco dei moduli in modo che corrisponda al piano di migrazione.",
    'modulePage.phases.runAnalyze': 'Crea un piano di migrazione dei moduli',
    'modulePage.phases.runError': 'Impossibile eseguire la fase per il modulo',
    'modulePage.phases.runMigrate': 'Migra le sorgenti del modulo',
    'modulePage.phases.runPublish': 'Pubblica nel repository di destinazione',
    'modulePage.phases.startedAt': 'Iniziato il',
    'modulePage.phases.status': 'Stato',
    'modulePage.phases.statuses.cancelled': 'Annullato',
    'modulePage.phases.statuses.error': 'Errore',
    'modulePage.phases.statuses.notStarted': 'Non avviato',
    'modulePage.phases.statuses.pending': 'In sospeso',
    'modulePage.phases.statuses.running': 'In esecuzione',
    'modulePage.phases.statuses.success': 'Successo',
    'modulePage.phases.telemetry.agentName': 'Nome agente',
    'modulePage.phases.telemetry.duration': 'Durata',
    'modulePage.phases.telemetry.inputTokens': 'Token di input',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'Nessun dato di telemetria disponibile',
    'modulePage.phases.telemetry.outputTokens': 'Token di output',
    'modulePage.phases.telemetry.title': 'Telemetria',
    'modulePage.phases.telemetry.toolCalls':
      'Numero di chiamate agli strumenti',
    'modulePage.phases.title': 'Fasi migrazione',
    'modulePage.phases.viewLog': 'Visualizza log',
    'modulePage.title': 'Dettagli modulo',
    'page.subtitle':
      'Avvia e monitora la conversione asincrona delle automazioni esistenti in Ansible Playbook production-ready.',
    'page.title': 'Conversion Hub',
    'project.description': 'Descrizione',
    'project.dirName': 'Nome della directory',
    'project.id': 'ID',
    'project.noModules': 'Ancora nessun modulo trovato...',
    'project.ownedBy': 'Proprietario',
    'project.statuses.completed': 'Completato',
    'project.statuses.created': 'Creato',
    'project.statuses.failed': 'Non riuscito',
    'project.statuses.inProgress': 'In corso',
    'project.statuses.initialized': 'Inizializzato',
    'project.statuses.initializing': 'Inizializzazione',
    'project.statuses.none': '-',
    'projectDetailsCard.description': 'Descrizione',
    'projectDetailsCard.dirName': 'Nome della directory',
    'projectDetailsCard.edit': 'Modifica',
    'projectDetailsCard.name': 'Nome',
    'projectDetailsCard.ownedBy': 'Proprietario',
    'projectDetailsCard.sourceRepo': 'Repository sorgente',
    'projectDetailsCard.status': 'Stato',
    'projectDetailsCard.targetRepo': 'Repository di destinazione',
    'projectDetailsCard.title': 'Dettagli progetto',
    'projectModulesCard.noModules': 'Ancora nessun modulo trovato...',
    'projectModulesCard.published': 'pubblicato',
    'projectModulesCard.title': 'Moduli ({{count}})',
    'projectModulesCard.toReview': 'revisione',
    'projectPage.actionsTooltip':
      'Fai clic per aprire il menu delle azioni del progetto',
    'projectPage.deleteConfirm.cancel': 'Annulla',
    'projectPage.deleteConfirm.confirm': 'Elimina',
    'projectPage.deleteConfirm.message':
      'Questo progetto, tutti i suoi moduli e i relativi processi verranno eliminati definitivamente. Impossibile annullare questa azione. Gli artefatti presenti nel repository di destinazione verranno conservati.',
    'projectPage.deleteConfirm.title': 'Eliminare il progetto "{{name}}"?',
    'projectPage.deleteError': 'Impossibile eliminare il progetto',
    'projectPage.deleteProject': 'Elimina',
    'projectPage.title': 'Progetto',
    'projectTable.deleteError': 'Impossibile eliminare il progetto',
    'retriggerInit.confirm.confirmButton': 'Riavvia',
    'retriggerInit.confirm.message':
      'Questo riavvierà la fase di discovery del progetto, avviando un nuovo processo di inizializzazione. Tutti i risultati di inizializzazione precedenti verranno sostituiti.',
    'retriggerInit.confirm.title':
      'Riavviare la fase di inizializzazione per "{{name}}"?',
    'retriggerInit.confirm.userPromptLabel': 'Prompt utente (opzionale)',
    'retriggerInit.confirm.userPromptPlaceholder':
      'Fornire istruzioni aggiuntive per la conversione…',
    'retriggerInit.error':
      'Impossibile riavviare l\'inizializzazione per il progetto "{{name}}"',
    'retriggerInit.errorStart': 'Impossibile avviare inizializzazione progetto',
    'retriggerInit.firstTrigger.confirmButton':
      'Avvia fase di inizializzazione',
    'retriggerInit.firstTrigger.message':
      'Una volta confermata, avrà inizio la fase di discovery del progetto. Potrebbe esserti richiesto di fornire i token SCM di origine e di destinazione.',
    'retriggerInit.firstTrigger.title':
      'Riavviare la fase di inizializzazione per "{{name}}"?',
    'retriggerInit.firstTrigger.userPromptLabel': 'Prompt utente (opzionale)',
    'retriggerInit.firstTrigger.userPromptPlaceholder':
      'Fornire istruzioni aggiuntive per la conversione…',
    'rulesPage.addRule': 'Aggiungi regola',
    'rulesPage.deleteConfirm.cancel': 'Annulla',
    'rulesPage.deleteConfirm.confirm': 'Elimina',
    'rulesPage.deleteConfirm.deleteError':
      "Errore nell'eliminazione della regola",
    'rulesPage.deleteConfirm.message':
      'Questa regola verrà eliminata permanentemente. I progetti esistenti che hanno già accettato questa regola non saranno interessati.',
    'rulesPage.deleteConfirm.title': 'Eliminare la regola "{{title}}"?',
    'rulesPage.dialog.cancel': 'Annulla',
    'rulesPage.dialog.createError': 'Errore nella creazione della regola',
    'rulesPage.dialog.createTitle': 'Crea regola',
    'rulesPage.dialog.descriptionField': 'Descrizione',
    'rulesPage.dialog.editTitle': 'Modifica regola',
    'rulesPage.dialog.requiredField': 'Obbligatorio per tutti i progetti',
    'rulesPage.dialog.save': 'Salva',
    'rulesPage.dialog.titleField': 'Titolo',
    'rulesPage.dialog.updateError': "Errore nell'aggiornamento della regola",
    'rulesPage.manageRules': 'Gestisci regole',
    'rulesPage.notAllowed': 'Non hai il permesso di gestire le regole.',
    'rulesPage.subtitle':
      'Gestisci le regole che i progetti devono accettare al momento della creazione.',
    'rulesPage.table.createdAt': 'Creato',
    'rulesPage.table.deleteRule': 'Elimina regola',
    'rulesPage.table.description': 'Descrizione',
    'rulesPage.table.editRule': 'Modifica regola',
    'rulesPage.table.id': 'ID',
    'rulesPage.table.noRules': 'Nessuna regola definita ancora.',
    'rulesPage.table.optional': 'Opzionale',
    'rulesPage.table.required': 'Obbligatorio',
    'rulesPage.table.title': 'Titolo',
    'rulesPage.title': 'Regole di conversione',
    'scaffolder.rulesAcceptance.fetchError':
      'Errore nel caricamento delle regole',
    'scaffolder.rulesAcceptance.loadingRules': 'Caricamento regole...',
    'scaffolder.rulesAcceptance.noRulesConfigured':
      'Nessuna regola configurata.',
    'scaffolder.rulesAcceptance.required': 'obbligatorio',
    'sidebar.x2a.title': 'Conversion Hub',
    'table.actions.collapseAll': 'Comprimi tutte le righe',
    'table.actions.collapseRow': 'Comprimi riga',
    'table.actions.deleteProject': 'Elimina progetto',
    'table.actions.expandAll': 'Espandi tutte le righe',
    'table.actions.expandRow': 'Espandi riga',
    'table.actions.retriggerInit':
      'Riavvia la fase di inizializzazione del progetto',
    'table.columns.createdAt': 'Creato il',
    'table.columns.name': 'Nome',
    'table.columns.sourceRepo': 'Repository sorgente',
    'table.columns.status': 'Stato',
    'table.columns.statusSortDisabledTooltip':
      "L'ordinamento per stato non è disponibile quando il numero di progetti supera {{threshold}}",
    'table.columns.targetRepo': 'Repository di destinazione',
    'table.projectsCount': 'Progetti ({{count}})',
    'time.ago.daysAndHours': '{{days}}g {{hours}}h fa',
    'time.ago.daysOnly': '{{days}}g fa',
    'time.ago.hoursAndMinutes': '{{hours}}h {{minutes}}m fa',
    'time.ago.hoursOnly': '{{hours}}h fa',
    'time.ago.lessThanMinute': '&lt;1m fa',
    'time.ago.minutes': '{{minutes}}m fa',
    'time.duration.daysAndHours': '{{days}}g {{hours}}h',
    'time.duration.daysOnly': '{{days}}g',
    'time.duration.hoursAndMinutes': '{{hours}}h {{minutes}}m',
    'time.duration.hoursOnly': '{{hours}}h',
    'time.duration.minutesAndSeconds': '{{minutes}}m {{seconds}}s',
    'time.duration.secondsOnly': '{{seconds}}s',
    'time.jobTiming.finished':
      'Completato {{timeAgo}} (tempo impiegato {{duration}})',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': 'In esecuzione per {{durata}}',
  },
});

export default x2aPluginTranslationIt;
