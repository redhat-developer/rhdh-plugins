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
    'addRepositories.addSelected': 'Ajouter la sélection',
    'addRepositories.allRepositoriesAdded':
      'Tous les référentiels sont ajoutés',
    'addRepositories.approvalTool.description':
      "Choisissez l'outil de contrôle de source pour la création de RP",
    'addRepositories.approvalTool.github': 'GitHub',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.approvalTool.title': 'Outil de contrôle de source',
    'addRepositories.approvalTool.tooltip':
      "L'importation nécessite une approbation. Une fois la demande d'extraction approuvée, les référentiels seront importés sur la page Catalogue.",
    'addRepositories.clearSearch': 'recherche claire',
    'addRepositories.editPullRequest': "Modifier la demande d'extraction",
    'addRepositories.generateCatalogInfo': 'Générer catalog-info.yaml',
    'addRepositories.noRepositoriesFound': 'Aucun dépôt trouvé',
    'addRepositories.noSelection': 'Aucun',
    'addRepositories.preview': 'Aperçu',
    'addRepositories.repositoryType.group': 'Groupe',
    'addRepositories.repositoryType.organization': 'Organisation',
    'addRepositories.repositoryType.project': 'Projet',
    'addRepositories.repositoryType.repository': 'Dépôt',
    'addRepositories.repositoryType.title': 'Type de référentiel',
    'addRepositories.searchPlaceholder': 'Rechercher',
    'addRepositories.selectRepositories': 'Sélectionner les référentiels',
    'addRepositories.selectedCount': '{{count}} sélectionné',
    'addRepositories.selectedLabel': 'Choisi',
    'addRepositories.selectedProjects': 'projets',
    'addRepositories.selectedRepositories': 'dépôts',
    'catalogInfo.status.generating': 'Générateur',
    'common.add': 'Ajouter',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.delete': 'Supprimer',
    'common.documentation': 'Documentation',
    'common.edit': 'Modifier',
    'common.filter': 'Filtre',
    'common.import': 'Importer',
    'common.remove': 'Retirer',
    'common.save': 'Sauvegarder',
    'common.select': 'Sélectionner',
    'common.update': 'Mise à jour',
    'common.view': 'Voir',
    'errors.catalogEntityConflict':
      "Impossible de créer un nouveau PR en raison d'un conflit d'entité de catalogue.",
    'errors.catalogInfoExists':
      "Étant donné que catalog-info.yaml existe déjà dans le référentiel, aucun nouveau PR ne sera créé. Cependant, l'entité sera toujours enregistrée dans la page du catalogue.",
    'errors.codeOwnersNotFound':
      'Le fichier CODEOWNERS est manquant dans le référentiel. Ajoutez un fichier CODEOWNERS pour créer un nouveau PR.',
    'errors.errorOccurred': "Une erreur s'est produite",
    'errors.failedToCreatePullRequest':
      "Échec de la création de la demande d'extraction",
    'errors.noIntegrationsConfigured':
      "Aucune intégration GitHub ou GitLab n'est configurée. Veuillez ajouter au moins une intégration pour utiliser la fonction d'importation en masse.",
    'errors.addIntegrationsToConfig':
      'Pour résoudre ce problème, assurez-vous que les intégrations sont ajoutées à votre fichier de configuration Backstage (app-config.yaml).',
    'errors.prErrorPermissions':
      "Impossible de créer un nouveau PR en raison d'autorisations insuffisantes. Contactez votre administrateur.",
    'errors.repoEmpty':
      'Impossible de créer un nouveau PR car le référentiel est vide. Envoyez un commit initial au référentiel.',
    'forms.footer.createPullRequest': "Créer une demande d'extraction",
    'forms.footer.createPullRequests': "Créer des demandes d'extraction",
    'forms.footer.selectRepositoryTooltip': 'Sélectionnez un dépôt à importer.',
    'forms.footer.createServiceNowTicket': 'Créer un ticket ServiceNow',
    'forms.footer.createServiceNowTickets': 'Créer des tickets ServiceNow',
    'forms.footer.importTooltip':
      "Les fichiers Catalog-info.yaml doivent être générés pour l'importation.",
    'forms.footer.pullRequestTooltip':
      "Les fichiers Catalog-info.yaml doivent être générés avant de créer une demande d'extraction",
    'forms.footer.serviceNowTooltip':
      'Les fichiers Catalog-info.yaml doivent être générés avant de créer un ticket ServiceNow',
    'page.addRepositoriesSubtitle':
      'Ajoutez des référentiels à Red Hat Developer Hub en 4 étapes',
    'page.addRepositoriesTitle': 'Ajouter des référentiels',
    'page.importEntitiesSubtitle': 'Importer vers Red Hat Developer Hub',
    'page.importEntitiesTitle': 'Importer des entités',
    'page.subtitle': 'Importer des entités vers Red Hat Developer Hub',
    'page.title': 'Importation en masse',
    'page.typeLink': 'Importation en masse',
    'permissions.addRepositoriesMessage':
      "Pour ajouter des référentiels, contactez votre administrateur pour qu'il vous donne l'autorisation « bulk.import ».",
    'permissions.title': 'Autorisation requise',
    'permissions.viewRepositoriesMessage':
      "Pour afficher les référentiels ajoutés, contactez votre administrateur pour qu'il vous donne l'autorisation « bulk.import ».",
    'previewFile.closeDrawer': 'Fermez le tiroir',
    'previewFile.failedToCreatePR': 'Échec de la création du PR',
    'previewFile.failedToFetchPR':
      "Échec de la récupération de la demande d'extraction. Un nouveau YAML a été généré ci-dessous.",
    'previewFile.invalidEntityYaml':
      "L'entité YAML dans votre demande d'extraction n'est pas valide (fichier vide ou apiVersion, kind ou metadata.name manquant). Un nouveau YAML a été généré ci-dessous.",
    'previewFile.keyValuePlaceholder': 'clé1 : valeur2 ; clé2 : valeur2',
    'previewFile.prCreationUnsuccessful':
      'La création de PR a échoué pour certains référentiels. Cliquez sur « Modifier » pour voir la raison.',
    'previewFile.preview': 'Aperçu',
    'previewFile.previewFile': "Fichier d'aperçu",
    'previewFile.previewFiles': 'Aperçu des fichiers',
    'previewFile.pullRequest.annotations': 'Annotations',
    'previewFile.pullRequest.bodyLabel': 'corps de {{outil}}',
    'previewFile.pullRequest.bodyPlaceholder':
      'Un texte descriptif avec prise en charge Markdown',
    'previewFile.pullRequest.codeOwnersWarning':
      "AVERTISSEMENT : cette opération peut échouer si aucun fichier CODEOWNERS n'est trouvé à l'emplacement cible.",
    'previewFile.pullRequest.componentNameLabel': 'Nom du composant créé',
    'previewFile.pullRequest.componentNamePlaceholder': 'Nom du composant',
    'previewFile.pullRequest.details': '{{tool}} détails',
    'previewFile.pullRequest.entityConfiguration': "Configuration de l'entité",
    'previewFile.pullRequest.entityOwnerHelper':
      'Sélectionnez un propriétaire dans la liste ou entrez une référence à un groupe ou à un utilisateur',
    'previewFile.pullRequest.entityOwnerLabel': "Propriétaire de l'entité",
    'previewFile.pullRequest.entityOwnerPlaceholder': 'groupes et utilisateurs',
    'previewFile.pullRequest.labels': 'Étiquettes',
    'previewFile.pullRequest.loadingText':
      'Chargement des groupes et des utilisateurs',
    'previewFile.pullRequest.mergeRequest': 'Demande de fusion',
    'previewFile.pullRequest.previewEntities': 'Aperçu des entités',
    'previewFile.pullRequest.serviceNowTicket': 'Ticket ServiceNow',
    'previewFile.pullRequest.spec': 'Spécifications',
    'previewFile.pullRequest.title': "Demande d'extraction",
    'previewFile.pullRequest.titleLabel': 'titre de {{outil}}',
    'previewFile.pullRequest.titlePlaceholder':
      "Ajouter des fichiers descripteurs d'entités de catalogue Backstage",
    'previewFile.pullRequest.useCodeOwnersFile':
      "Utiliser le fichier *CODEOWNERS* comme propriétaire de l'entité",
    'previewFile.pullRequestPendingApproval':
      "Le [{{pullRequestText}}]({{pullRequestUrl}}) est en attente d'approbation",
    'previewFile.pullRequestText': "demande d'extraction",
    'previewFile.useSemicolonSeparator':
      'Utilisez un point-virgule pour séparer {{label}}',
    'previewFile.viewRepository': 'Afficher le référentiel',
    'repositories.addedRepositories': 'Dépôts ajoutés',
    'repositories.addedRepositoriesCount': 'Dépôts ajoutés ({{count}})',
    'repositories.cannotRemoveRepositoryUrl':
      "Impossible de supprimer le référentiel car l'URL du référentiel est manquante.",
    'repositories.deleteRepository': 'Supprimer le référentiel',
    'repositories.editCatalogInfoTooltip':
      "Modifier la demande d'extraction catalog-info.yaml",
    'repositories.errorOccured': "Une erreur s'est produite",
    'repositories.errorOccuredWhileFetching':
      "Une erreur s'est produite lors de la récupération de la demande d'extraction",
    'repositories.failedToCreatePullRequest':
      "Échec de la création de la demande d'extraction",
    'repositories.import': 'Importer',
    'repositories.importedEntities': 'Entités importées',
    'repositories.importedEntitiesCount': 'Entités importées ({{count}})',
    'repositories.noRecordsFound':
      "Aucun référentiel disponible pour l'importation.",
    'repositories.noProjectsFound':
      "Aucun projet disponible pour l'importation.",
    'repositories.pr': 'PR',
    'repositories.refresh': 'Rafraîchir',
    'repositories.removeRepositoryQuestion':
      'Supprimer {{repoName}} {{repositoryText}} ?',
    'repositories.removeRepositoryWarning':
      'La suppression d’un référentiel efface toutes les informations associées de la page Catalogue.',
    'repositories.removeRepositoryWarningGitlab':
      'Sa suppression effacera toutes les informations associées de la page Catalogue.',
    'repositories.removeTooltipDisabled':
      'Ce référentiel a été ajouté au fichier app-config. Pour le supprimer, modifiez directement le fichier',
    'repositories.removing': 'Suppression...',
    'repositories.repositoryText': 'Dépôt',
    'repositories.removeRepositoryWarningScaffolder':
      'La suppression d’un dépôt supprimera également toutes les informations de tâche Scaffolder associées.',
    'repositories.unableToRemoveRepository':
      'Impossible de supprimer le dépôt. {{error}}',
    'repositories.removeTooltipRepositoryScaffolder':
      'Supprimer le dépôt et les informations de tâche Scaffolder associées',
    'repositories.viewCatalogInfoTooltip':
      'Afficher le fichier catalog-info.yaml',
    'sidebar.bulkImport': 'Importation en masse',
    'status.added': 'Ajouté',
    'status.alreadyImported': 'Déjà importé',
    'status.imported': 'Importé',
    'status.waitingForApproval': "En attente d'approbation",
    'status.readyToImport': 'Prêt à importer',
    'status.waitingForPullRequestToStart':
      'En attente du démarrage de la pull request',
    'status.missingConfigurations': 'Configurations manquantes',
    'status.failedCreatingPR': 'Échec de la création de la PR',
    'status.pullRequestRejected': 'Pull request rejetée',
    'steps.chooseApprovalTool':
      'Choisir un outil de contrôle de source pour la création de pull request',
    'steps.chooseItems': 'Choisissez les éléments que vous souhaitez importer',
    'steps.chooseRepositories':
      'Choisissez les référentiels que vous souhaitez ajouter',
    'steps.editPullRequest': 'Voir les détails de la pull/merge request',
    'steps.generateCatalogInfo':
      'Générer un fichier catalog-info.yaml pour chaque référentiel',
    'steps.generateCatalogInfoItems':
      'Générer un fichier catalog-info.yaml pour chaque élément sélectionné',
    'steps.trackStatus': "Suivre l'état d'approbation",
    'table.headers.actions': 'Actes',
    'table.headers.catalogInfoYaml': 'catalogue-info.yaml',
    'table.headers.group': 'Groupe',
    'table.headers.lastUpdated': 'Dernière mise à jour',
    'table.headers.name': 'Nom',
    'table.headers.organization': 'Organisation',
    'table.headers.organizationGroup': 'Organisation/groupe',
    'table.headers.repoUrl': 'URL du dépôt',
    'table.headers.status': 'Statut',
    'table.headers.taskStatus': 'Statut de la tâche',
    'table.headers.url': 'URL',
    'table.pagination.rows10': '10 lignes',
    'table.pagination.rows100': '100 lignes',
    'table.pagination.rows20': '20 lignes',
    'table.pagination.rows5': '5 lignes',
    'table.pagination.rows50': '50 lignes',
    'time.daysAgo': 'Il y a {{count}} jour(s)',
    'time.hoursAgo': 'Il y a {{count}} heure(s)',
    'time.minutesAgo': 'Il y a {{count}} minute(s)',
    'time.secondsAgo': 'Il y a {{count}} seconde(s)',
    'validation.componentNameInvalid':
      '"{{value}}" n\'est pas valide ; une chaîne contenant des séquences de [a-zA-Z0-9] séparées par l\'un des [-_.] est attendue, soit au maximum 63 caractères au total. Pour en savoir plus sur le format de fichier de catalogue, visitez : https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md',
    'validation.componentNameRequired': 'Le nom du composant est requis',
    'validation.descriptionRequired':
      'La description de {{approvalTool}} est requise',
    'validation.entityOwnerRequired': "Le propriétaire de l'entité est requis",
    'validation.keyValuePairFormat':
      'Chaque entrée doit avoir une clé et une valeur séparées par deux points.',
    'validation.titleRequired': 'Le titre {{approvalTool}} est obligatoire',
    'tasks.tasksFor': 'Tâches pour {{importJobStatusId}}',
    'tasks.taskId': 'ID de la tâche',
    'tasks.taskLink': 'Lien de la tâche',
    'tasks.viewTask': 'Voir la tâche',
    'tasks.loading': 'Chargement...',
    'tasks.errorFetchingData': 'Erreur lors de la récupération des données',
    'tasks.taskCancelled': 'Annulée',
    'tasks.taskCompleted': 'Terminée',
    'tasks.taskFailed': 'Échouée',
    'tasks.taskOpen': 'Ouverte',
    'tasks.taskProcessing': 'En cours',
    'tasks.taskSkipped': 'Ignorée',
  },
});

export default bulkImportTranslationFr;
