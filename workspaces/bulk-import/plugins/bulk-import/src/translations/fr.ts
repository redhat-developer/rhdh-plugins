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
    'page.title': 'Importation en vrac',
    'page.subtitle': 'Importer des entités dans Red Hat Developer Hub',
    'page.addRepositoriesTitle': 'Ajouter des référentiels',
    'page.importEntitiesTitle': "Entités d'importation",
    'page.addRepositoriesSubtitle':
      'Ajoutez des référentiels à Red Hat Developer Hub en 4 étapes',
    'page.importEntitiesSubtitle': 'Importer dans Red Hat Developer Hub',
    'page.typeLink': 'Importation en vrac',
    'sidebar.bulkImport': 'Importation en vrac',
    'permissions.title': 'Autorisation requise',
    'permissions.addRepositoriesMessage':
      "Pour ajouter des référentiels, contactez votre administrateur pour obtenir l'autorisation `bulk.import`.",
    'status.alreadyImported': 'Déjà importé',
    'status.added': 'Ajouté',
    'status.waitingForApproval': "En attente d'approbation",
    'status.imported': 'Importé',
    'status.readyToImport': 'Prêt à importer',
    'status.waitingForPullRequestToStart':
      'En attente du début de la demande de fusion',
    'status.missingConfigurations': 'Configurations manquantes',
    'status.failedCreatingPR': 'Échec de la création de la demande PR',
    'status.pullRequestRejected': 'La demande de fusion a été rejetée.',
    'errors.prErrorPermissions':
      "Impossible de créer une nouvelle PR en raison d'autorisations insuffisantes. Contactez votre administrateur.",
    'errors.catalogInfoExists':
      "Le fichier catalog-info.yaml existant déjà dans le référentiel, aucune nouvelle PR ne sera créée. Toutefois, l'entité sera toujours enregistrée sur la page du catalogue.",
    'table.headers.name': 'Nom',
    'table.headers.url': 'URL',
    'table.headers.repoUrl': 'URL du référentiel ',
    'table.headers.organization': 'Organisation',
    'table.headers.organizationGroup': 'Organisation/groupe',
    'table.headers.group': 'Groupe',
    'table.headers.status': 'Statut',
    'table.headers.taskStatus': 'Statut de la tâche',
    'table.headers.lastUpdated': 'Dernière mise à jour',
    'table.headers.actions': 'Actions',
    'table.headers.catalogInfoYaml': 'catalog-info.yaml',
    'table.pagination.rows5': '5 rangées',
    'table.pagination.rows10': '10 lignes',
    'table.pagination.rows20': '20 lignes',
    'table.pagination.rows50': '50 lignes',
    'table.pagination.rows100': '100 lignes',
    'steps.chooseApprovalTool':
      'Choisissez un outil de gestion de versions pour la création de demandes de fusion.',
    'steps.chooseRepositories':
      'Choisissez les articles que vous souhaitez importer',
    'steps.chooseItems': 'Choisissez les articles que vous souhaitez importer',
    'steps.generateCatalogInfo':
      'Générez un fichier catalog-info.yaml pour chaque élément sélectionné.',
    'steps.generateCatalogInfoItems':
      'Générez un fichier catalog-info.yaml pour chaque élément sélectionné.',
    'steps.editPullRequest':
      "Afficher les détails de la demande de fusion/d'extraction",
    'steps.trackStatus': "Suivre l'état d'approbation",
    'addRepositories.approvalTool.title': 'Outil de contrôle de version',
    'addRepositories.approvalTool.description':
      'Choisissez un outil de gestion de versions pour la création des demandes de fusion.',
    'addRepositories.approvalTool.tooltip':
      "L'importation nécessite une approbation. Une fois la demande d'extraction approuvée, les référentiels seront importés sur la page Catalogue.",
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.repositoryType.title': 'Type de référentiel ',
    'addRepositories.repositoryType.repository': 'Référentiel ',
    'addRepositories.repositoryType.organization': 'Organisation',
    'addRepositories.repositoryType.project': 'Projet',
    'addRepositories.repositoryType.group': 'Groupe',
    'addRepositories.searchPlaceholder': 'Recherche',
    'addRepositories.clearSearch': 'Effacer la recherche',
    'addRepositories.noRepositoriesFound': 'Aucun référentiel trouvé',
    'addRepositories.allRepositoriesAdded':
      'Tous les référentiels sont ajoutés',
    'addRepositories.noSelection': 'Aucun',
    'addRepositories.selectRepositories': 'Sélectionner les référentiels',
    'addRepositories.selectedRepositories': 'référentiels',
    'addRepositories.selectedProjects': 'projets',
    'addRepositories.selectedLabel': 'Sélectionné',
    'addRepositories.selectedCount': '{{count}} sélectionné',
    'addRepositories.addSelected': 'Ajouter la sélection',
    'addRepositories.generateCatalogInfo':
      'Générer le fichier catalog-info.yaml',
    'addRepositories.editPullRequest': 'Modifier la demande de fusion',
    'addRepositories.preview': 'Aperçu',
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
    'time.daysAgo': ' il y a {{count}} jour(s)',
    'time.hoursAgo': ' il y a {{count}} heure(s)',
    'time.minutesAgo': ' il y a {{count}} minute(s)',
    'time.secondsAgo': ' il y a {{count}} seconde(s)',
    'previewFile.previewFile': "Fichier d'aperçu",
    'previewFile.previewFiles': 'Aperçu des fichiers',
    'previewFile.failedToCreatePR': 'Échec de la création de la demande PR',
    'previewFile.prCreationUnsuccessful':
      'La création de R a échoué pour certains référentiels. Cliquez sur « Modifier » pour voir la raison.',
    'previewFile.failedToFetchPR':
      "Impossible de récupérer la requête d'extraction. Un nouveau fichier YAML a été généré ci-dessous.",
    'previewFile.invalidEntityYaml':
      "L'entité YAML dans votre demande d'extraction est invalide (fichier vide ou apiVersion, kind ou metadata.name manquants). Un nouveau fichier YAML a été généré ci-dessous.",
    'previewFile.pullRequestText': 'demande d’extraction',
    'previewFile.viewRepository': 'Voir le référentiel',
    'previewFile.closeDrawer': 'Fermez le tiroir',
    'previewFile.keyValuePlaceholder': 'key1: value2; key2: value2',
    'previewFile.useSemicolonSeparator':
      'Utilisez un point-virgule pour séparer {{label}}',
    'previewFile.pullRequest.title': 'Demande d’extraction',
    'previewFile.pullRequest.mergeRequest': 'Demande de fusion',
    'previewFile.pullRequest.serviceNowTicket': 'Ticket ServiceNow',
    'previewFile.pullRequest.details': '{{tool}} détails',
    'previewFile.pullRequest.titleLabel': '{{outil}} titre',
    'previewFile.pullRequest.bodyLabel': '{{tool}} corps',
    'previewFile.pullRequest.titlePlaceholder':
      "Ajouter des fichiers de descripteurs d'entités du catalogue Backstage",
    'previewFile.pullRequest.bodyPlaceholder':
      'Un texte descriptif compatible avec Markdown',
    'previewFile.pullRequest.entityConfiguration': "Configuration de l'entité",
    'previewFile.pullRequest.componentNameLabel': 'Nom du composant créé',
    'previewFile.pullRequest.componentNamePlaceholder': 'Nom du composant',
    'previewFile.pullRequest.entityOwnerLabel': "Propriétaire de l'entité",
    'previewFile.pullRequest.entityOwnerPlaceholder': 'groupes et utilisateurs',
    'previewFile.pullRequest.entityOwnerHelper':
      'Sélectionnez un propriétaire dans la liste ou saisissez une référence à un groupe ou à un utilisateur.',
    'previewFile.pullRequest.loadingText':
      'Chargement des groupes et des utilisateurs',
    'previewFile.pullRequest.previewEntities': 'Entités de prévisualisation',
    'previewFile.pullRequest.annotations': 'Annotations',
    'previewFile.pullRequest.labels': 'Étiquettes',
    'previewFile.pullRequest.spec': 'Spéc.',
    'previewFile.pullRequest.useCodeOwnersFile':
      "Utilisez le fichier *CODEOWNERS* comme propriétaire de l'entité",
    'previewFile.pullRequest.codeOwnersWarning':
      'ATTENTION : Cette opération peut échouer si aucun fichier CODEOWNERS n’est trouvé à l’emplacement cible.',
    'forms.footer.createServiceNowTicket': 'Créer un ticket ServiceNow',
    'forms.footer.createServiceNowTickets': 'Créer des tickets ServiceNow',
    'forms.footer.createPullRequest': 'Créer une demande de fusion',
    'forms.footer.createPullRequests': 'Créer des demandes de fusion',
    'forms.footer.selectRepositoryTooltip':
      "Sélectionnez un référentiel pour l'importation.",
    'forms.footer.serviceNowTooltip':
      "Les fichiers Catalog-info.yaml doivent être générés avant la création d'un ticket ServiceNow.",
    'forms.footer.importTooltip':
      "Les fichiers Catalog-info.yaml doivent être générés pour l'importation.",
    'forms.footer.pullRequestTooltip':
      "Les fichiers Catalog-info.yaml doivent être générés avant la création d'une demande d'extraction.",
    'tasks.tasksFor': 'Tâches pour {{importJobStatusId}}',
    'tasks.taskLink': 'Lien vers la tâche',
    'tasks.viewTask': 'Afficher la tâche',
    'tasks.taskCancelled': 'Annulé',
    'tasks.taskCompleted': 'Terminé',
    'tasks.taskFailed': 'Ayant échoué',
    'tasks.taskOpen': 'Ouvrir',
    'tasks.taskProcessing': 'Traitement',
    'tasks.taskSkipped': 'Ignoré',
    'workflows.workflowsFor': 'Flux de travail pour {{importJobStatusId}}',
    'workflows.workflowLink': 'Lien vers le flux de travail',
    'workflows.viewWorkflow': 'Afficher le flux de travail',
    'workflows.workflowPending': 'En attente',
    'workflows.workflowActive': 'Actif',
    'workflows.workflowCompleted': 'Terminé',
    'workflows.workflowAborted': 'Avorté',
    'workflows.workflowError': 'Erreur',
    'workflows.workflowFetchError': 'Erreur de récupération du flux de travail',
    'workflows.workflowSuspended': 'Suspendu',
    'importActions.loading': 'Chargement...',
    'importActions.errorFetchingData':
      'Erreur lors de la récupération des données',
    'importActions.noActions':
      "Aucune action d'importation trouvée pour ce référentiel.",
  },
});

export default bulkImportTranslationFr;
