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
    'page.title': 'Massenimport',
    'page.subtitle': 'Elemente in Red Hat Developer Hub importieren',
    'page.addRepositoriesTitle': 'Repositorys hinzufügen',
    'page.importEntitiesTitle': 'Elemente importieren',
    'page.addRepositoriesSubtitle':
      'In 4 Schritten Repositorys zu Red Hat Developer Hub hinzufügen',
    'page.importEntitiesSubtitle': 'In Red Hat Developer Hub importieren',
    'page.typeLink': 'Massenimport',
    'sidebar.bulkImport': 'Massenimport',
    'permissions.title': 'Berechtigung erforderlich',
    'permissions.addRepositoriesMessage':
      "Zum Hinzufügen von Repositorys wenden Sie sich an den Administrator, um die Berechtigung 'bulk.import' zu erhalten.",
    'status.alreadyImported': 'Bereits importiert',
    'status.added': 'Hinzugefügt',
    'status.waitingForApproval': 'Warten auf Genehmigung',
    'status.imported': 'Importiert',
    'status.readyToImport': 'Bereit zum Importieren',
    'status.waitingForPullRequestToStart':
      'Warten auf Starten der Pull-Anforderung',
    'status.missingConfigurations': 'Fehlende Konfigurationen',
    'status.failedCreatingPR': 'Fehler beim Erstellen der Pull-Anforderung',
    'status.pullRequestRejected': 'Pull-Anforderung abgelehnt',
    'errors.prErrorPermissions':
      'Aufgrund unzureichender Berechtigungen konnte keine neue Pull-Anforderung erstellt werden. Wenden Sie sich an den Administrator.',
    'errors.catalogInfoExists':
      "Da 'catalog-info.yaml' bereits im Repository existiert, wird keine neue Pull-Anforderung erstellt. Das Element wird jedoch weiterhin auf der Katalogseite registriert sein.",
    'table.headers.name': 'Name',
    'table.headers.url': 'URL',
    'table.headers.repoUrl': 'Repository-URL',
    'table.headers.organization': 'Organisation',
    'table.headers.organizationGroup': 'Organisation/Gruppe',
    'table.headers.group': 'Gruppe',
    'table.headers.status': 'Status',
    'table.headers.taskStatus': 'Aufgabenstatus',
    'table.headers.lastUpdated': 'Letzte Aktualisierung',
    'table.headers.actions': 'Aktionen',
    'table.headers.catalogInfoYaml': 'catalog-info.yaml',
    'table.pagination.rows5': '5 Zeilen',
    'table.pagination.rows10': '10 Zeilen',
    'table.pagination.rows20': '20 Zeilen',
    'table.pagination.rows50': '50 Zeilen',
    'table.pagination.rows100': '100 Zeilen',
    'steps.chooseApprovalTool':
      'Wählen Sie ein Quellcodeverwaltungstool für die Erstellung von Pull-Anforderungen aus',
    'steps.chooseRepositories':
      'Wählen Sie die Elemente aus, die Sie importieren möchten',
    'steps.chooseItems':
      'Wählen Sie die Elemente aus, die Sie importieren möchten',
    'steps.generateCatalogInfo':
      "Für jedes ausgewählte Element eine 'catalog-info.yaml'-Datei generieren",
    'steps.generateCatalogInfoItems':
      "Für jedes ausgewählte Element eine 'catalog-info.yaml'-Datei generieren",
    'steps.editPullRequest': 'Details zur Pull-/Merge-Anforderung anzeigen',
    'steps.trackStatus': 'Genehmigungsstatus verfolgen',
    'addRepositories.approvalTool.title': 'Quellcodeverwaltungstool',
    'addRepositories.approvalTool.description':
      'Wählen Sie ein Quellcodeverwaltungstool für die Erstellung von Pull-Anforderungen aus',
    'addRepositories.approvalTool.tooltip':
      'Zum Importieren ist eine Genehmigung erforderlich. Nach Genehmigung der Pull-Anforderung werden die Repositorys in die Katalogseite importiert.',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.repositoryType.title': 'Repository-Typ',
    'addRepositories.repositoryType.repository': 'Repository',
    'addRepositories.repositoryType.organization': 'Organisation',
    'addRepositories.repositoryType.project': 'Projekt',
    'addRepositories.repositoryType.group': 'Gruppe',
    'addRepositories.searchPlaceholder': 'Suchen',
    'addRepositories.clearSearch': 'Suche löschen',
    'addRepositories.noRepositoriesFound': 'Keine Repositorys gefunden',
    'addRepositories.allRepositoriesAdded':
      'Alle Repositorys werden hinzugefügt',
    'addRepositories.noSelection': 'Keine',
    'addRepositories.selectRepositories': 'Repositorys auswählen',
    'addRepositories.selectedRepositories': 'Repositorys',
    'addRepositories.selectedProjects': 'Projekte',
    'addRepositories.selectedLabel': 'Ausgewählt',
    'addRepositories.selectedCount': '{{count}} ausgewählt',
    'addRepositories.addSelected': 'Ausgewählte hinzufügen',
    'addRepositories.generateCatalogInfo': "'catalog-info.yaml' generieren",
    'addRepositories.editPullRequest': 'Pull-Anforderung bearbeiten',
    'addRepositories.preview': 'Vorschau',
    'catalogInfo.status.generating': 'Generierung',
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
    'time.daysAgo': 'Vor {{count}} Tag(en)',
    'time.hoursAgo': 'Vor {{count}} Stunde(n)',
    'time.minutesAgo': 'Vor {{count}} Minute(n)',
    'time.secondsAgo': 'Vor {{count}} Sekunde(n)',
    'previewFile.previewFile': 'Vorschau der Datei anzeigen',
    'previewFile.previewFiles': 'Vorschau der Dateien anzeigen',
    'previewFile.failedToCreatePR':
      'Fehler beim Erstellen der Pull-Anforderung',
    'previewFile.prCreationUnsuccessful':
      "Die Erstellung der Pull-Anforderung war für einige Repositorys nicht erfolgreich. Klicken Sie auf 'Bearbeiten', um den Grund anzuzeigen.",
    'previewFile.failedToFetchPR':
      'Fehler beim Abrufen der Pull-Anforderung. Unten wurde eine neue YAML-Datei generiert.',
    'previewFile.invalidEntityYaml':
      "Die YAML-Datei des Elements in Ihrer Pull-Anforderung ist ungültig (leere Datei oder fehlende Werte für 'apiVersion', 'kind' oder 'metadata.name'). Unten wurde eine neue YAML-Datei generiert.",
    'previewFile.pullRequestText': 'Pull-Anforderung',
    'previewFile.viewRepository': 'Repository anzeigen',
    'previewFile.closeDrawer': 'Drawer schließen',
    'previewFile.keyValuePlaceholder': 'Schlüssel1: Wert2; Schlüssel2: Wert2',
    'previewFile.useSemicolonSeparator':
      'Verwenden Sie ein Semikolon zum Trennen von {{label}}',
    'previewFile.pullRequest.title': 'Pull-Anforderung',
    'previewFile.pullRequest.mergeRequest': 'Merge-Anforderung',
    'previewFile.pullRequest.serviceNowTicket': 'ServiceNow-Ticket',
    'previewFile.pullRequest.details': '{{tool}}-Details',
    'previewFile.pullRequest.titleLabel': '{{tool}}-Titel',
    'previewFile.pullRequest.bodyLabel': '{{tool}}-Text',
    'previewFile.pullRequest.titlePlaceholder':
      'Backstage-Katalogelement-Beschreibungsdateien hinzufügen',
    'previewFile.pullRequest.bodyPlaceholder':
      'Beschreibender Text mit Markdown-Unterstützung',
    'previewFile.pullRequest.entityConfiguration': 'Elementkonfiguration',
    'previewFile.pullRequest.componentNameLabel':
      'Name der erstellten Komponente',
    'previewFile.pullRequest.componentNamePlaceholder': 'Komponentenname',
    'previewFile.pullRequest.entityOwnerLabel': 'Elementeigentümer',
    'previewFile.pullRequest.entityOwnerPlaceholder': 'Gruppen und Benutzer',
    'previewFile.pullRequest.entityOwnerHelper':
      'Wählen Sie einen Eigentümer aus der Liste aus, oder geben Sie einen Verweis auf eine Gruppe oder einen Benutzer ein.',
    'previewFile.pullRequest.loadingText':
      'Gruppen und Benutzer werden geladen',
    'previewFile.pullRequest.previewEntities': 'Vorschau der Elemente anzeigen',
    'previewFile.pullRequest.annotations': 'Anmerkungen',
    'previewFile.pullRequest.labels': 'Bezeichnungen',
    'previewFile.pullRequest.spec': 'Spezifikation',
    'previewFile.pullRequest.useCodeOwnersFile':
      'Datei *CODEOWNERS* als Elementeigentümer verwenden',
    'previewFile.pullRequest.codeOwnersWarning':
      'WARNUNG: Dies kann fehlschlagen, wenn am Zielort keine CODEOWNERS-Datei gefunden wird.',
    'forms.footer.createServiceNowTicket': 'ServiceNow-Ticket erstellen',
    'forms.footer.createServiceNowTickets': 'ServiceNow-Tickets erstellen',
    'forms.footer.createPullRequest': 'Pull-Anforderung erstellen',
    'forms.footer.createPullRequests': 'Pull-Anforderungen erstellen',
    'forms.footer.selectRepositoryTooltip':
      'Wählen Sie ein Repository zum Importieren aus.',
    'forms.footer.serviceNowTooltip':
      "Die 'catalog-info.yaml'-Dateien müssen vor dem Erstellen eines ServiceNow-Tickets generiert werden.",
    'forms.footer.importTooltip':
      "Die 'catalog-info.yaml'-Dateien müssen für den Import generiert werden.",
    'forms.footer.pullRequestTooltip':
      "Die 'catalog-info.yaml'-Dateien müssen vor der Erstellung einer Pull-Anforderung generiert werden.",
    'tasks.tasksFor': 'Aufgaben für {{importJobStatusId}}',
    'tasks.taskLink': 'Aufgabenverknüpfung',
    'tasks.viewTask': 'Aufgabe anzeigen',
    'tasks.taskCancelled': 'Abgebrochen',
    'tasks.taskCompleted': 'Abgeschlossen',
    'tasks.taskFailed': 'Fehlgeschlagen',
    'tasks.taskOpen': 'Offen',
    'tasks.taskProcessing': 'In Verarbeitung',
    'tasks.taskSkipped': 'Übersprungen',
    'workflows.workflowsFor': 'Workflows für {{importJobStatusId}}',
    'workflows.workflowLink': 'Workflow-Verknüpfung',
    'workflows.viewWorkflow': 'Workflow anzeigen',
    'workflows.workflowPending': 'Ausstehend',
    'workflows.workflowActive': 'Aktiv',
    'workflows.workflowCompleted': 'Abgeschlossen',
    'workflows.workflowAborted': 'Abgebrochen',
    'workflows.workflowError': 'Fehler',
    'workflows.workflowFetchError': 'Fehler beim Abrufen des Workflows',
    'workflows.workflowSuspended': 'Ausgesetzt',
    'importActions.loading': 'Ladevorgang läuft...',
    'importActions.errorFetchingData': 'Fehler beim Abrufen der Daten',
    'importActions.noActions':
      'Für dieses Repository wurden keine Importaktionen gefunden.',
  },
});

export default bulkImportTranslationDe;
