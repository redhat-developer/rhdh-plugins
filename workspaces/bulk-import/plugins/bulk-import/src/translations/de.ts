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
 * de translation for plugin.bulk-import.
 * @public
 */
const bulkImportTranslationDe = createTranslationMessages({
  ref: bulkImportTranslationRef,
  messages: {
    'addRepositories.addSelected': 'Ausgewählte hinzufügen',
    'addRepositories.allRepositoriesAdded': 'Alle Repositorys hinzugefügt',
    'addRepositories.approvalTool.description':
      'Quellcodeverwaltungstool für die PR-Erstellung auswählen',
    'addRepositories.approvalTool.github': 'GitHub',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.approvalTool.title': 'Quellcodeverwaltungstool',
    'addRepositories.approvalTool.tooltip':
      'Für den Import ist eine Genehmigung erforderlich. Nach Genehmigung des Pull Requests werden die Repositorys in die Katalogseite importiert.',
    'addRepositories.clearSearch': 'Suche löschen',
    'addRepositories.editPullRequest': 'Pull Request bearbeiten',
    'addRepositories.generateCatalogInfo': '„catalog-info.yaml“ generieren',
    'addRepositories.noRepositoriesFound': 'Keine Repositorys gefunden',
    'addRepositories.noSelection': 'Keine',
    'addRepositories.preview': 'Vorschau',
    'addRepositories.repositoryType.group': 'Gruppe',
    'addRepositories.repositoryType.organization': 'Organisation',
    'addRepositories.repositoryType.project': 'Projekt',
    'addRepositories.repositoryType.repository': 'Repository',
    'addRepositories.repositoryType.title': 'Repository-Typ',
    'addRepositories.searchPlaceholder': 'Suchen',
    'addRepositories.selectRepositories': 'Repositorys auswählen',
    'addRepositories.selectedCount': '{{count}} ausgewählt',
    'addRepositories.selectedLabel': 'Ausgewählt',
    'addRepositories.selectedProjects': 'Projekte',
    'addRepositories.selectedRepositories': 'Repositorys',
    'catalogInfo.status.generating': 'Wird generiert',
    'common.add': 'Hinzufügen',
    'common.cancel': 'Abbrechen',
    'common.close': 'Schließen',
    'common.delete': 'Löschen',
    'common.documentation': 'Dokumentation',
    'common.edit': 'Bearbeiten',
    'common.filter': 'Filter',
    'common.import': 'Importieren',
    'common.remove': 'Entfernen',
    'common.save': 'Speichern',
    'common.select': 'Auswählen',
    'common.update': 'Aktualisieren',
    'common.view': 'Anzeigen',
    'errors.addIntegrationsToConfig':
      'Um dieses Problem zu beheben, stellen Sie sicher, dass die Integrationen Ihrer Backstage-Konfigurationsdatei (app-config.yaml) hinzugefügt werden.',
    'errors.catalogEntityConflict':
      'Aufgrund eines Konflikts mit einer Katalog-Entity konnte kein neuer PR erstellt werden.',
    'errors.catalogInfoExists':
      'Da „catalog-info.yaml“ bereits im Repository vorhanden ist, wird kein neuer Pull Request erstellt. Die Entity wird jedoch weiterhin auf der Katalogseite registriert sein.',
    'errors.codeOwnersNotFound':
      'Die Datei CODEOWNERS fehlt im Repository. Fügen Sie eine CODEOWNERS-Datei hinzu, um einen neuen PR zu erstellen.',
    'errors.errorOccurred': 'Es ist ein Fehler aufgetreten',
    'errors.failedToCreatePullRequest':
      'Pull Request konnte nicht erstellt werden',
    'errors.noIntegrationsConfigured':
      'Es sind keine GitHub- oder GitLab-Integrationen konfiguriert. Fügen Sie mindestens eine Integration hinzu, um die Massenimportfunktion zu nutzen.',
    'errors.prErrorPermissions':
      'Aufgrund unzureichender Berechtigungen konnte kein neuer PR erstellt werden. Wenden Sie sich an Ihren Administrator.',
    'errors.repoEmpty':
      'Es konnte kein neuer Pull Request erstellt werden, da das Repository leer ist. Übertragen Sie einen ersten Commit an das Repository.',
    'forms.footer.createPullRequest': 'Pull Request erstellen',
    'forms.footer.createPullRequests': 'Pull Requests erstellen',
    'forms.footer.createServiceNowTicket': 'ServiceNow-Ticket erstellen',
    'forms.footer.createServiceNowTickets': 'ServiceNow-Tickets erstellen',
    'forms.footer.importTooltip':
      '„Catalog-info.yaml“-Dateien müssen für den Import generiert werden.',
    'forms.footer.pullRequestTooltip':
      '„Catalog-info.yaml“-Dateien müssen vor dem Erstellen eines Pull Requests generiert werden.',
    'forms.footer.selectRepositoryTooltip':
      'Wählen Sie ein Repository zum Importieren aus.',
    'forms.footer.serviceNowTooltip':
      '„Catalog-info.yaml“-Dateien müssen vor dem Erstellen eines ServiceNow-Tickets generiert werden.',
    'importActions.errorFetchingData': 'Fehler beim Abrufen der Daten',
    'importActions.loading': 'Wird geladen...',
    'importActions.noActions':
      'Für dieses Repository wurden keine Importaktionen gefunden.',
    'page.addRepositoriesSubtitle':
      'Repositorys in 4 Schritten zum Red Hat Developer Hub hinzufügen',
    'page.addRepositoriesTitle': 'Repositorys hinzufügen',
    'page.importEntitiesSubtitle': 'In Red Hat Developer Hub importieren',
    'page.importEntitiesTitle': 'Entitys importieren',
    'page.subtitle': 'Entitys in Red Hat Developer Hub importieren',
    'page.title': 'Massenimport',
    'page.typeLink': 'Massenimport',
    'permissions.addRepositoriesMessage':
      'Um Repositorys hinzuzufügen, wenden Sie sich an den Administrator, um die Berechtigung „bulk.import“ zu erhalten.',
    'permissions.title': 'Berechtigung erforderlich',
    'permissions.viewRepositoriesMessage':
      'Um die hinzugefügten Repositorys anzuzeigen, wenden Sie sich an den Administrator, um die Berechtigung „bulk.import“ zu erhalten.',
    'previewFile.closeDrawer': 'Schublade schließen',
    'previewFile.failedToCreatePR': 'Pull Request konnte nicht erstellt werden',
    'previewFile.failedToFetchPR':
      'Pull Request konnte nicht abgerufen werden. Unten wurde ein neues YAML generiert.',
    'previewFile.invalidEntityYaml':
      'Der YAML-Code der Entity in Ihrem Pull Request ist ungültig (leere Datei oder fehlende Werte für apiVersion, kind oder metadata.name). Unten wurde ein neues YAML generiert.',
    'previewFile.keyValuePlaceholder': 'Schlüssel1: Wert1; Schlüssel2: Wert2',
    'previewFile.prCreationUnsuccessful':
      'Die PR-Erstellung war für einige Repositorys nicht erfolgreich. Klicken Sie auf „Bearbeiten“, um den Grund anzuzeigen.',
    'previewFile.preview': 'Vorschau',
    'previewFile.previewFile': 'Vorschau der Datei',
    'previewFile.previewFiles': 'Vorschau der Dateien',
    'previewFile.pullRequest.annotations': 'Annotationen',
    'previewFile.pullRequest.bodyLabel': '{{tool}}-Textkörper',
    'previewFile.pullRequest.bodyPlaceholder':
      'Ein beschreibender Text mit Markdown-Unterstützung',
    'previewFile.pullRequest.codeOwnersWarning':
      'WARNUNG: Dies kann fehlschlagen, wenn am Zielort keine CODEOWNERS-Datei gefunden wird.',
    'previewFile.pullRequest.componentNameLabel':
      'Name der erstellten Komponente',
    'previewFile.pullRequest.componentNamePlaceholder': 'Komponentenname',
    'previewFile.pullRequest.details': '{{tool}}-Details',
    'previewFile.pullRequest.entityConfiguration': 'Entity-Konfiguration',
    'previewFile.pullRequest.entityOwnerHelper':
      'Wählen Sie einen Eigentümer aus der Liste oder geben Sie einen Verweis auf eine Gruppe oder einen Benutzer ein',
    'previewFile.pullRequest.entityOwnerLabel': 'Entity-Eigentümer',
    'previewFile.pullRequest.entityOwnerPlaceholder': 'Gruppen und Benutzer',
    'previewFile.pullRequest.labels': 'Bezeichnungen',
    'previewFile.pullRequest.loadingText':
      'Gruppen und Benutzer werden geladen',
    'previewFile.pullRequest.mergeRequest': 'Merge Request',
    'previewFile.pullRequest.previewEntities': 'Vorschau der Entitys',
    'previewFile.pullRequest.serviceNowTicket': 'ServiceNow-Ticket',
    'previewFile.pullRequest.spec': 'Spezifikation',
    'previewFile.pullRequest.title': 'Pull Request',
    'previewFile.pullRequest.titleLabel': '{{tool}}-Titel',
    'previewFile.pullRequest.titlePlaceholder':
      'Backstage-Katalog Entity-Beschreibungsdateien hinzufügen',
    'previewFile.pullRequest.useCodeOwnersFile':
      'Datei *CODEOWNERS* als Entity-Eigentümer verwenden',
    'previewFile.pullRequestPendingApproval':
      '[{{pullRequestText}}]({{pullRequestUrl}}) wartet auf Genehmigung',
    'previewFile.pullRequestText': 'Pull Request',
    'previewFile.useSemicolonSeparator':
      'Verwenden Sie ein Semikolon, um {{label}} zu trennen',
    'previewFile.viewRepository': 'Repository anzeigen',
    'repositories.addedRepositories': 'Hinzugefügte Repositorys',
    'repositories.addedRepositoriesCount':
      'Hinzugefügte Repositorys ({{count}})',
    'repositories.cannotRemoveRepositoryUrl':
      'Das Repository kann nicht entfernt werden, da die Repository-URL fehlt.',
    'repositories.deleteRepository': 'Repository löschen',
    'repositories.editCatalogInfoTooltip':
      'Pull Request zur Bearbeitung von „catalog-info.yaml“///',
    'repositories.errorOccured': 'Es ist ein Fehler aufgetreten',
    'repositories.errorOccuredWhileFetching':
      'Fehler beim Abrufen des Pull Requests',
    'repositories.failedToCreatePullRequest':
      'Pull Request konnte nicht erstellt werden',
    'repositories.import': 'Importieren',
    'repositories.importedEntities': 'Importierte Entitys',
    'repositories.importedEntitiesCount': 'Importierte Entitys ({{count}})',
    'repositories.noProjectsFound':
      'Es sind keine Projekte zum Importieren verfügbar.',
    'repositories.noRecordsFound':
      'Es sind keine Repositorys zum Importieren verfügbar.',
    'repositories.pr': 'PR',
    'repositories.refresh': 'Aktualisieren',
    'repositories.removeRepositoryQuestion':
      '{{repoName}} {{repositoryText}} entfernen?',
    'repositories.removeRepositoryWarning':
      'Durch Entfernen eines Repositorys werden auch alle zugehörigen Informationen von der Katalogseite gelöscht.',
    'repositories.removeRepositoryWarningGitlab':
      'Durch das Entfernen werden alle zugehörigen Informationen von der Katalogseite gelöscht.',
    'repositories.removeRepositoryWarningOrchestrator':
      'Repository und zugehörige Orchestrator-Workflow-Informationen löschen.',
    'repositories.removeRepositoryWarningScaffolder':
      'Durch Entfernen eines Repositorys werden auch alle zugehörigen Gerüstaufgabeninformationen entfernt.',
    'repositories.removeTooltipDisabled':
      'Dieses Repository wurde der App-Konfigurationsdatei hinzugefügt. Um es zu entfernen, bearbeiten Sie die Datei direkt',
    'repositories.removeTooltipRepositoryOrchestrator':
      'Repository und zugehörige Orchestrator-Workflow-Informationen löschen',
    'repositories.removeTooltipRepositoryScaffolder':
      'Repository und zugehörige Gerüstaufgabeninformationen löschen',
    'repositories.removing': 'Wird entfernt...',
    'repositories.repositoryText': 'Repository',
    'repositories.unableToRemoveRepository':
      'Repository konnte nicht entfernt werden. {{error}}',
    'repositories.viewCatalogInfoTooltip': '„catalog-info.yaml“-Datei anzeigen',
    'sidebar.bulkImport': 'Massenimport',
    'status.added': 'Hinzugefügt',
    'status.alreadyImported': 'Bereits importiert',
    'status.failedCreatingPR': 'Pull Request konnte nicht erstellt werden',
    'status.imported': 'Importiert',
    'status.missingConfigurations': 'Fehlende Konfigurationen',
    'status.pullRequestRejected': 'Pull Request abgelehnt',
    'status.readyToImport': 'Bereit zum Importieren',
    'status.waitingForApproval': 'Warten auf Genehmigung',
    'status.waitingForPullRequestToStart': 'Warten auf Start des Pull Requests',
    'steps.chooseApprovalTool':
      'Wählen Sie ein Quellcodeverwaltungstool für die Erstellung von Pull Requests aus',
    'steps.chooseItems':
      'Wählen Sie die Elemente aus, die importiert werden sollen.',
    'steps.chooseRepositories':
      'Wählen Sie die Elemente aus, die importiert werden sollen.',
    'steps.editPullRequest': 'Details zum Pull/Merge Request anzeigen',
    'steps.generateCatalogInfo':
      'Eine „catalog-info.yaml“-Datei für jedes ausgewählte Element erstellen',
    'steps.generateCatalogInfoItems':
      'Eine „catalog-info.yaml“-Datei für jedes ausgewählte Element erstellen',
    'steps.trackStatus': 'Genehmigungsstatus verfolgen',
    'table.headers.actions': 'Aktionen',
    'table.headers.catalogInfoYaml': 'catalog-info.yaml',
    'table.headers.group': 'Gruppe',
    'table.headers.lastUpdated': 'Letzte Aktualisierung',
    'table.headers.name': 'Name',
    'table.headers.organization': 'Organisation',
    'table.headers.organizationGroup': 'Organisation/Gruppe',
    'table.headers.repoUrl': 'Repo-URL',
    'table.headers.status': 'Status',
    'table.headers.taskStatus': 'Aufgabenstatus',
    'table.headers.url': 'URL',
    'table.pagination.rows10': '10 Zeilen',
    'table.pagination.rows100': '100 Zeilen',
    'table.pagination.rows20': '20 Zeilen',
    'table.pagination.rows5': '5 Zeilen',
    'table.pagination.rows50': '50 Zeilen',
    'tasks.taskCancelled': 'Storniert',
    'tasks.taskCompleted': 'Abgeschlossen',
    'tasks.taskFailed': 'Fehlgeschlagen',
    'tasks.taskId': 'Aufgaben-ID',
    'tasks.taskLink': 'Aufgabenverknüpfung',
    'tasks.taskOpen': 'Öffnen',
    'tasks.taskProcessing': 'Verarbeitung',
    'tasks.taskSkipped': 'Übersprungen',
    'tasks.tasksFor': 'Aufgaben für {{importJobStatusId}}',
    'tasks.viewTask': 'Aufgabe anzeigen',
    'time.daysAgo': 'Vor {{count}} Tag(en)',
    'time.hoursAgo': 'Vor {{count}} Stunde(n)',
    'time.minutesAgo': 'Vor {{count}} Minute(n)',
    'time.secondsAgo': 'Vor {{count}} Sekunde(n)',
    'validation.componentNameInvalid':
      '„{{value}}“ ist ungültig. Erwartet wird eine Zeichenkette, die aus Sequenzen von [a-zA-Z0-9] getrennt durch [-_.] besteht, mit insgesamt max. 63 Zeichen. Weitere Informationen zum Katalogdateiformat finden Sie unter: https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md',
    'validation.componentNameRequired': 'Komponentenname ist erforderlich.',
    'validation.descriptionRequired':
      'Beschreibung von {{approvalTool}} ist erforderlich.',
    'validation.entityOwnerRequired': 'Ein Entity-Eigentümer ist erforderlich.',
    'validation.keyValuePairFormat':
      'Jeder Eintrag muss einen Schlüssel und einen Wert getrennt durch einen Doppelpunkt enthalten.',
    'validation.titleRequired': 'Titel von {{approvalTool}} ist erforderlich.',
    'workflows.viewWorkflow': 'Workflow anzeigen',
    'workflows.workflowAborted': 'Abgebrochen',
    'workflows.workflowActive': 'Aktiv',
    'workflows.workflowCompleted': 'Abgeschlossen',
    'workflows.workflowError': 'Fehler',
    'workflows.workflowFetchError': 'Workflow-Abruffehler',
    'workflows.workflowId': 'Workflow-ID',
    'workflows.workflowLink': 'Workflow-Verknüpfung',
    'workflows.workflowPending': 'Ausstehend',
    'workflows.workflowSuspended': 'Ausgesetzt',
    'workflows.workflowsFor': 'Workflows für {{importJobStatusId}}',
  },
});

export default bulkImportTranslationDe;
