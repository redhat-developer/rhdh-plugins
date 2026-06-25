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
    'addRepositories.addSelected': 'Ajouter la sélection',
    'addRepositories.allRepositoriesAdded':
      'Tous les référentiels sont ajoutés',
    'addRepositories.approvalTool.description':
      'Choisissez un outil de gestion de versions pour la création des demandes de fusion.',
    'addRepositories.approvalTool.github': 'GitHub',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.approvalTool.title': 'Outil de contrôle de version',
    'addRepositories.approvalTool.tooltip':
      "L'importation nécessite une approbation. Une fois la demande d'extraction approuvée, les référentiels seront importés sur la page Catalogue.",
    'addRepositories.clearSearch': 'Effacer la recherche',
    'addRepositories.editPullRequest': 'Modifier la demande de fusion',
    'addRepositories.generateCatalogInfo':
      'Générer le fichier catalog-info.yaml',
    'addRepositories.noRepositoriesFound': 'Aucun référentiel trouvé',
    'addRepositories.noSelection': 'Aucun',
    'addRepositories.preview': 'Aperçu',
    'addRepositories.repositoryType.group': 'Groupe',
    'addRepositories.repositoryType.organization': 'Organisation',
    'addRepositories.repositoryType.project': 'Projet',
    'addRepositories.repositoryType.repository': 'Référentiel ',
    'addRepositories.repositoryType.title': 'Type de référentiel ',
    'addRepositories.searchPlaceholder': 'Recherche',
    'addRepositories.selectRepositories': 'Sélectionner les référentiels',
    'addRepositories.selectedCount': '{{count}} sélectionné',
    'addRepositories.selectedLabel': 'Sélectionné',
    'addRepositories.selectedProjects': 'projets',
    'addRepositories.selectedRepositories': 'référentiels',
    'catalogInfo.status.generating': 'Générateur',
    'common.add': 'Ajouter',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.delete': 'Supprimer',
    'common.documentation': 'Documentation',
    'common.edit': 'Modifier',
    'common.filter': 'Filtre',
    'common.import': 'Importer',
    'common.remove': 'Supprimer',
    'common.save': 'Enregistrer',
    'common.select': 'Sélectionner',
    'common.update': 'Mise à jour',
    'common.view': 'Afficher',
    'errors.addIntegrationsToConfig':
      'Pour résoudre ce problème, assurez-vous que les intégrations sont ajoutées à votre fichier de configuration Backstage (app-config.yaml).',
    'errors.catalogEntityConflict':
      "Impossible de créer une nouvelle demande d'achat en raison d'un conflit d'entités de catalogue.",
    'errors.catalogInfoExists':
      "Le fichier catalog-info.yaml existant déjà dans le référentiel, aucune nouvelle PR ne sera créée. Toutefois, l'entité sera toujours enregistrée sur la page du catalogue.",
    'errors.codeOwnersNotFound':
      'Le fichier CODEOWNERS est manquant dans le référentiel. Ajoutez un fichier CODEOWNERS pour créer une nouvelle PR.',
    'errors.errorOccurred': "Une erreur s'est produite",
    'errors.failedToCreatePullRequest':
      "Échec de la création de la demande d'extraction",
    'errors.noIntegrationsConfigured':
      "Aucune intégration GitHub ou GitLab n'est configurée. Veuillez ajouter au moins une intégration pour utiliser la fonction d'importation en masse.",
    'errors.prErrorPermissions':
      "Impossible de créer une nouvelle PR en raison d'autorisations insuffisantes. Contactez votre administrateur.",
    'errors.repoEmpty':
      'Impossible de créer une nouvelle PR car le référentiel est vide. Effectuez un premier commit sur le référentiel.',
    'forms.footer.createPullRequest': 'Créer une demande de fusion',
    'forms.footer.createPullRequests': 'Créer des demandes de fusion',
    'forms.footer.createServiceNowTicket': 'Créer un ticket ServiceNow',
    'forms.footer.createServiceNowTickets': 'Créer des tickets ServiceNow',
    'forms.footer.importTooltip':
      "Les fichiers Catalog-info.yaml doivent être générés pour l'importation.",
    'forms.footer.pullRequestTooltip':
      "Les fichiers Catalog-info.yaml doivent être générés avant la création d'une demande d'extraction.",
    'forms.footer.selectRepositoryTooltip':
      "Sélectionnez un référentiel pour l'importation.",
    'forms.footer.serviceNowTooltip':
      "Les fichiers Catalog-info.yaml doivent être générés avant la création d'un ticket ServiceNow.",
    'importActions.errorFetchingData':
      'Erreur lors de la récupération des données',
    'importActions.loading': 'Chargement...',
    'importActions.noActions':
      "Aucune action d'importation trouvée pour ce référentiel.",
    'page.addRepositoriesSubtitle':
      'Ajoutez des référentiels à Red Hat Developer Hub en 4 étapes',
    'page.addRepositoriesTitle': 'Ajouter des référentiels',
    'page.importEntitiesSubtitle': 'Importer dans Red Hat Developer Hub',
    'page.importEntitiesTitle': "Entités d'importation",
    'page.subtitle': 'Importer des entités dans Red Hat Developer Hub',
    'page.title': 'Importation en vrac',
    'page.typeLink': 'Importation en vrac',
    'permissions.addRepositoriesMessage':
      "Pour ajouter des référentiels, contactez votre administrateur pour obtenir l'autorisation `bulk.import`.",
    'permissions.title': 'Autorisation requise',
    'permissions.viewRepositoriesMessage':
      "Pour consulter les référentiels ajoutés, contactez votre administrateur pour obtenir l'autorisation `bulk.import`.",
    'previewFile.closeDrawer': 'Fermez le tiroir',
    'previewFile.failedToCreatePR': 'Échec de la création de la demande PR',
    'previewFile.failedToFetchPR':
      "Impossible de récupérer la requête d'extraction. Un nouveau fichier YAML a été généré ci-dessous.",
    'previewFile.invalidEntityYaml':
      "L'entité YAML dans votre demande d'extraction est invalide (fichier vide ou apiVersion, kind ou metadata.name manquants). Un nouveau fichier YAML a été généré ci-dessous.",
    'previewFile.keyValuePlaceholder': 'clé1: valeur1; clé2: valeur2',
    'previewFile.prCreationUnsuccessful':
      'La création de R a échoué pour certains référentiels. Cliquez sur « Modifier » pour voir la raison.',
    'previewFile.preview': 'Aperçu',
    'previewFile.previewFile': "Fichier d'aperçu",
    'previewFile.previewFiles': 'Aperçu des fichiers',
    'previewFile.pullRequest.annotations': 'Annotations',
    'previewFile.pullRequest.bodyLabel': 'Corps de {{tool}}',
    'previewFile.pullRequest.bodyPlaceholder':
      'Un texte descriptif compatible avec Markdown',
    'previewFile.pullRequest.codeOwnersWarning':
      'ATTENTION : Cette opération peut échouer si aucun fichier CODEOWNERS n’est trouvé à l’emplacement cible.',
    'previewFile.pullRequest.componentNameLabel': 'Nom du composant créé',
    'previewFile.pullRequest.componentNamePlaceholder': 'Nom du composant',
    'previewFile.pullRequest.details': 'Détails de {{tool}}',
    'previewFile.pullRequest.entityConfiguration': "Configuration de l'entité",
    'previewFile.pullRequest.entityOwnerHelper':
      'Sélectionnez un propriétaire dans la liste ou saisissez une référence à un groupe ou à un utilisateur.',
    'previewFile.pullRequest.entityOwnerLabel': "Propriétaire de l'entité",
    'previewFile.pullRequest.entityOwnerPlaceholder': 'groupes et utilisateurs',
    'previewFile.pullRequest.labels': 'Étiquettes',
    'previewFile.pullRequest.loadingText':
      'Chargement des groupes et des utilisateurs',
    'previewFile.pullRequest.mergeRequest': 'Demande de fusion',
    'previewFile.pullRequest.previewEntities': 'Entités de prévisualisation',
    'previewFile.pullRequest.serviceNowTicket': 'Ticket ServiceNow',
    'previewFile.pullRequest.spec': 'Spéc.',
    'previewFile.pullRequest.title': 'Demande d’extraction',
    'previewFile.pullRequest.titleLabel': 'Titre de {{tool}}',
    'previewFile.pullRequest.titlePlaceholder':
      "Ajouter des fichiers de descripteurs d'entités du catalogue Backstage",
    'previewFile.pullRequest.useCodeOwnersFile':
      "Utilisez le fichier *CODEOWNERS* comme propriétaire de l'entité",
    'previewFile.pullRequestPendingApproval':
      "La requête [{{pullRequestText}}]({{pullRequestUrl}}) est en attente d'approbation",
    'previewFile.pullRequestText': 'demande d’extraction',
    'previewFile.useSemicolonSeparator':
      'Utilisez un point-virgule pour séparer {{label}}',
    'previewFile.viewRepository': 'Voir le référentiel',
    'repositories.addedRepositories': 'Ajout de référentiels',
    'repositories.addedRepositoriesCount': 'Réérentiels ajoutés ({{count}})',
    'repositories.cannotRemoveRepositoryUrl':
      'Impossible de supprimer le référentiel car son URL est manquante.',
    'repositories.deleteRepository': 'Supprimer le Référentiel',
    'repositories.editCatalogInfoTooltip':
      "Demande d'extraction de la modification du fichier catalog-info.yaml",
    'repositories.errorOccured': 'Une erreur est survenue',
    'repositories.errorOccuredWhileFetching':
      "Une erreur s'est produite lors de la récupération de la requête d'extraction.",
    'repositories.failedToCreatePullRequest':
      "Échec de la création de la demande d'extraction",
    'repositories.import': 'Importer',
    'repositories.importedEntities': 'Entités importées',
    'repositories.importedEntitiesCount': 'Entités importées ({{count}})',
    'repositories.noProjectsFound': "Aucun projet disponible à l'importation.",
    'repositories.noRecordsFound':
      "Aucun référentiel disponible pour l'importation.",
    'repositories.pr': 'PR',
    'repositories.refresh': 'Actualiser',
    'repositories.removeRepositoryQuestion':
      'Supprimer {{repoName}} {{repositoryText}} ?',
    'repositories.removeRepositoryWarning':
      "La suppression d'un référentiel efface toutes les informations associées de la page Catalogue.",
    'repositories.removeRepositoryWarningGitlab':
      'Sa suppression effacera toutes les informations associées de la page Catalogue.',
    'repositories.removeRepositoryWarningOrchestrator':
      "Supprimer le référentiel et les informations de flux de travail de l'orchestrateur associé.",
    'repositories.removeRepositoryWarningScaffolder':
      "La suppression d'un référentiel entraînera également la suppression de toutes les informations relatives aux tâches de génération de code associées.",
    'repositories.removeTooltipDisabled':
      'Ce référentiel a été ajouté au fichier app-config. Pour le supprimer, modifiez directement le fichier.',
    'repositories.removeTooltipRepositoryOrchestrator':
      "Supprimer le référentiel et les informations de flux de travail de l'orchestrateur associé",
    'repositories.removeTooltipRepositoryScaffolder':
      "Supprimer le référentiel et les informations de tâche de l'échafaudeur associées",
    'repositories.removing': 'Suppression...',
    'repositories.repositoryText': 'référentiel',
    'repositories.unableToRemoveRepository':
      'Impossible de supprimer le référentiel. {{error}}',
    'repositories.viewCatalogInfoTooltip':
      'Afficher le fichier catalog-info.yaml',
    'sidebar.bulkImport': 'Importation en vrac',
    'status.added': 'Ajouté',
    'status.alreadyImported': 'Déjà importé',
    'status.failedCreatingPR': 'Échec de la création de la demande PR',
    'status.imported': 'Importé',
    'status.missingConfigurations': 'Configurations manquantes',
    'status.pullRequestRejected': 'La demande de fusion a été rejetée.',
    'status.readyToImport': 'Prêt à importer',
    'status.waitingForApproval': "En attente d'approbation",
    'status.waitingForPullRequestToStart':
      'En attente du début de la demande de fusion',
    'steps.chooseApprovalTool':
      'Choisissez un outil de gestion de versions pour la création de demandes de fusion.',
    'steps.chooseItems': 'Choisissez les articles que vous souhaitez importer',
    'steps.chooseRepositories':
      'Choisissez les articles que vous souhaitez importer',
    'steps.editPullRequest':
      "Afficher les détails de la demande de fusion/d'extraction",
    'steps.generateCatalogInfo':
      'Générez un fichier catalog-info.yaml pour chaque élément sélectionné.',
    'steps.generateCatalogInfoItems':
      'Générez un fichier catalog-info.yaml pour chaque élément sélectionné.',
    'steps.trackStatus': "Suivre l'état d'approbation",
    'table.headers.actions': 'Actions',
    'table.headers.catalogInfoYaml': 'catalog-info.yaml',
    'table.headers.group': 'Groupe',
    'table.headers.lastUpdated': 'Dernière mise à jour',
    'table.headers.name': 'Nom',
    'table.headers.organization': 'Organisation',
    'table.headers.organizationGroup': 'Organisation/groupe',
    'table.headers.repoUrl': 'URL du référentiel ',
    'table.headers.status': 'Statut',
    'table.headers.taskStatus': 'Statut de la tâche',
    'table.headers.url': 'URL',
    'table.pagination.rows10': '10 lignes',
    'table.pagination.rows100': '100 lignes',
    'table.pagination.rows20': '20 lignes',
    'table.pagination.rows5': '5 rangées',
    'table.pagination.rows50': '50 lignes',
    'tasks.taskCancelled': 'Annulé',
    'tasks.taskCompleted': 'Terminé',
    'tasks.taskFailed': 'Ayant échoué',
    'tasks.taskId': 'ID de tâche',
    'tasks.taskLink': 'Lien vers la tâche',
    'tasks.taskOpen': 'Ouvrir',
    'tasks.taskProcessing': 'Traitement',
    'tasks.taskSkipped': 'Ignoré',
    'tasks.tasksFor': 'Tâches pour {{importJobStatusId}}',
    'tasks.viewTask': 'Afficher la tâche',
    'time.daysAgo': ' il y a {{count}} jour(s)',
    'time.hoursAgo': ' il y a {{count}} heure(s)',
    'time.minutesAgo': ' il y a {{count}} minute(s)',
    'time.secondsAgo': ' il y a {{count}} seconde(s)',
    'validation.componentNameInvalid':
      '"{{value}}" n\'est pas valide ; une chaîne de caractères composée de séquences [a-zA-Z0-9] séparées par [-_.], d\'au maximum 63 caractères au total, est attendue. Pour en savoir plus sur le format des fichiers de catalogue, consultez : https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md',
    'validation.componentNameRequired': 'Le nom du composant est requis.',
    'validation.descriptionRequired':
      'La description de {{approvalTool}} est requise',
    'validation.entityOwnerRequired': "Le propriétaire de l'entité est requis.",
    'validation.keyValuePairFormat':
      'Chaque entrée doit comporter une clé et une valeur séparées par deux-points.',
    'validation.titleRequired': '{{approvalTool}} Le titre est requis',
    'workflows.viewWorkflow': 'Afficher le flux de travail',
    'workflows.workflowAborted': 'Avorté',
    'workflows.workflowActive': 'Actif',
    'workflows.workflowCompleted': 'Terminé',
    'workflows.workflowError': 'Erreur',
    'workflows.workflowFetchError': 'Erreur de récupération du flux de travail',
    'workflows.workflowId': 'ID du flux de travail',
    'workflows.workflowLink': 'Lien vers le flux de travail',
    'workflows.workflowPending': 'En attente',
    'workflows.workflowSuspended': 'Suspendu',
    'workflows.workflowsFor': 'Flux de travail pour {{importJobStatusId}}',
  },
});

export default bulkImportTranslationFr;
