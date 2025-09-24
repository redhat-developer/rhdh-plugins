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

const bulkImportTranslationFr = createTranslationMessages({
  ref: bulkImportTranslationRef,
  full: true,
  messages: {
    // Page titles and subtitles
    'page.title': 'Bulk import',
    'page.subtitle': 'Importer des entités dans Red Hat Developer Hub',
    'page.addRepositoriesTitle': 'Ajouter des dépôts',
    'page.importEntitiesTitle': 'Importer des entités',
    'page.addRepositoriesSubtitle':
      'Ajouter des dépôts à Red Hat Developer Hub en 4 étapes',
    'page.importEntitiesSubtitle': 'Importer dans Red Hat Developer Hub',
    'page.typeLink': 'Bulk import',

    // Sidebar
    'sidebar.bulkImport': 'Bulk import',

    // Permissions
    'permissions.title': 'Autorisation requise',
    'permissions.addRepositoriesMessage':
      "Pour ajouter des dépôts, contactez votre administrateur pour qu'il vous accorde l'autorisation `bulk.import`.",
    'permissions.viewRepositoriesMessage':
      "Pour voir les dépôts ajoutés, contactez votre administrateur pour qu'il vous accorde l'autorisation `bulk.import`.",

    // Repositories
    'repositories.addedRepositories': 'Dépôts ajoutés',
    'repositories.importedEntities': 'Entités importées',
    'repositories.addedRepositoriesCount': 'Dépôts ajoutés ({{count}})',
    'repositories.importedEntitiesCount': 'Entités importées ({{count}})',
    'repositories.noRecordsFound': 'Aucun enregistrement trouvé',
    'repositories.refresh': 'Actualiser',
    'repositories.import': 'Importer',
    'repositories.removing': 'Suppression en cours...',
    'repositories.deleteRepository': 'Supprimer le dépôt',
    'repositories.removeRepositoryQuestion':
      'Supprimer {{repoName}} {{repositoryText}} ?',
    'repositories.repositoryText': 'dépôt',
    'repositories.removeRepositoryWarning':
      "La suppression d'un dépôt efface toutes les informations associées de la page Catalogue.",
    'repositories.removeRepositoryWarningGitlab':
      'La suppression efface toutes les informations associées de la page Catalogue.',
    'repositories.cannotRemoveRepositoryUrl':
      "Impossible de supprimer le dépôt car l'URL du dépôt est manquante.",
    'repositories.unableToRemoveRepository':
      'Impossible de supprimer le dépôt. {{error}}',
    'repositories.removeTooltipDisabled':
      'Ce dépôt a été ajouté au fichier app-config. Pour le supprimer, modifiez directement le fichier.',
    'repositories.errorOccuredWhileFetching':
      'Erreur survenue lors de la récupération de la pull request',
    'repositories.failedToCreatePullRequest':
      'Échec de la création de la pull request',
    'repositories.errorOccured': 'Erreur survenue',
    'repositories.editCatalogInfoTooltip':
      'Modifier la pull request catalog-info.yaml',
    'repositories.viewCatalogInfoTooltip': 'Voir le fichier catalog-info.yaml',
    'repositories.pr': 'PR',

    // Status
    'status.alreadyImported': 'Déjà importé',
    'status.added': 'Ajouté',
    'status.waitingForApproval': "En attente d'approbation",
    'status.imported': 'Importé',

    // Validation
    'validation.componentNameInvalid':
      '"{{value}}" n\'est pas valide ; attendu une chaîne qui est des séquences de [a-zA-Z0-9] séparées par [-_.], au maximum 63 caractères au total. Pour en savoir plus sur le format de fichier de catalogue, visitez : https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md',
    'validation.componentNameRequired': 'Le nom du composant est requis',
    'validation.entityOwnerRequired': "Le propriétaire de l'entité est requis",
    'validation.titleRequired': 'Le titre {{approvalTool}} est requis',
    'validation.descriptionRequired':
      'La description {{approvalTool}} est requise',
    'validation.keyValuePairFormat':
      'Chaque entrée doit avoir une clé et une valeur séparées par deux-points.',

    // Table headers
    'table.headers.name': 'Nom',
    'table.headers.url': 'URL',
    'table.headers.repoUrl': 'URL du dépôt',
    'table.headers.organization': 'Organisation',
    'table.headers.organizationGroup': 'Organisation/groupe',
    'table.headers.group': 'Groupe',
    'table.headers.status': 'Statut',
    'table.headers.lastUpdated': 'Dernière mise à jour',
    'table.headers.actions': 'Actions',
    'table.headers.catalogInfoYaml': 'catalog-info.yaml',

    // Steps
    'steps.chooseApprovalTool':
      "Choisir l'outil d'approbation (GitHub/GitLab) pour la création de PR",
    'steps.chooseRepositories': 'Choisir les dépôts que vous voulez ajouter',
    'steps.chooseItems': 'Choisir les éléments que vous voulez importer',
    'steps.generateCatalogInfo':
      'Générer un fichier catalog-info.yaml pour chaque dépôt',
    'steps.generateCatalogInfoItems':
      'Générer un fichier catalog-info.yaml pour chaque élément sélectionné',
    'steps.editPullRequest':
      'Modifier les détails de la pull request si nécessaire',
    'steps.trackStatus': "Suivre le statut d'approbation",

    // Add repositories
    'addRepositories.approvalTool.title': "Outil d'approbation",
    'addRepositories.approvalTool.description':
      "Choisir l'outil d'approbation pour la création de PR",
    'addRepositories.approvalTool.tooltip':
      "L'importation nécessite une approbation. Après approbation de la pull/merge request, les dépôts/projets seront importés vers la page Catalogue.",
    'addRepositories.approvalTool.github': 'GitHub',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.repositoryType.title': 'Type de dépôt',
    'addRepositories.repositoryType.repository': 'Dépôt',
    'addRepositories.repositoryType.organization': 'Organisation',
    'addRepositories.repositoryType.project': 'Projet',
    'addRepositories.repositoryType.group': 'Groupe',
    'addRepositories.searchPlaceholder': 'Rechercher',
    'addRepositories.clearSearch': 'effacer la recherche',
    'addRepositories.noRepositoriesFound': 'Aucun dépôt trouvé',
    'addRepositories.allRepositoriesAdded': 'Tous les dépôts sont ajoutés',
    'addRepositories.noSelection': 'Aucun',
    'addRepositories.selectRepositories': 'Sélectionner des dépôts',
    'addRepositories.selectedRepositories': 'dépôts',
    'addRepositories.selectedProjects': 'projets',
    'addRepositories.selectedLabel': 'Sélectionnés',
    'addRepositories.selectedCount': '{{count}} sélectionné(s)',
    'addRepositories.addSelected': 'Ajouter la sélection',
    'addRepositories.generateCatalogInfo': 'Générer catalog-info.yaml',
    'addRepositories.editPullRequest': 'Modifier la pull request',
    'addRepositories.preview': 'Aperçu',

    // Catalog info status
    'catalogInfo.status.generating': 'Génération',
    'catalogInfo.status.notGenerated': 'Non généré',

    // Preview file

    // Common
    'common.add': 'Ajouter',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.filter': 'Filtrer',
    'common.import': 'Importer',
    'common.remove': 'Retirer',
    'common.save': 'Sauvegarder',
    'common.select': 'Sélectionner',
    'common.update': 'Mettre à jour',
    'common.view': 'Voir',

    // Time
    'time.daysAgo': 'il y a {{count}} jour(s)',
    'time.hoursAgo': 'il y a {{count}} heure(s)',
    'time.minutesAgo': 'il y a {{count}} minute(s)',
    'time.secondsAgo': 'il y a {{count}} seconde(s)',

    // Errors
    'errors.errorOccurred': 'Erreur survenue',
    'errors.failedToCreatePullRequest':
      'Échec de la création de la pull request',
    'errors.prErrorPermissions':
      "Vous n'avez pas la permission de créer une pull request",
    'errors.catalogInfoExists': 'catalog-info.yaml existe déjà',
    'errors.catalogEntityConflict': "Conflit d'entité de catalogue",
    'errors.repoEmpty': 'Le dépôt est vide',
    'errors.codeOwnersNotFound':
      'Le fichier CODEOWNERS est manquant dans le dépôt. Ajoutez un fichier CODEOWNERS pour créer une nouvelle PR.',

    // Preview File
    'previewFile.readyToImport': 'Prêt à importer',
    'previewFile.previewFile': 'Aperçu du fichier',
    'previewFile.previewFiles': 'Aperçu des fichiers',
    'previewFile.failedToCreatePR': 'Échec de la création de la PR',
    'previewFile.prCreationUnsuccessful':
      'La création de PR a échoué pour certains dépôts. Cliquez sur `Modifier` pour voir la raison.',
    'previewFile.failedToFetchPR':
      'Échec de la récupération de la pull request. Un nouveau YAML a été généré ci-dessous.',
    'previewFile.invalidEntityYaml':
      "Le YAML d'entité dans votre pull request est invalide (fichier vide ou apiVersion, kind ou metadata.name manquant). Un nouveau YAML a été généré ci-dessous.",
    'previewFile.pullRequestPendingApproval':
      "La [{{pullRequestText}}]({{pullRequestUrl}}) est en attente d'approbation",
    'previewFile.pullRequestText': 'pull request',
    'previewFile.viewRepository': 'Voir le dépôt',
    'previewFile.closeDrawer': 'Fermer le tiroir',
    'previewFile.keyValuePlaceholder': 'clé1: valeur1; clé2: valeur2',
    'previewFile.useSemicolonSeparator':
      'Utilisez un point-virgule pour séparer {{label}}',
    'previewFile.preview': 'Aperçu',
    'previewFile.pullRequest.title': 'Pull request',
    'previewFile.pullRequest.mergeRequest': 'Merge request',
    'previewFile.pullRequest.serviceNowTicket': 'Ticket ServiceNow',
    'previewFile.pullRequest.details': 'Détails {{tool}}',
    'previewFile.pullRequest.titleLabel': 'Titre {{tool}}',
    'previewFile.pullRequest.bodyLabel': 'Corps {{tool}}',
    'previewFile.pullRequest.titlePlaceholder':
      "Ajouter des fichiers descripteurs d'entité de catalogue Backstage",
    'previewFile.pullRequest.bodyPlaceholder':
      'Un texte descriptif avec support Markdown',
    'previewFile.pullRequest.entityConfiguration': "Configuration d'entité",
    'previewFile.pullRequest.componentNameLabel': 'Nom du composant créé',
    'previewFile.pullRequest.componentNamePlaceholder': 'Nom du composant',
    'previewFile.pullRequest.entityOwnerLabel': "Propriétaire de l'entité",
    'previewFile.pullRequest.entityOwnerPlaceholder': 'groupes et utilisateurs',
    'previewFile.pullRequest.entityOwnerHelper':
      'Sélectionnez un propriétaire dans la liste ou entrez une référence à un groupe ou un utilisateur',
    'previewFile.pullRequest.loadingText':
      'Chargement des groupes et utilisateurs',
    'previewFile.pullRequest.previewEntities': 'Aperçu des entités',
    'previewFile.pullRequest.annotations': 'Annotations',
    'previewFile.pullRequest.labels': 'Libelles',
    'previewFile.pullRequest.spec': 'Spécification',
    'previewFile.pullRequest.useCodeOwnersFile':
      "Utiliser le fichier *CODEOWNERS* comme propriétaire d'entité",
    'previewFile.pullRequest.codeOwnersWarning':
      "ATTENTION : Cela peut échouer si aucun fichier CODEOWNERS n'est trouvé à l'emplacement cible.",

    // Forms
    'forms.footer.createServiceNowTicket': 'Créer un ticket ServiceNow',
    'forms.footer.createServiceNowTickets': 'Créer des tickets ServiceNow',
    'forms.footer.createPullRequest': 'Créer une pull request',
    'forms.footer.createPullRequests': 'Créer des pull requests',
    'forms.footer.serviceNowTooltip':
      'Les fichiers Catalog-info.yaml doivent être générés avant de créer un ticket ServiceNow',
    'forms.footer.importTooltip':
      "Les fichiers Catalog-info.yaml doivent être générés pour l'importation.",
    'forms.footer.pullRequestTooltip':
      'Les fichiers Catalog-info.yaml doivent être générés avant de créer une pull request',

    // Table pagination (keeping for compatibility)
    'table.pagination.rows5': '5 lignes',
    'table.pagination.rows10': '10 lignes',
    'table.pagination.rows20': '20 lignes',
    'table.pagination.rows50': '50 lignes',
    'table.pagination.rows100': '100 lignes',
  },
});

export default bulkImportTranslationFr;
