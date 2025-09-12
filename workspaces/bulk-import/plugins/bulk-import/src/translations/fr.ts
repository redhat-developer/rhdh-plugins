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
  messages: {
    // Page titles and subtitles
    'page.title': 'Import en lot',
    'page.subtitle': 'Importer des entités dans Red Hat Developer Hub',
    'page.addRepositoriesTitle': 'Ajouter des dépôts',
    'page.importEntitiesTitle': 'Importer des entités',
    'page.addRepositoriesSubtitle':
      'Ajouter des dépôts à Red Hat Developer Hub en 4 étapes',
    'page.importEntitiesSubtitle': 'Importer dans Red Hat Developer Hub',
    'page.typeLink': 'Import en lot',

    // Sidebar
    'sidebar.bulkImport': 'Import en lot',

    // Permissions
    'permissions.title': 'Autorisation requise',
    'permissions.addRepositoriesMessage':
      "Pour ajouter des dépôts, contactez votre administrateur pour qu'il vous accorde l'autorisation `bulk.import`.",
    'permissions.viewRepositoriesMessage':
      "Pour voir les dépôts ajoutés, contactez votre administrateur pour qu'il vous accorde l'autorisation `bulk.import`.",

    // Pagination
    'pagination.rows5': '5 lignes',
    'pagination.rows10': '10 lignes',
    'pagination.rows20': '20 lignes',
    'pagination.rows50': '50 lignes',
    'pagination.rows100': '100 lignes',
    'pagination.noRecordsFound': 'Aucun enregistrement trouvé',

    // Repositories
    'repositories.addedRepositories': 'Dépôts ajoutés',
    'repositories.importedEntities': 'Entités importées',
    'repositories.addedRepositoriesCount': 'Dépôts ajoutés ({{count}})',
    'repositories.importedEntitiesCount': 'Entités importées ({{count}})',
    'repositories.noRecordsFound': 'Aucun enregistrement trouvé',
    'repositories.refresh': 'Actualiser',
    'repositories.import': 'Importer',
    'repositories.add': 'Ajouter',
    'repositories.remove': 'Supprimer',
    'repositories.cancel': 'Annuler',
    'repositories.removing': 'Suppression en cours...',
    'repositories.close': 'Fermer',
    'repositories.delete': 'Supprimer',
    'repositories.deleteRepository': 'Supprimer le dépôt',
    'repositories.removeRepositoryQuestion':
      'Supprimer {{repoName}} {{repositoryText}} ?',
    'repositories.repositoryText': 'dépôt',
    'repositories.removeRepositoryWarning':
      'La suppression de {{action}} efface toutes les informations associées de la page Catalogue.',
    'repositories.removeAction': "d'un dépôt",
    'repositories.removeActionGitlab': 'cela va',
    'repositories.cannotRemoveRepositoryUrl':
      "Impossible de supprimer le dépôt car l'URL du dépôt est manquante.",
    'repositories.unableToRemoveRepository':
      'Impossible de supprimer le dépôt. {{error}}',
    'repositories.removeTooltip': 'Supprimer',
    'repositories.removeTooltipDisabled':
      'Ce dépôt a été ajouté au fichier app-config. Pour le supprimer, modifiez directement le fichier.',
    'repositories.errorOccuredWhileFetching':
      'Erreur survenue lors de la récupération de la pull request',
    'repositories.failedToCreatePullRequest':
      'Échec de la création de la pull request',
    'repositories.errorOccured': 'Erreur survenue',
    'repositories.update': 'Mettre à jour',
    'repositories.view': 'Voir',
    'repositories.editCatalogInfoTooltip':
      'Modifier la pull request catalog-info.yaml',
    'repositories.viewCatalogInfoTooltip': 'Voir le fichier catalog-info.yaml',
    'repositories.waitingForApproval': "En attente d'approbation",
    'repositories.pr': 'PR',

    // Status
    'status.alreadyImported': 'Déjà importé',
    'status.added': 'Ajouté',
    'status.waitingForApproval': "En attente d'approbation",
    'status.imported': 'Importé',

    // Errors
    'errors.prErrorPermissions':
      'Impossible de créer une nouvelle PR en raison de permissions insuffisantes. Contactez votre administrateur.',
    'errors.catalogInfoExists':
      "Puisque catalog-info.yaml existe déjà dans le dépôt, aucune nouvelle PR ne sera créée. Cependant, l'entité sera toujours enregistrée dans la page du catalogue.",
    'errors.catalogEntityConflict':
      "Impossible de créer une nouvelle PR en raison d'un conflit d'entité de catalogue.",
    'errors.repoEmpty':
      'Impossible de créer une nouvelle PR car le dépôt est vide. Poussez un commit initial vers le dépôt.',
    'errors.codeOwnersNotFound':
      'Aucun fichier CODEOWNERS trouvé dans le dépôt',

    // Validation
    'validation.componentNameInvalid':
      '"{{value}}" n\'est pas valide ; attendu une chaîne qui est des séquences de [a-zA-Z0-9] séparées par [-_.], au maximum 63 caractères au total. Pour en savoir plus sur le format de fichier de catalogue, visitez : https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md',
    'validation.componentNameRequired': 'Le nom du composant est requis',
    'validation.entityOwnerRequired': "Le propriétaire de l'entité est requis",
    'validation.titleRequired': 'Le titre {{approvalTool}} est requis',
    'validation.descriptionRequired':
      'La description {{approvalTool}} est requise',

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

    // Table pagination
    'table.pagination.rows5': '5 lignes',
    'table.pagination.rows10': '10 lignes',
    'table.pagination.rows20': '20 lignes',
    'table.pagination.rows50': '50 lignes',
    'table.pagination.rows100': '100 lignes',

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
    'addRepositories.cancel': 'Annuler',
    'addRepositories.add': 'Ajouter',
    'addRepositories.addSelected': 'Ajouter la sélection',
    'addRepositories.generateCatalogInfo': 'Générer catalog-info.yaml',
    'addRepositories.editPullRequest': 'Modifier la pull request',
    'addRepositories.preview': 'Aperçu',
    'addRepositories.close': 'Fermer',
    'addRepositories.save': 'Sauvegarder',
    'addRepositories.delete': 'Supprimer',
    'addRepositories.sync': 'Synchroniser',
    'addRepositories.edit': 'Modifier',
    'addRepositories.refresh': 'Actualiser',
    'addRepositories.back': 'Retour',
    'addRepositories.next': 'Suivant',
    'addRepositories.submit': 'Soumettre',
    'addRepositories.loading': 'Chargement...',
    'addRepositories.error': 'Erreur',
    'addRepositories.success': 'Succès',
    'addRepositories.warning': 'Avertissement',
    'addRepositories.info': 'Information',

    // Catalog info status
    'catalogInfo.status.generating': 'Génération',
    'catalogInfo.status.notGenerated': 'Non généré',
    'catalogInfo.status.added': 'Ajouté',
    'catalogInfo.status.pending': 'En attente',
    'catalogInfo.status.failed': 'Échoué',
    'catalogInfo.status.prOpened': 'PR ouverte',
    'catalogInfo.status.waitingForApproval': "En attente d'approbation",
    'catalogInfo.status.approved': 'Approuvé',

    // Catalog info actions
    'catalogInfo.actions.edit': 'Modifier catalog-info.yaml',
    'catalogInfo.actions.delete': 'Supprimer le dépôt',
    'catalogInfo.actions.sync': 'Synchroniser le dépôt',
    'catalogInfo.actions.view': 'Voir catalog-info.yaml',
    'catalogInfo.actions.createPr': 'Créer une pull request',

    // Preview file

    // Pull request
    'pullRequest.createTitle': 'Créer une Pull Request',
    'pullRequest.editTitle': 'Modifier la Pull Request',
    'pullRequest.descriptionLabel': 'Description',
    'pullRequest.branch': 'Branche',
    'pullRequest.targetBranch': 'Branche cible',
    'pullRequest.sourceBranch': 'Branche source',
    'pullRequest.defaultBranch': 'Branche par défaut',
    'pullRequest.prTitle': 'Titre de la pull request',
    'pullRequest.prDescription': 'Description de la pull request',
    'pullRequest.createPr': 'Créer la PR',
    'pullRequest.updatePr': 'Mettre à jour la PR',
    'pullRequest.viewPr': 'Voir la PR',
    'pullRequest.waitingForPr': 'En attente de la PR',

    // Delete
    'delete.title': 'Supprimer le dépôt ?',
    'delete.message':
      'Êtes-vous sûr de vouloir supprimer ce dépôt du catalogue ?',
    'delete.repositoryName': 'Dépôt : {{name}}',
    'delete.confirm': 'Supprimer',
    'delete.cancel': 'Annuler',
    'delete.success': 'Dépôt supprimé avec succès',
    'delete.error': 'Échec de la suppression du dépôt',

    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.warning': 'Avertissement',
    'common.info': 'Information',
    'common.retry': 'Réessayer',
    'common.refresh': 'Actualiser',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.clear': 'Effacer',
    'common.apply': 'Appliquer',
    'common.reset': 'Réinitialiser',
    'common.export': 'Exporter',
    'common.import': 'Importer',
    'common.download': 'Télécharger',
    'common.upload': 'Téléverser',
    'common.create': 'Créer',
    'common.update': 'Mettre à jour',
    'common.save': 'Sauvegarder',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.open': 'Ouvrir',
    'common.view': 'Voir',
    'common.edit': 'Modifier',
    'common.delete': 'Supprimer',
    'common.remove': 'Retirer',
    'common.add': 'Ajouter',
    'common.select': 'Sélectionner',
    'common.selectAll': 'Tout sélectionner',
    'common.deselectAll': 'Tout désélectionner',
    'common.none': 'Aucun',
    'common.all': 'Tout',
    'common.yes': 'Oui',
    'common.no': 'Non',
    'common.ok': 'OK',
    'common.done': 'Terminé',
    'common.finish': 'Terminer',
    'common.continue': 'Continuer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.submit': 'Soumettre',
    'common.send': 'Envoyer',
    'common.copy': 'Copier',
    'common.paste': 'Coller',
    'common.cut': 'Couper',
    'common.undo': 'Annuler',
    'common.redo': 'Refaire',

    // Time
    'time.daysAgo': 'il y a {{count}} jour(s)',
    'time.hoursAgo': 'il y a {{count}} heure(s)',
    'time.minutesAgo': 'il y a {{count}} minute(s)',
    'time.secondsAgo': 'il y a {{count}} seconde(s)',

    // Notifications
    'notifications.repositoryAdded': 'Dépôt ajouté avec succès',
    'notifications.repositoryUpdated': 'Dépôt mis à jour avec succès',
    'notifications.repositoryDeleted': 'Dépôt supprimé avec succès',
    'notifications.catalogInfoUpdated':
      'Informations du catalogue mises à jour avec succès',
    'notifications.pullRequestCreated': 'Pull request créée avec succès',
    'notifications.pullRequestUpdated': 'Pull request mise à jour avec succès',
    'notifications.syncCompleted': 'Synchronisation terminée avec succès',
    'notifications.operationFailed': 'Opération échouée',
    'notifications.unexpectedError': "Une erreur inattendue s'est produite",
    'notifications.networkError':
      'Erreur réseau. Veuillez vérifier votre connexion.',
    'notifications.permissionDenied': 'Autorisation refusée',
    'notifications.notFound': 'Ressource introuvable',
    'notifications.timeout': "Délai d'attente dépassé. Veuillez réessayer.",

    // Errors
    'errors.errorOccurred': 'Erreur survenue',
    'errors.failedToCreatePullRequest':
      'Échec de la création de la pull request',

    // Buttons
    'buttons.select': 'Sélectionner',
    'buttons.cancel': 'Annuler',
    'buttons.create': 'Créer',
    'buttons.edit': 'Modifier',
    'buttons.view': 'Voir',
    'buttons.none': 'Aucun',
    'buttons.import': 'Importer',
    'buttons.save': 'Enregistrer',
    'buttons.close': 'Fermer',

    // Preview File
    'previewFile.edit': 'Modifier',
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
    'previewFile.pullRequestPendingApprovalPrefix': 'La',
    'previewFile.pullRequestPendingApprovalSuffix':
      "est en attente d'approbation",
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
      "Utiliser le fichier CODEOWNERS comme propriétaire d'entité",
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
  },
});

export default bulkImportTranslationFr;
