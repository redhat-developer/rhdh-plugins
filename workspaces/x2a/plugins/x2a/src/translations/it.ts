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
      'Avvia e monitora la conversione asincrona di automazione esistente in playbook Ansible pronti per la produzione.',
    'table.columns.name': 'Nome',
    'table.columns.status': 'Stato',
    'table.columns.statusSortDisabledTooltip':
      "L'ordinamento per stato non è disponibile quando il numero di progetti supera {{threshold}}",
    'table.columns.sourceRepo': 'Repository sorgente',
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
    empty: '-',
    'initPhaseCard.title': 'Fase di scoperta',
    'projectDetailsCard.title': 'Dettagli del progetto',
    'projectDetailsCard.name': 'Nome',
    'projectDetailsCard.status': 'Stato',
    'projectDetailsCard.ownedBy': 'Proprietario',
    'projectDetailsCard.dirName': 'Nome della directory',
    'projectDetailsCard.description': 'Descrizione',
    'projectDetailsCard.sourceRepo': 'Repository sorgente',
    'projectDetailsCard.targetRepo': 'Repository di destinazione',
    'projectDetailsCard.edit': 'Modifica',
    'editProjectDialog.title': 'Modifica progetto',
    'editProjectDialog.cancel': 'Annulla',
    'editProjectDialog.update': 'Aggiorna',
    'editProjectDialog.updateError': 'Aggiornamento del progetto non riuscito',
    'editProjectDialog.ownerChangeWarningTitle':
      'Conferma trasferimento di proprietà',
    'editProjectDialog.ownerChangeWarning':
      "La modifica del proprietario potrebbe causare la perdita dell'accesso a questo progetto se i propri permessi non coprono il nuovo proprietario. Un amministratore può ripristinare l'accesso se necessario.",
    'editProjectDialog.ownerChangeConfirm': 'Trasferisci proprietà',
    'editProjectDialog.nameRequired': 'Il nome è obbligatorio',
    'editProjectDialog.ownerFormatHint':
      'Deve essere un riferimento di entità Backstage, ad es. user:default/nome o group:default/team',
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
    'project.ownedBy': 'Proprietario',
    'project.dirName': 'Nome della directory',
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
      'Avvia e monitora la conversione di automazione esistente in Ansible pronto per la produzione',
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
    'module.summary.cancelled': 'Annullato',
    'module.summary.toReview_one': '{{count}} modulo con artefatti da rivedere',
    'module.summary.toReview_other':
      '{{count}} moduli con artefatti da rivedere',
    'module.actions.runNextPhase': 'Esegui la prossima fase {{phase}}',
    'module.actions.cancelPhase': 'Annulla la fase {{phase}}',
    'module.actions.cancelPhaseError':
      "Errore nell'annullamento della fase per il modulo",
    'module.actions.runNextPhaseError':
      "Errore nell'esecuzione della prossima fase per il modulo",
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
    'module.statuses.cancelled': 'Annullato',
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
    'modulePage.phases.statuses.cancelled': 'Annullato',
    'modulePage.phases.reanalyzeInstructions':
      "Il piano di migrazione del modulo è già presente. Se il piano di migrazione complessivo del progetto è stato aggiornato, riavvia l'analisi per riflettere le modifiche.",
    'modulePage.phases.rerunAnalyze':
      'Ricrea il piano di migrazione del modulo',
    'modulePage.phases.analyzeInstructions':
      "Prima di eseguire l'analisi, esamina il piano di migrazione complessivo del progetto; il suo contenuto guiderà l'analisi del modulo.",
    'modulePage.phases.runAnalyze': 'Crea il piano di migrazione del modulo',
    'modulePage.phases.migrateInstructions':
      'Prima di eseguire la migrazione, esamina il piano di migrazione del modulo. Il processo di migrazione convertirà il codice sorgente in Ansible in base al piano.',
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
    'modulePage.phases.cancel': 'Annulla',
    'modulePage.phases.runError':
      "Errore nell'esecuzione della fase per il modulo",
    'modulePage.phases.cancelError':
      "Errore nell'annullamento della fase per il modulo",
    'modulePage.phases.commitId': 'Ultimo ID commit',
    'modulePage.phases.viewLog': 'Visualizza log',
    'modulePage.phases.hideLog': 'Nascondi log',
    'modulePage.phases.noLogsAvailable': 'Nessun log disponibile ancora...',
    'modulePage.phases.logWaitingForStream':
      "In attesa dell'output di log dal cluster...",
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
    'bulkRun.globalConfirm.title': 'Eseguire tutti i progetti e moduli idonei?',
    'bulkRun.globalConfirm.message':
      'Questo attiverà la prossima fase di migrazione per tutti i moduli idonei in tutti i progetti a cui hai accesso in scrittura, inclusi i progetti non visibili nella pagina corrente. Assicurati di aver esaminato tutti gli artefatti necessari nei repository di destinazione prima di eseguire questa azione.',
    'bulkRun.globalConfirm.messageInitRetrigger':
      "Alcuni progetti sono idonei per rieseguire la fase di inizializzazione. La loro fase di scoperta verrà anch'essa riattivata.",
    'bulkRun.globalConfirm.noInitEligible':
      'Attualmente nessun progetto è idoneo per rieseguire la fase di inizializzazione.',
    'bulkRun.globalConfirm.userPromptLabel':
      'Istruzioni utente per il riavvio di init (opzionale)',
    'bulkRun.globalConfirm.userPromptPlaceholder':
      'Se alcuni progetti necessitano di riavviare la fase di init, queste istruzioni verranno utilizzate per personalizzare la conversione…',
    'bulkRun.projectPageConfirm.title':
      'Eseguire tutti i moduli in "{{name}}"?',
    'bulkRun.projectPageConfirm.message':
      'Questo attiverà la prossima fase di migrazione per ogni modulo di questo progetto il cui stato attuale lo consente. Assicurati di aver esaminato tutti gli artefatti necessari nei repository di destinazione prima di eseguire questa azione. I moduli non idonei verranno saltati.',
    'bulkRun.confirm': 'Esegui tutto',
    'bulkRun.cancel': 'Annulla',
    'bulkRun.errorProject':
      'Errore nell\'esecuzione dei moduli nel progetto "{{name}}"',
    'bulkRun.errorModuleStart':
      'Errore nell\'avvio della fase "{{phase}}" per il modulo "{{moduleName}}"',
    'bulkRun.errorGlobal': "Errore nell'operazione di massa",
    'retriggerInit.confirm.title':
      'Riavviare la fase di inizializzazione per "{{name}}"?',
    'retriggerInit.confirm.message':
      'Questo riavvierà la fase di scoperta del progetto, avviando un nuovo lavoro di inizializzazione. I risultati di inizializzazione precedenti saranno sostituiti.',
    'retriggerInit.confirm.userPromptLabel': 'Istruzioni utente (opzionale)',
    'retriggerInit.confirm.userPromptPlaceholder':
      'Fornire istruzioni aggiuntive per la conversione…',
    'retriggerInit.confirm.confirmButton': 'Riavvia',
    'retriggerInit.firstTrigger.title':
      'Avviare la fase di inizializzazione per "{{name}}"?',
    'retriggerInit.firstTrigger.message':
      'Dopo la conferma verrà avviata la fase di scoperta per questo progetto. Potrebbero esserti richiesti i token SCM di origine e destinazione.',
    'retriggerInit.firstTrigger.userPromptLabel':
      'Istruzioni utente (opzionale)',
    'retriggerInit.firstTrigger.userPromptPlaceholder':
      'Fornire istruzioni aggiuntive per la conversione…',
    'retriggerInit.firstTrigger.confirmButton':
      'Avvia fase di inizializzazione',
    'retriggerInit.error':
      'Errore nel riavvio della fase di inizializzazione del progetto "{{name}}"',
    'retriggerInit.errorStart':
      "Errore nell'avvio dell'inizializzazione del progetto",
    'rulesPage.title': 'Regole di conversione',
    'rulesPage.subtitle':
      'Gestisci le regole che i progetti devono accettare al momento della creazione.',
    'rulesPage.addRule': 'Aggiungi regola',
    'rulesPage.manageRules': 'Gestisci regole',
    'rulesPage.notAllowed': 'Non hai il permesso di gestire le regole.',
    'rulesPage.table.id': 'ID',
    'rulesPage.table.title': 'Titolo',
    'rulesPage.table.description': 'Descrizione',
    'rulesPage.table.required': 'Obbligatorio',
    'rulesPage.table.optional': 'Opzionale',
    'rulesPage.table.createdAt': 'Creato',
    'rulesPage.table.editRule': 'Modifica regola',
    'rulesPage.table.noRules': 'Nessuna regola definita ancora.',
    'rulesPage.dialog.createTitle': 'Crea regola',
    'rulesPage.dialog.editTitle': 'Modifica regola',
    'rulesPage.dialog.titleField': 'Titolo',
    'rulesPage.dialog.descriptionField': 'Descrizione',
    'rulesPage.dialog.requiredField': 'Obbligatorio per tutti i progetti',
    'rulesPage.dialog.save': 'Salva',
    'rulesPage.dialog.cancel': 'Annulla',
    'rulesPage.dialog.createError': 'Errore nella creazione della regola',
    'rulesPage.dialog.updateError': "Errore nell'aggiornamento della regola",
  },
});

export default x2aPluginTranslationIt;
