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

    // Pagination
    'pagination.rows5': '5 Zeilen',
    'pagination.rows10': '10 Zeilen',
    'pagination.rows20': '20 Zeilen',
    'pagination.rows50': '50 Zeilen',
    'pagination.rows100': '100 Zeilen',
    'pagination.noRecordsFound': 'Keine Datensätze gefunden',

    // Repositories
    'repositories.addedRepositories': 'Hinzugefügte Repositories',
    'repositories.importedEntities': 'Importierte Entitäten',
    'repositories.addedRepositoriesCount':
      'Hinzugefügte Repositories ({{count}})',
    'repositories.importedEntitiesCount': 'Importierte Entitäten ({{count}})',
    'repositories.noRecordsFound': 'Keine Datensätze gefunden',
    'repositories.refresh': 'Aktualisieren',
    'repositories.import': 'Importieren',
    'repositories.add': 'Hinzufügen',
    'repositories.remove': 'Entfernen',
    'repositories.cancel': 'Abbrechen',
    'repositories.removing': 'Wird entfernt...',
    'repositories.close': 'Schließen',
    'repositories.delete': 'Löschen',
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
    'repositories.removeTooltip': 'Entfernen',
    'repositories.removeTooltipDisabled':
      'Dieses Repository wurde zur app-config-Datei hinzugefügt. Um es zu entfernen, ändern Sie die Datei direkt.',
    'repositories.errorOccuredWhileFetching':
      'Fehler beim Abrufen der Pull-Request aufgetreten',
    'repositories.failedToCreatePullRequest':
      'Pull-Request konnte nicht erstellt werden',
    'repositories.errorOccured': 'Fehler aufgetreten',
    'repositories.update': 'Aktualisieren',
    'repositories.view': 'Anzeigen',
    'repositories.editCatalogInfoTooltip':
      'catalog-info.yaml Pull-Request bearbeiten',
    'repositories.viewCatalogInfoTooltip': 'catalog-info.yaml Datei anzeigen',
    'repositories.waitingForApproval': 'Warten auf Genehmigung',
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

    // Table pagination
    'table.pagination.rows5': '5 Zeilen',
    'table.pagination.rows10': '10 Zeilen',
    'table.pagination.rows20': '20 Zeilen',
    'table.pagination.rows50': '50 Zeilen',
    'table.pagination.rows100': '100 Zeilen',

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
    'addRepositories.cancel': 'Abbrechen',
    'addRepositories.add': 'Hinzufügen',
    'addRepositories.addSelected': 'Ausgewählte hinzufügen',
    'addRepositories.generateCatalogInfo': 'catalog-info.yaml generieren',
    'addRepositories.editPullRequest': 'Pull-Request bearbeiten',
    'addRepositories.preview': 'Vorschau',
    'addRepositories.close': 'Schließen',
    'addRepositories.save': 'Speichern',
    'addRepositories.delete': 'Löschen',
    'addRepositories.sync': 'Synchronisieren',
    'addRepositories.edit': 'Bearbeiten',
    'addRepositories.refresh': 'Aktualisieren',
    'addRepositories.back': 'Zurück',
    'addRepositories.next': 'Weiter',
    'addRepositories.submit': 'Absenden',
    'addRepositories.loading': 'Wird geladen...',
    'addRepositories.error': 'Fehler',
    'addRepositories.success': 'Erfolg',
    'addRepositories.warning': 'Warnung',
    'addRepositories.info': 'Information',

    // Catalog info status
    'catalogInfo.status.generating': 'Generierung',
    'catalogInfo.status.notGenerated': 'Nicht generiert',
    'catalogInfo.status.added': 'Hinzugefügt',
    'catalogInfo.status.pending': 'Ausstehend',
    'catalogInfo.status.failed': 'Fehlgeschlagen',
    'catalogInfo.status.prOpened': 'PR geöffnet',
    'catalogInfo.status.waitingForApproval': 'Warten auf Genehmigung',
    'catalogInfo.status.approved': 'Genehmigt',

    // Catalog info actions
    'catalogInfo.actions.edit': 'catalog-info.yaml bearbeiten',
    'catalogInfo.actions.delete': 'Repository entfernen',
    'catalogInfo.actions.sync': 'Repository synchronisieren',
    'catalogInfo.actions.view': 'catalog-info.yaml anzeigen',
    'catalogInfo.actions.createPr': 'Pull-Request erstellen',

    // Preview file

    // Pull request
    'pullRequest.createTitle': 'Pull-Request erstellen',
    'pullRequest.editTitle': 'Pull-Request bearbeiten',
    'pullRequest.descriptionLabel': 'Beschreibung',
    'pullRequest.branch': 'Branch',
    'pullRequest.targetBranch': 'Ziel-Branch',
    'pullRequest.sourceBranch': 'Quell-Branch',
    'pullRequest.defaultBranch': 'Standard-Branch',
    'pullRequest.prTitle': 'Pull-Request-Titel',
    'pullRequest.prDescription': 'Pull-Request-Beschreibung',
    'pullRequest.createPr': 'PR erstellen',
    'pullRequest.updatePr': 'PR aktualisieren',
    'pullRequest.viewPr': 'PR anzeigen',
    'pullRequest.waitingForPr': 'Warten auf PR',

    // Delete
    'delete.title': 'Repository entfernen?',
    'delete.message':
      'Sind Sie sicher, dass Sie dieses Repository aus dem Katalog entfernen möchten?',
    'delete.repositoryName': 'Repository: {{name}}',
    'delete.confirm': 'Entfernen',
    'delete.cancel': 'Abbrechen',
    'delete.success': 'Repository erfolgreich entfernt',
    'delete.error': 'Fehler beim Entfernen des Repositories',

    // Common
    'common.loading': 'Wird geladen...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    'common.warning': 'Warnung',
    'common.info': 'Information',
    'common.retry': 'Wiederholen',
    'common.refresh': 'Aktualisieren',
    'common.search': 'Suchen',
    'common.filter': 'Filtern',
    'common.clear': 'Löschen',
    'common.apply': 'Anwenden',
    'common.reset': 'Zurücksetzen',
    'common.export': 'Exportieren',
    'common.import': 'Importieren',
    'common.download': 'Herunterladen',
    'common.upload': 'Hochladen',
    'common.create': 'Erstellen',
    'common.update': 'Aktualisieren',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.close': 'Schließen',
    'common.open': 'Öffnen',
    'common.view': 'Anzeigen',
    'common.edit': 'Bearbeiten',
    'common.delete': 'Löschen',
    'common.remove': 'Entfernen',
    'common.add': 'Hinzufügen',
    'common.select': 'Auswählen',
    'common.selectAll': 'Alle auswählen',
    'common.deselectAll': 'Alle abwählen',
    'common.none': 'Keine',
    'common.all': 'Alle',
    'common.yes': 'Ja',
    'common.no': 'Nein',
    'common.ok': 'OK',
    'common.done': 'Fertig',
    'common.finish': 'Abschließen',
    'common.continue': 'Fortfahren',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.previous': 'Vorherige',
    'common.submit': 'Absenden',
    'common.send': 'Senden',
    'common.copy': 'Kopieren',
    'common.paste': 'Einfügen',
    'common.cut': 'Ausschneiden',
    'common.undo': 'Rückgängig',
    'common.redo': 'Wiederholen',

    // Time
    'time.daysAgo': 'vor {{count}} Tag(en)',
    'time.hoursAgo': 'vor {{count}} Stunde(n)',
    'time.minutesAgo': 'vor {{count}} Minute(n)',
    'time.secondsAgo': 'vor {{count}} Sekunde(n)',

    // Notifications
    'notifications.repositoryAdded': 'Repository erfolgreich hinzugefügt',
    'notifications.repositoryUpdated': 'Repository erfolgreich aktualisiert',
    'notifications.repositoryDeleted': 'Repository erfolgreich gelöscht',
    'notifications.catalogInfoUpdated': 'Katalog-Info erfolgreich aktualisiert',
    'notifications.pullRequestCreated': 'Pull-Request erfolgreich erstellt',
    'notifications.pullRequestUpdated': 'Pull-Request erfolgreich aktualisiert',
    'notifications.syncCompleted': 'Synchronisation erfolgreich abgeschlossen',
    'notifications.operationFailed': 'Operation fehlgeschlagen',
    'notifications.unexpectedError': 'Ein unerwarteter Fehler ist aufgetreten',
    'notifications.networkError':
      'Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.',
    'notifications.permissionDenied': 'Berechtigung verweigert',
    'notifications.notFound': 'Ressource nicht gefunden',
    'notifications.timeout': 'Anfrage-Timeout. Bitte versuchen Sie es erneut.',

    // Buttons
    'buttons.select': 'Auswählen',
    'buttons.cancel': 'Abbrechen',
    'buttons.create': 'Erstellen',
    'buttons.edit': 'Bearbeiten',
    'buttons.view': 'Anzeigen',
    'buttons.none': 'Keine',
    'buttons.import': 'Importieren',
    'buttons.save': 'Speichern',
    'buttons.close': 'Schließen',

    // Preview File
    'previewFile.edit': 'Bearbeiten',
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
  },
});

export default bulkImportTranslationDe;
