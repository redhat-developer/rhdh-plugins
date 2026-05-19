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
    'addRepositories.addSelected': 'Aggiungi selezionati',
    'addRepositories.allRepositoriesAdded':
      'Tutti i repository sono stati aggiunti',
    'addRepositories.approvalTool.description':
      'Scegli lo strumento di controllo della sorgente per la creazione della pull request',
    'addRepositories.approvalTool.github': 'GitHub',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.approvalTool.title':
      'Strumento di controllo della sorgente',
    'addRepositories.approvalTool.tooltip':
      "L'importazione richiede un'autorizzazione. Una volta approvata la richiesta pull, i repository verranno importati nella pagina del Catalogo.",
    'addRepositories.clearSearch': 'cancella ricerca',
    'addRepositories.editPullRequest': 'Modifica richiesta pull',
    'addRepositories.generateCatalogInfo': 'Genera catalog-info.yaml',
    'addRepositories.noRepositoriesFound': 'Nessun repository trovato',
    'addRepositories.noSelection': 'Nessuno',
    'addRepositories.preview': 'Anteprima',
    'addRepositories.repositoryType.group': 'Gruppo',
    'addRepositories.repositoryType.organization': 'Organizzazione',
    'addRepositories.repositoryType.project': 'Progetto',
    'addRepositories.repositoryType.repository': 'Repository',
    'addRepositories.repositoryType.title': 'Tipo di repository',
    'addRepositories.searchPlaceholder': 'Ricerca',
    'addRepositories.selectRepositories': 'Seleziona repository',
    'addRepositories.selectedCount': '{{count}} selezionati',
    'addRepositories.selectedLabel': 'Selezionato',
    'addRepositories.selectedProjects': 'progetti',
    'addRepositories.selectedRepositories': 'repository',
    'catalogInfo.status.generating': 'Generazione',
    'common.add': 'Aggiungi',
    'common.cancel': 'Annulla',
    'common.close': 'Chiudi',
    'common.delete': 'Elimina',
    'common.documentation': 'Documentazione',
    'common.edit': 'Modifica',
    'common.filter': 'Filtro',
    'common.import': 'Importa',
    'common.remove': 'Rimuovi',
    'common.save': 'Salva',
    'common.select': 'Seleziona',
    'common.update': 'Aggiorna',
    'common.view': 'Visualizza',
    'errors.addIntegrationsToConfig':
      'Per risolvere questo problema, assicurati che le integrazioni siano aggiunte al file di configurazione di Backstage (app-config.yaml).',
    'errors.catalogEntityConflict':
      "Impossibile creare una nuova RP a causa di un conflitto con un'entità del catalogo.",
    'errors.catalogInfoExists':
      "Poiché catalog-info.yaml esiste già nel repository, non verrà creata una nuova RP. Tuttavia, l'entità sarà comunque registrata nella pagina del catalogo.",
    'errors.codeOwnersNotFound':
      'Il file CODEOWNERS non è presente nel repository. Aggiungi un file CODEOWNERS per creare una nuova RP.',
    'errors.errorOccurred': 'Si è verificato un errore',
    'errors.failedToCreatePullRequest': 'Impossibile creare la richiesta pull',
    'errors.noIntegrationsConfigured':
      "Non è configurata alcuna integrazione con GitHub o GitLab. Aggiungere almeno un'integrazione per utilizzare la funzione di importazione in blocco.",
    'errors.prErrorPermissions':
      'Impossibile creare una nuova RP a causa di autorizzazioni insufficienti. Contatta il tuo amministratore.',
    'errors.repoEmpty':
      'Impossibile creare una nuova RP poiché il repository è vuoto. Esegui il push del commit iniziale nel repository.',
    'forms.footer.createPullRequest': 'Crea richiesta pull',
    'forms.footer.createPullRequests': 'Crea richiesta pull',
    'forms.footer.createServiceNowTicket': 'Crea ticket ServiceNow',
    'forms.footer.createServiceNowTickets': 'Crea ticket ServiceNow',
    'forms.footer.importTooltip':
      'È necessario generare i file Catalog-info.yaml per poterli importare.',
    'forms.footer.pullRequestTooltip':
      'I file Catalog-info.yaml devono essere generati prima di creare una richiesta pull',
    'forms.footer.selectRepositoryTooltip':
      'Seleziona un repository da importare.',
    'forms.footer.serviceNowTooltip':
      'I file Catalog-info.yaml devono essere generati prima di creare un ticket ServiceNow',
    'importActions.errorFetchingData': "Errore nell'estrazione dei dati",
    'importActions.loading': 'Caricamento...',
    'importActions.noActions':
      'Nessuna azione di importazione trovata per questo repository.',
    'page.addRepositoriesSubtitle':
      'Aggiungi repository in Red Hat Developer Hub in 4 step',
    'page.addRepositoriesTitle': 'Aggiungi repository',
    'page.importEntitiesSubtitle': 'Importa in Red Hat Developer Hub',
    'page.importEntitiesTitle': 'Importa entità',
    'page.subtitle': 'Importa entità in Red Hat Developer Hub',
    'page.title': 'Importazione in blocco',
    'page.typeLink': 'Importazione in blocco',
    'permissions.addRepositoriesMessage':
      "Per aggiungere repository, contatta il tuo amministratore per ottenere l'autorizzazione `bulk.import`.",
    'permissions.title': 'Autorizzazione obbligatoria',
    'permissions.viewRepositoriesMessage':
      "Per visualizzare i repository aggiunti, contatta il tuo amministratore per ottenere l'autorizzazione `bulk.import`.",
    'previewFile.closeDrawer': 'Chiudi il cassetto',
    'previewFile.failedToCreatePR': 'Impossibile creare la RP',
    'previewFile.failedToFetchPR':
      'Impossibile estrarre la richiesta pull. Un nuovo YAML è stato generato di seguito.',
    'previewFile.invalidEntityYaml':
      "L'entità YAML nella tua richiesta pull non è valida (file vuoto oppure mancano apiVersion, kind o metadata.name). Un nuovo YAML è stato generato di seguito.",
    'previewFile.keyValuePlaceholder': 'key1: value2; key2: value2',
    'previewFile.prCreationUnsuccessful':
      'La creazione della pull request non è andata a buon fine per alcuni repository. Fai clic su "Modifica" per visualizzare il motivo.',
    'previewFile.preview': 'Anteprima',
    'previewFile.previewFile': 'Anteprima file',
    'previewFile.previewFiles': 'Anteprima file',
    'previewFile.pullRequest.annotations': 'Annotazioni',
    'previewFile.pullRequest.bodyLabel': 'Corpo {{tool}}',
    'previewFile.pullRequest.bodyPlaceholder':
      'Un testo descrittivo con supporto Markdown',
    'previewFile.pullRequest.codeOwnersWarning':
      "AVVISO: l'operazione potrebbe non riuscire se non viene trovato alcun file CODEOWNERS nella posizione di destinazione.",
    'previewFile.pullRequest.componentNameLabel': 'Nome del componente creato',
    'previewFile.pullRequest.componentNamePlaceholder': 'Nome componente',
    'previewFile.pullRequest.details': 'Dettagli {{tool}}',
    'previewFile.pullRequest.entityConfiguration': 'Configurazione entità',
    'previewFile.pullRequest.entityOwnerHelper':
      "Seleziona un proprietario dall'elenco oppure inserisci un riferimento a un Gruppo o a un Utente",
    'previewFile.pullRequest.entityOwnerLabel': 'Proprietario entità',
    'previewFile.pullRequest.entityOwnerPlaceholder': 'gruppi e utenti',
    'previewFile.pullRequest.labels': 'Etichette',
    'previewFile.pullRequest.loadingText': 'Caricamento gruppi e utenti',
    'previewFile.pullRequest.mergeRequest': 'Merge request',
    'previewFile.pullRequest.previewEntities': 'Anteprima entità',
    'previewFile.pullRequest.serviceNowTicket': 'Ticket ServiceNow',
    'previewFile.pullRequest.spec': 'Specifiche',
    'previewFile.pullRequest.title': 'richiesta pull',
    'previewFile.pullRequest.titleLabel': 'Titolo {{tool}}',
    'previewFile.pullRequest.titlePlaceholder':
      'Aggiungi i file descrittori delle entità del catalogo Backstage',
    'previewFile.pullRequest.useCodeOwnersFile':
      'Utilizzare il file *CODEOWNERS* come Proprietario entità',
    'previewFile.pullRequestPendingApproval':
      'La [{{pullRequestText}}]({{pullRequestUrl}}) è in attesa di approvazione',
    'previewFile.pullRequestText': 'richiesta pull',
    'previewFile.useSemicolonSeparator':
      'Utilizzare il punto e virgola per separare {{label}}',
    'previewFile.viewRepository': 'Visualizza repository',
    'repositories.addedRepositories': 'Repository aggiunti',
    'repositories.addedRepositoriesCount': 'Repository aggiunti ({{count}})',
    'repositories.cannotRemoveRepositoryUrl':
      "Impossibile rimuovere il repository poiché manca l'URL del repository.",
    'repositories.deleteRepository': 'Elimina repository',
    'repositories.editCatalogInfoTooltip':
      'Modifica la richiesta pull di catalog-info.yaml',
    'repositories.errorOccured': 'Si è verificato un errore',
    'repositories.errorOccuredWhileFetching':
      "Si è verificato un errore durante l'estrazione della richiesta pull",
    'repositories.failedToCreatePullRequest':
      'Impossibile creare la richiesta pull',
    'repositories.import': 'Importa',
    'repositories.importedEntities': 'Entità importate',
    'repositories.importedEntitiesCount': 'Entità importate ({{count}})',
    'repositories.noProjectsFound':
      "Nessun progetto disponibile per l'importazione.",
    'repositories.noRecordsFound':
      "Nessun repository disponibile per l'importazione.",
    'repositories.pr': 'RP',
    'repositories.refresh': 'Aggiorna',
    'repositories.removeRepositoryQuestion':
      'Rimuovere {{repoName}} {{repositoryText}}?',
    'repositories.removeRepositoryWarning':
      'La rimozione di un repository comporta la cancellazione di tutte le informazioni associate dalla pagina del Catalogo.',
    'repositories.removeRepositoryWarningGitlab':
      'Rimuovendolo, tutte le informazioni associate verranno cancellate dalla pagina del Catalogo.',
    'repositories.removeRepositoryWarningOrchestrator':
      "Elimina il repository e le informazioni relative al flusso di lavoro dell'orchestratore.",
    'repositories.removeRepositoryWarningScaffolder':
      'La rimozione di un repository comporterà anche la rimozione di tutte le informazioni relative alle attività di scaffolding.',
    'repositories.removeTooltipDisabled':
      "Questo repository è stato aggiunto al file di configurazione dell'app. Per rimuoverlo, modifica direttamente il file",
    'repositories.removeTooltipRepositoryOrchestrator':
      "Elimina il repository e le informazioni relative al flusso di lavoro dell'orchestratore",
    'repositories.removeTooltipRepositoryScaffolder':
      'Elimina il repository e le informazioni relative alle attività di scaffolding',
    'repositories.removing': 'Rimozione...',
    'repositories.repositoryText': 'repository',
    'repositories.unableToRemoveRepository':
      'Impossibile rimuovere il repository. {{error}}',
    'repositories.viewCatalogInfoTooltip':
      'Visualizza il file catalog-info.yaml',
    'sidebar.bulkImport': 'Importazione in blocco',
    'status.added': 'Aggiunta',
    'status.alreadyImported': 'Già importata',
    'status.failedCreatingPR': 'Impossibile creare la RP',
    'status.imported': 'Importata',
    'status.missingConfigurations': 'Configurazioni mancanti',
    'status.pullRequestRejected': 'richiesta pull rifiutata',
    'status.readyToImport': "Pronta per l'importazione",
    'status.waitingForApproval': 'In attesa di approvazione',
    'status.waitingForPullRequestToStart':
      'In attesa che la richiesta pull inizi',
    'steps.chooseApprovalTool':
      'Scegli uno strumento di controllo della sorgente per la creazione delle richiesta pull',
    'steps.chooseItems': 'Scegli gli elementi che desideri importare',
    'steps.chooseRepositories': 'Scegli gli elementi che desideri importare',
    'steps.editPullRequest': 'Visualizza i dettagli della pull/merge request',
    'steps.generateCatalogInfo':
      'Genera un file catalog-info.yaml per ogni elemento selezionato',
    'steps.generateCatalogInfoItems':
      'Genera un file catalog-info.yaml per ogni elemento selezionato',
    'steps.trackStatus': 'Monitora lo stato di approvazione',
    'table.headers.actions': 'Azioni',
    'table.headers.catalogInfoYaml': 'catalog-info.yaml',
    'table.headers.group': 'Gruppo',
    'table.headers.lastUpdated': 'Ultimo aggiornamento',
    'table.headers.name': 'Nome',
    'table.headers.organization': 'Organizzazione',
    'table.headers.organizationGroup': 'Organizzazione/gruppo',
    'table.headers.repoUrl': 'URL repository',
    'table.headers.status': 'Stato',
    'table.headers.taskStatus': "Stato dell'attività",
    'table.headers.url': 'URL',
    'table.pagination.rows10': '10 righe',
    'table.pagination.rows100': '100 righe',
    'table.pagination.rows20': '20 righe',
    'table.pagination.rows5': '5 righe',
    'table.pagination.rows50': '50 righe',
    'tasks.taskCancelled': 'Annullato',
    'tasks.taskCompleted': 'Completato',
    'tasks.taskFailed': 'Non riuscito',
    'tasks.taskId': 'ID attività',
    'tasks.taskLink': 'Link attività',
    'tasks.taskOpen': 'Apri',
    'tasks.taskProcessing': 'Elaborazione',
    'tasks.taskSkipped': 'Saltato',
    'tasks.tasksFor': 'Attività per {{importJobStatusId}}',
    'tasks.viewTask': 'Visualizza attività',
    'time.daysAgo': '{{count}} giorno/i fa',
    'time.hoursAgo': '{{count}} ora/e fa',
    'time.minutesAgo': '{{count}} minuto/i fa',
    'time.secondsAgo': '{{count}} secondo/i fa',
    'validation.componentNameInvalid':
      '"{{value}}" non è valido; è prevista una stringa composta da sequenze di [a-zA-Z0-9] separate da uno qualsiasi di [-_.], per un massimo di 63 caratteri in totale. Scopri di più sul formato dei file del catalogo visitando la pagina https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md',
    'validation.componentNameRequired': 'Il nome del componente è obbligatorio',
    'validation.descriptionRequired':
      'La descrizione di {{approvalTool}} è obbligatoria',
    'validation.entityOwnerRequired':
      "Il proprietario dell'entità è obbligatorio",
    'validation.keyValuePairFormat':
      'Ogni voce deve avere una chiave e un valore separati da due punti.',
    'validation.titleRequired': 'Il titolo di {{approvalTool}} è obbligatorio',
    'workflows.viewWorkflow': 'Visualizza flusso di lavoro',
    'workflows.workflowAborted': 'Interrotto',
    'workflows.workflowActive': 'Attivo',
    'workflows.workflowCompleted': 'Completato',
    'workflows.workflowError': 'Errore',
    'workflows.workflowFetchError': 'Errore estrazione flusso di lavoro',
    'workflows.workflowId': 'ID flusso di lavoro',
    'workflows.workflowLink': 'Link flusso di lavoro',
    'workflows.workflowPending': 'In sospeso',
    'workflows.workflowSuspended': 'Sospeso',
    'workflows.workflowsFor': 'Flussi di lavoro per {{importJobStatusId}}',
  },
});

export default bulkImportTranslationIt;
