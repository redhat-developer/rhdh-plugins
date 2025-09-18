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

const bulkImportTranslationDe = createTranslationMessages({
  ref: bulkImportTranslationRef,
  messages: {
    // Page titles and subtitles
    'page.title': 'Massen-Import',
    'page.subtitle': 'Entitäten in Red Hat Developer Hub importieren',
    'page.addRepositoriesTitle': 'Repositories hinzufügen',
    'page.importEntitiesTitle': 'Entitäten importieren',
    'page.addRepositoriesSubtitle':
      'Repositories in 4 Schritten zum Red Hat Developer Hub hinzufügen',
    'page.importEntitiesSubtitle': 'In Red Hat Developer Hub importieren',
    'page.typeLink': 'Massen-Import',

    // Sidebar
    'sidebar.bulkImport': 'Massen-Import',

    // Permissions
    'permissions.title': 'Berechtigung erforderlich',
    'permissions.addRepositoriesMessage':
      'Um Repositories hinzuzufügen, wenden Sie sich an Ihren Administrator, damit er Ihnen die `bulk.import`-Berechtigung erteilt.',
    'permissions.viewRepositoriesMessage':
      'Um die hinzugefügten Repositories anzuzeigen, wenden Sie sich an Ihren Administrator, damit er Ihnen die `bulk.import`-Berechtigung erteilt.',

    // Repositories
    'repositories.addedRepositories': 'Hinzugefügte Repositories',
    'repositories.importedEntities': 'Importierte Entitäten',
    'repositories.addedRepositoriesCount':
      'Hinzugefügte Repositories ({{count}})',
    'repositories.importedEntitiesCount': 'Importierte Entitäten ({{count}})',
    'repositories.noRecordsFound': 'Keine Datensätze gefunden',
    'repositories.refresh': 'Aktualisieren',
    'repositories.import': 'Importieren',
    'repositories.removing': 'Wird entfernt...',
    'repositories.deleteRepository': 'Repository löschen',
    'repositories.removeRepositoryQuestion':
      '{{repoName}} {{repositoryText}} entfernen?',
    'repositories.repositoryText': 'Repository',
    'repositories.removeRepositoryWarning':
      'Das Entfernen von {{action}} löscht alle zugehörigen Informationen von der Katalogseite.',
    'repositories.removeAction': 'einem Repository',
    'repositories.removeActionGitlab': 'es wird',
    'repositories.cannotRemoveRepositoryUrl':
      'Repository kann nicht entfernt werden, da die Repository-URL fehlt.',
    'repositories.unableToRemoveRepository':
      'Repository kann nicht entfernt werden. {{error}}',
    'repositories.removeTooltipDisabled':
      'Dieses Repository wurde zur app-config-Datei hinzugefügt. Um es zu entfernen, ändern Sie die Datei direkt.',
    'repositories.errorOccuredWhileFetching':
      'Fehler beim Abrufen der Pull-Request aufgetreten',
    'repositories.failedToCreatePullRequest':
      'Pull-Request konnte nicht erstellt werden',
    'repositories.errorOccured': 'Fehler aufgetreten',
    'repositories.editCatalogInfoTooltip':
      'catalog-info.yaml Pull-Request bearbeiten',
    'repositories.viewCatalogInfoTooltip': 'catalog-info.yaml Datei anzeigen',
    'repositories.pr': 'PR',

    // Status keys used by getImportStatus function
    'status.alreadyImported': 'Bereits importiert',
    'status.added': 'Hinzugefügt',
    'status.waitingForApproval': 'Warten auf Genehmigung',
    'status.imported': 'Importiert',

    // Table headers
    'table.headers.name': 'Name',
    'table.headers.url': 'URL',
    'table.headers.repoUrl': 'Repository-URL',
    'table.headers.organization': 'Organisation',
    'table.headers.organizationGroup': 'Organisation/Gruppe',
    'table.headers.group': 'Gruppe',
    'table.headers.status': 'Status',
    'table.headers.lastUpdated': 'Zuletzt aktualisiert',
    'table.headers.actions': 'Aktionen',
    'table.headers.catalogInfoYaml': 'catalog-info.yaml',

    // Steps
    'steps.chooseApprovalTool':
      'Genehmigungstool (GitHub/GitLab) für PR-Erstellung auswählen',
    'steps.chooseRepositories':
      'Repositories auswählen, die Sie hinzufügen möchten',
    'steps.chooseItems': 'Elemente auswählen, die Sie importieren möchten',
    'steps.generateCatalogInfo':
      'Eine catalog-info.yaml-Datei für jedes Repository generieren',
    'steps.generateCatalogInfoItems':
      'Eine catalog-info.yaml-Datei für jedes ausgewählte Element generieren',
    'steps.editPullRequest': 'Pull-Request-Details bei Bedarf bearbeiten',
    'steps.trackStatus': 'Genehmigungsstatus verfolgen',

    // Add repositories
    'addRepositories.approvalTool.title': 'Genehmigungstool',
    'addRepositories.approvalTool.description':
      'Genehmigungstool für PR-Erstellung auswählen',
    'addRepositories.approvalTool.tooltip':
      'Der Import erfordert eine Genehmigung. Nach der Genehmigung der Pull-/Merge-Anfrage werden die Repositories/Projekte auf die Katalogseite importiert.',
    'addRepositories.approvalTool.github': 'GitHub',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.repositoryType.title': 'Repository-Typ',
    'addRepositories.repositoryType.repository': 'Repository',
    'addRepositories.repositoryType.organization': 'Organisation',
    'addRepositories.repositoryType.project': 'Projekt',
    'addRepositories.repositoryType.group': 'Gruppe',
    'addRepositories.searchPlaceholder': 'Suchen',
    'addRepositories.clearSearch': 'Suche löschen',
    'addRepositories.noRepositoriesFound': 'Keine Repositories gefunden',
    'addRepositories.allRepositoriesAdded':
      'Alle Repositories wurden hinzugefügt',
    'addRepositories.noSelection': 'Keine',
    'addRepositories.selectRepositories': 'Repositories auswählen',
    'addRepositories.selectedRepositories': 'Repositories',
    'addRepositories.selectedProjects': 'Projekte',
    'addRepositories.selectedLabel': 'Ausgewählt',
    'addRepositories.selectedCount': '{{count}} ausgewählt',
    'addRepositories.addSelected': 'Ausgewählte hinzufügen',
    'addRepositories.generateCatalogInfo': 'catalog-info.yaml generieren',
    'addRepositories.editPullRequest': 'Pull-Request bearbeiten',
    'addRepositories.preview': 'Vorschau',

    // Catalog info status
    'catalogInfo.status.generating': 'Generierung',
    'catalogInfo.status.notGenerated': 'Nicht generiert',

    // Preview file

    // Common
    'common.add': 'Hinzufügen',
    'common.cancel': 'Abbrechen',
    'common.close': 'Schließen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.filter': 'Filtern',
    'common.import': 'Importieren',
    'common.remove': 'Entfernen',
    'common.save': 'Speichern',
    'common.select': 'Auswählen',
    'common.update': 'Aktualisieren',
    'common.view': 'Anzeigen',

    // Time
    'time.daysAgo': 'vor {{count}} Tag(en)',
    'time.hoursAgo': 'vor {{count}} Stunde(n)',
    'time.minutesAgo': 'vor {{count}} Minute(n)',
    'time.secondsAgo': 'vor {{count}} Sekunde(n)',

    // Preview File
    'previewFile.readyToImport': 'Bereit zum Import',
    'previewFile.previewFile': 'Datei-Vorschau',
    'previewFile.previewFiles': 'Dateien-Vorschau',
    'previewFile.failedToCreatePR': 'PR-Erstellung fehlgeschlagen',
    'previewFile.prCreationUnsuccessful':
      'PR-Erstellung war für einige Repositories nicht erfolgreich. Klicken Sie auf `Bearbeiten`, um den Grund zu sehen.',
    'previewFile.failedToFetchPR':
      'Pull-Request konnte nicht abgerufen werden. Eine neue YAML wurde unten generiert.',
    'previewFile.invalidEntityYaml':
      'Die Entitäts-YAML in Ihrem Pull-Request ist ungültig (leere Datei oder fehlende apiVersion, kind oder metadata.name). Eine neue YAML wurde unten generiert.',
    'previewFile.pullRequestPendingApprovalPrefix': 'Der',
    'previewFile.pullRequestPendingApprovalSuffix': 'wartet auf Genehmigung',
    'previewFile.pullRequestText': 'Pull-Request',
    'previewFile.viewRepository': 'Repository anzeigen',
    'previewFile.closeDrawer': 'Schublade schließen',
    'previewFile.keyValuePlaceholder': 'schlüssel1: wert1; schlüssel2: wert2',
    'previewFile.useSemicolonSeparator':
      'Verwenden Sie Semikolon zur Trennung von {{label}}',
    'previewFile.preview': 'Vorschau',
    'previewFile.pullRequest.title': 'Pull-Request',
    'previewFile.pullRequest.mergeRequest': 'Merge-Request',
    'previewFile.pullRequest.serviceNowTicket': 'ServiceNow-Ticket',
    'previewFile.pullRequest.details': '{{tool}} Details',
    'previewFile.pullRequest.titleLabel': '{{tool}} Titel',
    'previewFile.pullRequest.bodyLabel': '{{tool}} Inhalt',
    'previewFile.pullRequest.titlePlaceholder':
      'Backstage-Katalog-Entitätsdeskriptor-Dateien hinzufügen',
    'previewFile.pullRequest.bodyPlaceholder':
      'Ein beschreibender Text mit Markdown-Unterstützung',
    'previewFile.pullRequest.entityConfiguration': 'Entitätskonfiguration',
    'previewFile.pullRequest.componentNameLabel':
      'Name der erstellten Komponente',
    'previewFile.pullRequest.componentNamePlaceholder': 'Komponentenname',
    'previewFile.pullRequest.entityOwnerLabel': 'Entitätsbesitzer',
    'previewFile.pullRequest.entityOwnerPlaceholder': 'Gruppen und Benutzer',
    'previewFile.pullRequest.entityOwnerHelper':
      'Wählen Sie einen Besitzer aus der Liste oder geben Sie eine Referenz zu einer Gruppe oder einem Benutzer ein',
    'previewFile.pullRequest.loadingText': 'Lade Gruppen und Benutzer',
    'previewFile.pullRequest.previewEntities': 'Entitäten-Vorschau',
    'previewFile.pullRequest.annotations': 'Anmerkungen',
    'previewFile.pullRequest.labels': 'Labels',
    'previewFile.pullRequest.spec': 'Spezifikation',
    'previewFile.pullRequest.useCodeOwnersFile':
      'Verwende CODEOWNERS-Datei als Entitätsbesitzer',
    'previewFile.pullRequest.codeOwnersWarning':
      'WARNUNG: Dies kann fehlschlagen, wenn keine CODEOWNERS-Datei am Zielort gefunden wird.',

    // Errors
    'errors.errorOccurred': 'Fehler aufgetreten',
    'errors.failedToCreatePullRequest':
      'Pull-Request konnte nicht erstellt werden',

    // Forms
    'forms.footer.createServiceNowTicket': 'ServiceNow-Ticket erstellen',
    'forms.footer.createServiceNowTickets': 'ServiceNow-Tickets erstellen',
    'forms.footer.createPullRequest': 'Pull-Request erstellen',
    'forms.footer.createPullRequests': 'Pull-Requests erstellen',
    'forms.footer.serviceNowTooltip':
      'Catalog-info.yaml-Dateien müssen vor der Erstellung eines ServiceNow-Tickets generiert werden',
    'forms.footer.importTooltip':
      'Die Catalog-info.yaml-Dateien müssen für den Import generiert werden.',
    'forms.footer.pullRequestTooltip':
      'Catalog-info.yaml-Dateien müssen vor der Erstellung eines Pull-Requests generiert werden',

    // Table pagination (keeping for compatibility)
    'table.pagination.rows5': '5 Zeilen',
    'table.pagination.rows10': '10 Zeilen',
    'table.pagination.rows20': '20 Zeilen',
    'table.pagination.rows50': '50 Zeilen',
    'table.pagination.rows100': '100 Zeilen',
  },
});

export default bulkImportTranslationDe;
