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
 * fr translation for plugin.bulk-import.
 * @public
 */
const bulkImportTranslationFr = createTranslationMessages({
  ref: bulkImportTranslationRef,
  messages: {
    'page.title': 'Importation en masse',
    'page.subtitle': 'Importer des entités vers Red Hat Developer Hub',
    'page.addRepositoriesTitle': 'Ajouter des référentiels',
    'page.importEntitiesTitle': 'Importer des entités',
    'page.addRepositoriesSubtitle':
      'Ajoutez des référentiels à Red Hat Developer Hub en 4 étapes',
    'page.importEntitiesSubtitle': 'Importer vers Red Hat Developer Hub',
    'page.typeLink': 'Importation en masse',
    'sidebar.bulkImport': 'Importation en masse',
    'permissions.title': 'Autorisation requise',
    'permissions.addRepositoriesMessage':
      "Pour ajouter des référentiels, contactez votre administrateur pour qu'il vous donne l'autorisation « bulk.import ».",
    'permissions.viewRepositoriesMessage':
      "Pour afficher les référentiels ajoutés, contactez votre administrateur pour qu'il vous donne l'autorisation « bulk.import ».",
    'repositories.addedRepositories': 'Dépôts ajoutés',
    'repositories.importedEntities': 'Entités importées',
    'repositories.addedRepositoriesCount': 'Dépôts ajoutés ({{count}})',
    'repositories.importedEntitiesCount': 'Entités importées ({{count}})',
    'repositories.noRecordsFound': 'Aucun enregistrement trouvé',
    'repositories.refresh': 'Rafraîchir',
    'repositories.import': 'Importer',
    'repositories.removing': 'Suppression...',
    'repositories.deleteRepository': 'Supprimer le référentiel',
    'repositories.removeRepositoryQuestion':
      'Supprimer {{repoName}} {{repositoryText}} ?',
    'repositories.repositoryText': 'Dépôt',
    'repositories.removeRepositoryWarningScaffolder':
      'La suppression d’un référentiel efface toutes les informations de tâches de scaffolding.',
    'repositories.removeRepositoryWarning':
      'La suppression d’un référentiel efface toutes les informations associées de la page Catalogue.',
    'repositories.removeRepositoryWarningGitlab':
      'Sa suppression effacera toutes les informations associées de la page Catalogue.',
    'repositories.cannotRemoveRepositoryUrl':
      "Impossible de supprimer le référentiel car l'URL du référentiel est manquante.",
    'repositories.unableToRemoveRepository':
      'Impossible de supprimer le dépôt. {{error}}',
    'repositories.removeTooltipDisabled':
      'Ce référentiel a été ajouté au fichier app-config. Pour le supprimer, modifiez directement le fichier',
    'repositories.removeTooltipRepositoryScaffolder':
      'Supprimer le référentiel et toutes les tâches de scaffolding associées',
    'repositories.errorOccuredWhileFetching':
      "Une erreur s'est produite lors de la récupération de la demande d'extraction",
    'repositories.failedToCreatePullRequest':
      "Échec de la création de la demande d'extraction",
    'repositories.errorOccured': "Une erreur s'est produite",
    'repositories.editCatalogInfoTooltip':
      "Modifier la demande d'extraction catalog-info.yaml",
    'repositories.viewCatalogInfoTooltip':
      'Afficher le fichier catalog-info.yaml',
    'repositories.pr': 'PR',
    'status.alreadyImported': 'Déjà importé',
    'status.added': 'Ajouté',
    'status.waitingForApproval': "En attente d'approbation",
    'status.imported': 'Importé',
    'errors.prErrorPermissions':
      "Impossible de créer un nouveau PR en raison d'autorisations insuffisantes. Contactez votre administrateur.",
    'errors.catalogInfoExists':
      "Étant donné que catalog-info.yaml existe déjà dans le référentiel, aucun nouveau PR ne sera créé. Cependant, l'entité sera toujours enregistrée dans la page du catalogue.",
    'errors.catalogEntityConflict':
      "Impossible de créer un nouveau PR en raison d'un conflit d'entité de catalogue.",
    'errors.repoEmpty':
      'Impossible de créer un nouveau PR car le référentiel est vide. Envoyez un commit initial au référentiel.',
    'errors.codeOwnersNotFound':
      'Le fichier CODEOWNERS est manquant dans le référentiel. Ajoutez un fichier CODEOWNERS pour créer un nouveau PR.',
    'errors.errorOccurred': "Une erreur s'est produite",
    'errors.failedToCreatePullRequest':
      "Échec de la création de la demande d'extraction",
    'validation.componentNameInvalid':
      '"{{value}}" n\'est pas valide ; une chaîne contenant des séquences de [a-zA-Z0-9] séparées par l\'un des [-_.] est attendue, soit au maximum 63 caractères au total. Pour en savoir plus sur le format de fichier de catalogue, visitez : https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md',
    'validation.componentNameRequired': 'Le nom du composant est requis',
    'validation.entityOwnerRequired': "Le propriétaire de l'entité est requis",
    'validation.titleRequired': 'Le titre {{approvalTool}} est obligatoire',
    'validation.descriptionRequired':
      'La description de {{approvalTool}} est requise',
    'validation.keyValuePairFormat':
      'Chaque entrée doit avoir une clé et une valeur séparées par deux points.',
    'table.headers.name': 'Nom',
    'table.headers.url': 'URL',
    'table.headers.repoUrl': 'URL du dépôt',
    'table.headers.organization': 'Organisation',
    'table.headers.organizationGroup': 'Organisation/groupe',
    'table.headers.group': 'Groupe',
    'table.headers.status': 'Statut',
    'table.headers.lastUpdated': 'Dernière mise à jour',
    'table.headers.actions': 'Actes',
    'table.headers.catalogInfoYaml': 'catalogue-info.yaml',
    'table.pagination.rows5': '5 lignes',
    'table.pagination.rows10': '10 lignes',
    'table.pagination.rows20': '20 lignes',
    'table.pagination.rows50': '50 lignes',
    'table.pagination.rows100': '100 lignes',
    'steps.chooseApprovalTool':
      "Choisissez l'outil d'approbation (GitHub/GitLab) pour la création de PR",
    'steps.chooseRepositories':
      'Choisissez les référentiels que vous souhaitez ajouter',
    'steps.chooseItems': 'Choisissez les éléments que vous souhaitez importer',
    'steps.generateCatalogInfo':
      'Générer un fichier catalog-info.yaml pour chaque référentiel',
    'steps.generateCatalogInfoItems':
      'Générer un fichier catalog-info.yaml pour chaque élément sélectionné',
    'steps.editPullRequest':
      "Modifier les détails de la demande d'extraction si nécessaire",
    'steps.trackStatus': "Suivre l'état d'approbation",
    'addRepositories.approvalTool.title': "Outil d'approbation",
    'addRepositories.approvalTool.description':
      "Choisir l'outil d'approbation pour la création de RP",
    'addRepositories.approvalTool.tooltip':
      "L'importation nécessite une approbation. Une fois la demande d'extraction/fusion approuvée, les référentiels/projets seront importés sur la page Catalogue.",
    'addRepositories.approvalTool.github': 'GitHub',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.repositoryType.title': 'Type de référentiel',
    'addRepositories.repositoryType.repository': 'Dépôt',
    'addRepositories.repositoryType.organization': 'Organisation',
    'addRepositories.repositoryType.project': 'Projet',
    'addRepositories.repositoryType.group': 'Groupe',
    'addRepositories.searchPlaceholder': 'Recherche',
    'addRepositories.clearSearch': 'supprimer la recherche',
    'addRepositories.noRepositoriesFound': 'Aucun dépôt trouvé',
    'addRepositories.allRepositoriesAdded':
      'Tous les référentiels sont ajoutés',
    'addRepositories.noSelection': 'Aucun',
    'addRepositories.selectRepositories': 'Sélectionner les référentiels',
    'addRepositories.selectedRepositories': 'dépôts',
    'addRepositories.selectedProjects': 'projets',
    'addRepositories.selectedLabel': 'Choisi',
    'addRepositories.selectedCount': '{{count}} sélectionné',
    'addRepositories.addSelected': 'Ajouter la sélection',
    'addRepositories.generateCatalogInfo': 'Générer catalog-info.yaml',
    'addRepositories.editPullRequest': "Modifier la demande d'extraction",
    'addRepositories.preview': 'Aperçu',
    'catalogInfo.status.generating': 'Générateur',
    'catalogInfo.status.notGenerated': 'Non généré',
    'common.add': 'Ajouter',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.filter': 'Filtre',
    'common.import': 'Importer',
    'common.remove': 'Supprimer',
    'common.save': 'Sauvegarder',
    'common.select': 'Sélectionner',
    'common.update': 'Mise à jour',
    'common.view': 'Voir',
    'time.daysAgo': 'Il y a {{count}} jour(s)',
    'time.hoursAgo': 'Il y a {{count}} heure(s)',
    'time.minutesAgo': 'Il y a {{count}} minute(s)',
    'time.secondsAgo': 'Il y a {{count}} seconde(s)',
    'previewFile.readyToImport': 'Prêt à importer',
    'previewFile.previewFile': "Fichier d'aperçu",
    'previewFile.previewFiles': 'Aperçu des fichiers',
    'previewFile.failedToCreatePR': 'Échec de la création du PR',
    'previewFile.prCreationUnsuccessful':
      'La création de PR a échoué pour certains référentiels. Cliquer sur « Modifier » pour voir la raison.',
    'previewFile.failedToFetchPR':
      "Échec de la récupération de la demande d'extraction. Un nouveau YAML a été généré ci-dessous.",
    'previewFile.invalidEntityYaml':
      "L'entité YAML dans votre demande d'extraction n'est pas valide (fichier vide ou apiVersion, kind ou metadata.name manquant). Un nouveau YAML a été généré ci-dessous.",
    'previewFile.pullRequestPendingApproval':
      "Le [{{pullRequestText}}]({{pullRequestUrl}}) est en attente d'approbation",
    'previewFile.pullRequestText': "demande d'extraction",
    'previewFile.viewRepository': 'Afficher le référentiel',
    'previewFile.closeDrawer': 'Fermez le tiroir',
    'previewFile.keyValuePlaceholder': 'clé1 : valeur2 ; clé2 : valeur2',
    'previewFile.useSemicolonSeparator':
      'Utilisez un point-virgule pour séparer {{label}}',
    'previewFile.preview': 'Aperçu',
    'previewFile.pullRequest.title': "Demande d'extraction",
    'previewFile.pullRequest.mergeRequest': 'Demande de fusion',
    'previewFile.pullRequest.serviceNowTicket': 'Ticket ServiceNow',
    'previewFile.pullRequest.details': '{{tool}} détails',
    'previewFile.pullRequest.titleLabel': 'titre de {{outil}}',
    'previewFile.pullRequest.bodyLabel': 'corps de {{outil}}',
    'previewFile.pullRequest.titlePlaceholder':
      "Ajouter des fichiers descripteurs d'entités de catalogue Backstage",
    'previewFile.pullRequest.bodyPlaceholder':
      'Un texte descriptif avec prise en charge Markdown',
    'previewFile.pullRequest.entityConfiguration': "Configuration de l'entité",
    'previewFile.pullRequest.componentNameLabel': 'Nom du composant créé',
    'previewFile.pullRequest.componentNamePlaceholder': 'Nom du composant',
    'previewFile.pullRequest.entityOwnerLabel': "Propriétaire de l'entité",
    'previewFile.pullRequest.entityOwnerPlaceholder': 'groupes et utilisateurs',
    'previewFile.pullRequest.entityOwnerHelper':
      'Sélectionnez un propriétaire dans la liste ou entrez une référence à un groupe ou à un utilisateur',
    'previewFile.pullRequest.loadingText':
      'Chargement des groupes et des utilisateurs',
    'previewFile.pullRequest.previewEntities': 'Aperçu des entités',
    'previewFile.pullRequest.annotations': 'Annotations',
    'previewFile.pullRequest.labels': 'Étiquettes',
    'previewFile.pullRequest.spec': 'Spécifications',
    'previewFile.pullRequest.useCodeOwnersFile':
      "Utiliser le fichier *CODEOWNERS* comme propriétaire de l'entité",
    'previewFile.pullRequest.codeOwnersWarning':
      "AVERTISSEMENT : cette opération peut échouer si aucun fichier CODEOWNERS n'est trouvé à l'emplacement cible.",
    'forms.footer.createServiceNowTicket': 'Créer un ticket ServiceNow',
    'forms.footer.createServiceNowTickets': 'Créer des tickets ServiceNow',
    'forms.footer.createPullRequest': "Créer une demande d'extraction",
    'forms.footer.createPullRequests': "Créer des demandes d'extraction",
    'forms.footer.serviceNowTooltip':
      'Les fichiers Catalog-info.yaml doivent être générés avant de créer un ticket ServiceNow',
    'forms.footer.importTooltip':
      "Les fichiers Catalog-info.yaml doivent être générés pour l'importation.",
    'forms.footer.pullRequestTooltip':
      "Les fichiers Catalog-info.yaml doivent être générés avant de créer une demande d'extraction",
    'tasks.tasksFor': 'Tâches pour {{importJobStatusId}}',
    'tasks.taskId': 'ID de tâche',
    'tasks.taskLink': 'Lien pour les tâches',
    'tasks.viewTask': 'Afficher les tâches',
    'tasks.loading': 'Chargement en cours...',
    'tasks.errorFetchingData': 'Erreur lors de la récupération des données',
    'tasks.taskCancelled': 'Tâche annulée',
    'tasks.taskCompleted': 'Tâche complétée',
    'tasks.taskFailed': 'Tâche ayant échoué',
    'tasks.taskOpen': 'Tâche en cours',
    'tasks.taskProcessing': 'Traitement de la tâche en cours',
    'tasks.taskSkipped': 'Tâche ignorée',
  },
});

export default bulkImportTranslationFr;
