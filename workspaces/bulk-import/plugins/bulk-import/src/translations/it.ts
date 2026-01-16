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

import { bulkImportTranslationRef } from './ref';

/**
 * Italian translation for plugin.bulk-import.
 * @public
 */
const bulkImportTranslationIt = createTranslationMessages({
  ref: bulkImportTranslationRef,
  messages: {
    'page.title': 'Importazione in blocco',
    'page.subtitle': 'Importa entità in Red Hat Developer Hub',
    'page.addRepositoriesTitle': 'Aggiungere repository',
    'page.importEntitiesTitle': 'Importare entità',
    'page.addRepositoriesSubtitle':
      'Aggiungere repository a Red Hat Developer Hub in 4 passaggi',
    'page.importEntitiesSubtitle': 'Importa in Red Hat Developer Hub',
    'page.typeLink': 'Importazione in blocco',
    'sidebar.bulkImport': 'Importazione in blocco',
    'permissions.title': 'Autorizzazione richiesta',
    'permissions.addRepositoriesMessage':
      "Per aggiungere repository, contattare l'amministratore per ottenere l'autorizzazione 'bulk.import'.",
    'permissions.viewRepositoriesMessage':
      "Per visualizzare i repository aggiunti, contattare l'amministratore per ottenere l'autorizzazione 'bulk.import'.",
    'repositories.addedRepositories': 'Repository aggiunti',
    'repositories.importedEntities': 'Entità importate',
    'repositories.addedRepositoriesCount': 'Repository aggiunti ({{count}})',
    'repositories.importedEntitiesCount': 'Entità importate ({{count}})',
    'repositories.noRecordsFound': 'Nessun record trovato',
    'repositories.noProjectsFound':
      "Nessun progetto disponibile per l'importazione.",
    'repositories.refresh': 'Aggiorna',
    'repositories.import': 'Importa',
    'repositories.removing': 'Rimozione in corso...',
    'repositories.deleteRepository': 'Elimina repository',
    'repositories.removeRepositoryQuestion':
      'Eliminare {{repoName}} {{repositoryText}}?',
    'repositories.repositoryText': 'repository',
    'repositories.removeRepositoryWarningScaffolder':
      'La rimozione di un repository rimuove anche tutte le informazioni sulle attività di scaffolding associate.',
    'repositories.removeRepositoryWarningOrchestrator':
      "Elimina repository e informazioni sul flusso di lavoro dell'orchestratore associate.",
    'repositories.removeRepositoryWarning':
      'La rimozione di un repository cancella tutte le informazioni associate dalla pagina Catalogo.',
    'repositories.removeRepositoryWarningGitlab':
      'La rimozione elimina tutte le informazioni associate dalla pagina Catalogo.',
    'repositories.cannotRemoveRepositoryUrl':
      "Impossibile rimuovere il repository perché l'URL del repository è mancante.",
    'repositories.unableToRemoveRepository':
      'Impossibile rimuovere il repository. {{error}}',
    'repositories.removeTooltipDisabled':
      'Questo repository è stato aggiunto al file app-config. Per rimuoverlo modificare direttamente il file',
    'repositories.removeTooltipRepositoryScaffolder':
      "Elimina il repository e le informazioni sull'attività di scaffolding associata",
    'repositories.removeTooltipRepositoryOrchestrator':
      "Elimina repository e informazioni sul flusso di lavoro dell'orchestratore associate",
    'repositories.errorOccuredWhileFetching':
      'Si è verificato un errore durante il recupero della richiesta pull',
    'repositories.failedToCreatePullRequest':
      'Impossibile creare la richiesta pull',
    'repositories.errorOccured': 'Si è verificato un errore',
    'repositories.editCatalogInfoTooltip':
      'Modifica la richiesta pull catalog-info.yaml',
    'repositories.viewCatalogInfoTooltip':
      'Visualizza il file catalog-info.yaml',
    'repositories.pr': 'Richiesta pull',
    'status.alreadyImported': 'Già importata',
    'status.added': 'Aggiunta',
    'status.waitingForApproval': 'In attesa di approvazione',
    'status.imported': 'Importata',
    'status.readyToImport': "Pronto per l'importazione",
    'status.waitingForPullRequestToStart':
      'In attesa che inizi la richiesta pull',
    'status.missingConfigurations': 'Configurazioni mancanti',
    'status.failedCreatingPR': 'Impossibile creare la PR',
    'status.pullRequestRejected': 'Richiesta pull rifiutata',
    'errors.prErrorPermissions':
      "Impossibile creare una nuova richiesta pull a causa di autorizzazioni insufficienti. Contattare l'amministratore.",
    'errors.catalogInfoExists':
      "Poiché catalog-info.yaml esiste già nel repository, non verrà creata alcuna nuova richiesta pull. Tuttavia, l'entità sarà comunque registrata nella pagina del catalogo.",
    'errors.catalogEntityConflict':
      'Impossibile creare una nuova richiesta pull a causa di un conflitto tra entità del catalogo.',
    'errors.repoEmpty':
      'Impossibile creare una nuova richiesta pull perché il repository è vuoto. Inviare un commit iniziale al repository.',
    'errors.codeOwnersNotFound':
      'Il file CODEOWNERS non è presente nel repository. Aggiungere un file CODEOWNERS per creare una nuova richiesta pull.',
    'errors.errorOccurred': 'Si è verificato un errore',
    'errors.failedToCreatePullRequest': 'Impossibile creare la richiesta pull',
    'errors.noIntegrationsConfigured':
      "Nessuna integrazione GitHub o GitLab è configurata. Aggiungere almeno un'integrazione per utilizzare la funzionalità di importazione in blocco.",
    'errors.addIntegrationsToConfig':
      'Per risolvere questo problema, assicurarsi che le integrazioni siano aggiunte al file di configurazione di Backstage (app-config.yaml).',
    'validation.componentNameInvalid':
      '"{{value}}" non è valido; è prevista una stringa composta da sequenze di [a-zA-Z0-9] separate da uno qualsiasi tra i simboli [-_.], per un massimo di 63 caratteri in totale. Per saperne di più sul formato del file catalogo, visitare: https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md',
    'validation.componentNameRequired': 'Il nome del componente è obbligatorio',
    'validation.entityOwnerRequired':
      "Il proprietario dell'entità è obbligatorio",
    'validation.titleRequired': 'Il titolo {{approvalTool}} è obbligatorio',
    'validation.descriptionRequired':
      'La descrizione {{approvalTool}} è obbligatoria',
    'validation.keyValuePairFormat':
      'Ogni voce deve avere una chiave e un valore separati da due punti.',
    'table.headers.name': 'Nome',
    'table.headers.url': 'URL',
    'table.headers.repoUrl': 'URL del repository',
    'table.headers.organization': 'Organizzazione',
    'table.headers.organizationGroup': 'Organizzazione/gruppo',
    'table.headers.group': 'Gruppo',
    'table.headers.status': 'Stato',
    'table.headers.taskStatus': 'Stato attività',
    'table.headers.lastUpdated': 'Ultimo aggiornamento',
    'table.headers.actions': 'Azioni',
    'table.headers.catalogInfoYaml': 'catalogo-info.yaml',
    'table.pagination.rows5': '5 righe',
    'table.pagination.rows10': '10 righe',
    'table.pagination.rows20': '20 righe',
    'table.pagination.rows50': '50 righe',
    'table.pagination.rows100': '100 righe',
    'steps.chooseApprovalTool':
      'Scegliere lo strumento di approvazione (GitHub/GitLab) per la creazione di richieste pull',
    'steps.chooseRepositories': 'Scegliere i repository da aggiungere',
    'steps.chooseItems': 'Scegliere quali elementi importare',
    'steps.generateCatalogInfo':
      'Generare un file catalog-info.yaml per ogni repository',
    'steps.generateCatalogInfoItems':
      'Generare un file catalog-info.yaml per ogni elemento selezionato',
    'steps.editPullRequest':
      'Modificare i dettagli della richiesta pull se necessario',
    'steps.trackStatus': 'Tenere traccia dello stato di approvazione',
    'addRepositories.approvalTool.title': 'Strumento di approvazione',
    'addRepositories.approvalTool.description':
      'Scegliere lo strumento di approvazione per la creazione di richiesta pull',
    'addRepositories.approvalTool.tooltip':
      "L'importazione richiede l'approvazione. Dopo l'approvazione della richiesta di pull/merge, i repository/progetti vengono importati nella pagina Catalogo.",
    'addRepositories.approvalTool.github': 'GitHub',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.repositoryType.title': 'Tipo di repository',
    'addRepositories.repositoryType.repository': 'Repository',
    'addRepositories.repositoryType.organization': 'Organizzazione',
    'addRepositories.repositoryType.project': 'Progetto',
    'addRepositories.repositoryType.group': 'Gruppo',
    'addRepositories.searchPlaceholder': 'Ricerca',
    'addRepositories.clearSearch': 'cancella ricerca',
    'addRepositories.noRepositoriesFound': 'Nessun repository trovato',
    'addRepositories.allRepositoriesAdded':
      'Tutti i repository sono stati aggiunti',
    'addRepositories.noSelection': 'Nessuno',
    'addRepositories.selectRepositories': 'Selezionare repository',
    'addRepositories.selectedRepositories': 'repository',
    'addRepositories.selectedProjects': 'progetti',
    'addRepositories.selectedLabel': 'Selezionato',
    'addRepositories.selectedCount': '{{count}} selezionati',
    'addRepositories.addSelected': 'Aggiungi selezionati',
    'addRepositories.generateCatalogInfo': 'Genera catalog-info.yaml',
    'addRepositories.editPullRequest': 'Modifica richiesta pull',
    'addRepositories.preview': 'Anteprima',
    'catalogInfo.status.generating': 'Generazione',
    'common.add': 'Aggiungi',
    'common.cancel': 'Cancella',
    'common.close': 'Chiudi',
    'common.delete': 'Elimina',
    'common.edit': 'Modifica',
    'common.filter': 'Filtra',
    'common.import': 'Importa',
    'common.remove': 'Rimuovi',
    'common.save': 'Salva',
    'common.documentation': 'Documentazione',
    'common.select': 'Seleziona',
    'common.update': 'Aggiorna',
    'common.view': 'Visualizza',
    'time.daysAgo': '{{count}} giorno/i fa',
    'time.hoursAgo': '{{count}} ora/e fa',
    'time.minutesAgo': '{{count}} minuto/i fa',
    'time.secondsAgo': '{{count}} secondi fa',
    'previewFile.previewFile': 'Anteprima del file',
    'previewFile.previewFiles': 'Anteprima dei file',
    'previewFile.failedToCreatePR': 'Impossibile creare la richiesta pull',
    'previewFile.prCreationUnsuccessful':
      'La creazione delle richieste pull per alcuni repository non è riuscita. Cliccare su `Modifica` per vedere il motivo.',
    'previewFile.failedToFetchPR':
      'Impossibile recuperare la richiesta pull. Di seguito è stato generato un nuovo YAML.',
    'previewFile.invalidEntityYaml':
      "L'entità YAML nella richiesta pull non è valida (file vuoto o apiVersion, kind o metadata.name mancanti). Di seguito è stato generato un nuovo YAML.",
    'previewFile.pullRequestPendingApproval':
      '[{{pullRequestText}}]({{pullRequestUrl}}) è in attesa di approvazione',
    'previewFile.pullRequestText': 'richiesta pull',
    'previewFile.viewRepository': 'Visualizza repository',
    'previewFile.closeDrawer': 'Chiudi il riquadro',
    'previewFile.keyValuePlaceholder': 'key1: value2; key2: value2',
    'previewFile.useSemicolonSeparator':
      'Utilizzare il punto e virgola per separare {{label}}',
    'previewFile.preview': 'Anteprima',
    'previewFile.pullRequest.title': 'Richiesta pull',
    'previewFile.pullRequest.mergeRequest': 'Richiesta merge',
    'previewFile.pullRequest.serviceNowTicket': 'Ticket ServiceNow',
    'previewFile.pullRequest.details': 'Dettagli {{tool}}',
    'previewFile.pullRequest.titleLabel': 'Titolo {{tool}}',
    'previewFile.pullRequest.bodyLabel': 'Corpo {{tool}}',
    'previewFile.pullRequest.titlePlaceholder':
      'Aggiungere i file descrittori di entità del catalogo Backstage',
    'previewFile.pullRequest.bodyPlaceholder':
      'Un testo descrittivo con supporto Markdown',
    'previewFile.pullRequest.entityConfiguration': "Configurazione dell'entità",
    'previewFile.pullRequest.componentNameLabel': 'Nome del componente creato',
    'previewFile.pullRequest.componentNamePlaceholder': 'Nome del componente',
    'previewFile.pullRequest.entityOwnerLabel': "Proprietario dell'entità",
    'previewFile.pullRequest.entityOwnerPlaceholder': 'gruppi e utenti',
    'previewFile.pullRequest.entityOwnerHelper':
      "Selezionare un proprietario dall'elenco o inserire un riferimento a un gruppo o a un utente",
    'previewFile.pullRequest.loadingText': 'Caricamento di gruppi e utenti',
    'previewFile.pullRequest.previewEntities': 'Anteprima entità',
    'previewFile.pullRequest.annotations': 'Annotazioni',
    'previewFile.pullRequest.labels': 'Etichette',
    'previewFile.pullRequest.spec': 'Specifiche',
    'previewFile.pullRequest.useCodeOwnersFile':
      "Utilizzare il file *CODEOWNERS* come Proprietario dell'entità",
    'previewFile.pullRequest.codeOwnersWarning':
      'ATTENZIONE: questa operazione potrebbe non riuscire se la posizione di destinazione non contiene alcun file CODEOWNERS.',
    'forms.footer.createServiceNowTicket': 'Crea un ticket ServiceNow',
    'forms.footer.createServiceNowTickets': 'Crea ticket ServiceNow',
    'forms.footer.createPullRequest': 'Crea richiesta pull',
    'forms.footer.createPullRequests': 'Crea richieste pull',
    'forms.footer.selectRepositoryTooltip':
      'Selezionare un repository da importare.',
    'forms.footer.serviceNowTooltip':
      'È necessario generare i file catalog-info.yaml prima di creare un ticket ServiceNow',
    'forms.footer.importTooltip':
      "Per l'importazione è necessario generare i file Catalog-info.yaml.",
    'forms.footer.pullRequestTooltip':
      'È necessario generare i file catalog-info.yaml prima di creare una richiesta pull',
    'tasks.tasksFor': 'Attività per {{importJobStatusId}}',
    'tasks.taskId': 'ID attività',
    'tasks.taskLink': 'Collegamento attività',
    'tasks.viewTask': 'Visualizza attività',
    'tasks.taskCancelled': 'Attività annullata',
    'tasks.taskCompleted': 'Attività completata',
    'tasks.taskFailed': 'Attività non riuscita',
    'tasks.taskOpen': 'Attività aperta',
    'tasks.taskProcessing': 'Elaborazione delle attività',
    'tasks.taskSkipped': 'Attività ignorata',
    'workflows.workflowsFor': 'Flussi di lavoro per {{importJobStatusId}}',
    'workflows.workflowId': 'ID flusso di lavoro',
    'workflows.workflowLink': 'Collegamento flusso di lavoro',
    'workflows.viewWorkflow': 'Visualizza flusso di lavoro',
    'workflows.workflowPending': 'In attesa',
    'workflows.workflowActive': 'Attivo',
    'workflows.workflowCompleted': 'Completato',
    'workflows.workflowAborted': 'Interrotto',
    'workflows.workflowError': 'Errore',
    'workflows.workflowSuspended': 'Sospeso',
    'workflows.workflowFetchError':
      'Errore durante il recupero del flusso di lavoro',
    'importActions.loading': 'Caricamento...',
    'importActions.errorFetchingData': 'Errore durante il recupero dei dati',
    'importActions.noActions':
      'Nessuna azione di importazione trovata per questo repository.',
  },
});

export default bulkImportTranslationIt;
