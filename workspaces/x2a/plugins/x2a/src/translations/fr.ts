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
import { x2aPluginTranslationRef } from './ref';

/**
 * fr translation for plugin.x2a.
 * @public
 */
const x2aPluginTranslationFr = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'artifact.types.ansible_project': 'Projet AAP',
    'artifact.types.migrated_sources': 'Sources migrées',
    'artifact.types.migration_plan': 'Plan de migration du projet',
    'artifact.types.module_migration_plan': 'Plan de migration des modules',
    'artifact.types.project_metadata': 'Métadonnées du projet',
    'bulkRun.cancel': 'Annuler',
    'bulkRun.confirm': 'Exécuter tout',
    'bulkRun.errorGlobal': "Échec de l'exécution de l'opération en masse",
    'bulkRun.errorModuleStart':
      'Échec du démarrage de la phase « {{phase}} » pour le module « {{moduleName}} ».',
    'bulkRun.errorProject':
      "Échec de l'exécution des modules dans le projet « {{name}} »",
    'bulkRun.globalAction': 'Exécuter tout',
    'bulkRun.globalConfirm.message':
      "Cela déclenchera la phase de migration suivante pour tous les modules éligibles de tous les projets auxquels vous avez un accès en écriture, y compris les projets qui ne sont pas visibles sur la page actuelle. Assurez-vous d'avoir vérifié tous les artefacts nécessaires dans les référentiels cibles avant d'exécuter cette action.",
    'bulkRun.globalConfirm.messageInitRetrigger':
      "Certains projets peuvent être réexécutés lors de la phase d'initialisation. Leur phase de découverte sera également réactivée.",
    'bulkRun.globalConfirm.noInitEligible':
      "Aucun projet n'est actuellement éligible pour une nouvelle exécution de la phase d'initialisation.",
    'bulkRun.globalConfirm.title':
      'Exécuter tous les projets et modules éligibles ?',
    'bulkRun.globalConfirm.userPromptLabel':
      'Invite utilisateur pour le redéclenchement initial (facultatif)',
    'bulkRun.globalConfirm.userPromptPlaceholder':
      "Si certains projets nécessitent une réinitialisation de leur phase d'initialisation, cette invite sera utilisée pour personnaliser la conversion…",
    'bulkRun.projectAction': 'Exécuter tous les modules',
    'bulkRun.projectConfirm.message':
      "Cela déclenchera la prochaine phase de migration pour chaque module de ce projet dont l'état actuel le permet. Assurez-vous d'avoir vérifié tous les artefacts nécessaires dans les référentiels cibles avant d'exécuter cette action. Les modules non admissibles seront ignorés.",
    'bulkRun.projectConfirm.title':
      'Exécuter tous les modules du projet « {{name}} » ?',
    'bulkRun.projectPageAction': 'Exécuter tout',
    'bulkRun.projectPageConfirm.message':
      "Cela déclenchera la prochaine phase de migration pour chaque module de ce projet dont l'état actuel le permet. Assurez-vous d'avoir vérifié tous les artefacts nécessaires dans les référentiels cibles avant d'exécuter cette action. Les modules non admissibles seront ignorés.",
    'bulkRun.projectPageConfirm.title':
      'Exécuter tous les modules dans "{{name}}" ?',
    'common.newProject': 'Nouveau projet',
    'editProjectDialog.cancel': 'Annuler',
    'editProjectDialog.nameRequired': 'Le nom est requis',
    'editProjectDialog.ownerChangeConfirm': 'Transférer la propriété',
    'editProjectDialog.ownerChangeWarning':
      "Le changement de propriétaire peut entraîner la perte d'accès à ce projet si vos autorisations ne couvrent pas le nouveau propriétaire. Un administrateur peut restaurer l'accès si nécessaire.",
    'editProjectDialog.ownerChangeWarningTitle':
      'Confirmer le transfert de propriété',
    'editProjectDialog.ownerFormatHint':
      "Doit être une référence d'entité Backstage, p.ex. user:default/nom ou group:default/equipe",
    'editProjectDialog.title': 'Modifier le projet',
    'editProjectDialog.update': 'Mettre à jour',
    'editProjectDialog.updateError': 'Échec de la mise à jour du projet',
    empty: '-',
    'emptyPage.noConversionInitiatedYet':
      "Aucune conversion n'a encore été initiée.",
    'emptyPage.noConversionInitiatedYetDescription':
      "Initier et suivre la conversion de l'automatisation existante en Ansible prêt pour la production.",
    'emptyPage.notAllowedDescription':
      "Vous n'êtes pas autorisé à accéder aux projets de conversion.",
    'emptyPage.notAllowedTitle': 'Accès refusé',
    'emptyPage.startFirstConversion': 'Commencez la première conversion',
    'initPhaseCard.title': 'Phase de découverte',
    'module.actions.cancelPhase': 'Annuler la phase {{phase}}',
    'module.actions.cancelPhaseError':
      "Échec de l'annulation de la phase pour le module",
    'module.actions.runNextPhase': 'Exécutez la phase suivante {{phase}}',
    'module.actions.runNextPhaseError':
      "Échec de l'exécution de la phase suivante pour le module",
    'module.artifacts': 'Artefacts',
    'module.currentPhase': 'Phase actuelle',
    'module.lastUpdate': 'Dernière mise à jour',
    'module.name': 'Nom',
    'module.notStarted': 'Non démarré',
    'module.phases.analyze': 'Analyser',
    'module.phases.init': 'Initialisation',
    'module.phases.migrate': 'Émigrer',
    'module.phases.none': '-',
    'module.phases.publish': 'Publier',
    'module.sourcePath': 'Chemin source',
    'module.status': 'Statut',
    'module.statuses.cancelled': 'Annulé',
    'module.statuses.error': 'Erreur',
    'module.statuses.none': '-',
    'module.statuses.pending': 'En attente',
    'module.statuses.running': 'En cours d’exécution',
    'module.statuses.success': 'Succès',
    'module.summary.cancelled': 'Annulé',
    'module.summary.error': 'Erreur',
    'module.summary.finished': 'Fini',
    'module.summary.pending': 'En attente',
    'module.summary.running': 'En cours d’exécution',
    'module.summary.toReview_one':
      '{{count}} module contenant des artefacts à examiner',
    'module.summary.toReview_other':
      '{{count}} modules contenant des artefacts à examiner',
    'module.summary.total': 'Total',
    'module.summary.waiting': 'En attente',
    'modulePage.artifacts.ansible_project': 'Projet AAP',
    'modulePage.artifacts.description':
      'Ces éléments sont générés par le processus de conversion et peuvent être consultés.',
    'modulePage.artifacts.migrated_sources': 'Sources migrées',
    'modulePage.artifacts.migration_plan': 'Plan global de migration du projet',
    'modulePage.artifacts.module_migration_plan': 'Plan de module par analyse',
    'modulePage.artifacts.title': 'Objets à examiner',
    'modulePage.phases.analyzeInstructions':
      "Avant de lancer l'analyse, examinez d'abord le plan de migration global du projet. Son contenu orientera l'analyse du module.",
    'modulePage.phases.cancel': 'Annuler',
    'modulePage.phases.cancelError':
      "Échec de l'annulation de la phase pour le module",
    'modulePage.phases.commitId': 'ID du dernier commit',
    'modulePage.phases.duration': 'Durée',
    'modulePage.phases.errorDetails': 'Détails de l’erreur',
    'modulePage.phases.hideLog': 'Masquer le journal',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.k8sJobName': 'Nom de la tâche Kubernetes',
    'modulePage.phases.logWaitingForStream':
      'En attente des journaux de sortie du cluster...',
    'modulePage.phases.migrateInstructions':
      'Avant de lancer la migration, veuillez consulter le plan de migration des modules. Le processus de migration convertira le code source en Ansible conformément au plan.',
    'modulePage.phases.noLogsAvailable':
      'Aucun journal disponible pour le moment...',
    'modulePage.phases.publishInstructions':
      'Avant publication, veuillez vérifier les sources migrées. Le processus de publication enregistrera le code converti dans le référentiel  cible.',
    'modulePage.phases.reanalyzeInstructions':
      "Le plan de migration des modules est déjà en place. Si le plan global de migration du projet a été mis à jour, relancez l'analyse pour prendre en compte les modifications.",
    'modulePage.phases.remigrateInstructions':
      'Les sources migrées sont déjà présentes. Relancez la migration pour recréer le code Ansible converti.',
    'modulePage.phases.republishInstructions':
      'Le module a déjà été publié. Relancez la publication pour mettre à jour le référentiel cible.',
    'modulePage.phases.rerunAnalyze':
      'Recréer le plan de migration des modules',
    'modulePage.phases.rerunMigrate': 'Recréer les sources migrées',
    'modulePage.phases.rerunPublish': 'Republier dans le référentiel cible',
    'modulePage.phases.resyncMigrationPlanInstructions':
      "Resynchronisez la liste des modules pour qu'elle corresponde au plan de migration.",
    'modulePage.phases.runAnalyze': 'Élaborer un plan de migration de modules',
    'modulePage.phases.runError':
      "Échec de l'exécution de la phase pour le module",
    'modulePage.phases.runMigrate': 'Migration des sources du module',
    'modulePage.phases.runPublish': 'Publier dans le référentiel cible',
    'modulePage.phases.startedAt': 'Commencé à',
    'modulePage.phases.status': 'Statut',
    'modulePage.phases.statuses.cancelled': 'Annulé',
    'modulePage.phases.statuses.error': 'Erreur',
    'modulePage.phases.statuses.notStarted': 'non démarré',
    'modulePage.phases.statuses.pending': 'En attente',
    'modulePage.phases.statuses.running': 'En cours d’exécution',
    'modulePage.phases.statuses.success': 'Succès',
    'modulePage.phases.telemetry.agentName': "Nom de l'agent",
    'modulePage.phases.telemetry.duration': 'Durée',
    'modulePage.phases.telemetry.inputTokens': "Jetons d'entrée",
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'Aucune télémétrie disponible',
    'modulePage.phases.telemetry.outputTokens': 'Jetons de sortie',
    'modulePage.phases.telemetry.title': 'Télémétrie',
    'modulePage.phases.telemetry.toolCalls': "Nombre d'appels d'outils",
    'modulePage.phases.title': 'Phases de migration',
    'modulePage.phases.viewLog': 'Afficher le journal',
    'modulePage.title': 'Détails du module',
    'page.subtitle':
      "Lancer et suivre la conversion asynchrone de l'automatisation existante en playbooks Ansible prêts pour la production.",
    'page.title': 'Centre de conversion',
    'project.description': 'Description',
    'project.dirName': 'Nom du répertoire',
    'project.id': 'ID',
    'project.noModules': 'Aucun module trouvé pour le moment...',
    'project.ownedBy': 'Propriétaire',
    'project.statuses.completed': 'Terminé',
    'project.statuses.created': 'Créé',
    'project.statuses.failed': 'Ayant échoué',
    'project.statuses.inProgress': 'En cours',
    'project.statuses.initialized': 'Initialisé',
    'project.statuses.initializing': 'Initialisation',
    'project.statuses.none': '-',
    'projectDetailsCard.description': 'Description',
    'projectDetailsCard.dirName': 'Nom du répertoire',
    'projectDetailsCard.edit': 'Modifier',
    'projectDetailsCard.name': 'Nom',
    'projectDetailsCard.ownedBy': 'Propriétaire',
    'projectDetailsCard.sourceRepo': 'Référentiel de sources',
    'projectDetailsCard.status': 'Statut',
    'projectDetailsCard.targetRepo': 'Référentiel cible',
    'projectDetailsCard.title': 'Détails du projet',
    'projectModulesCard.noModules': 'Aucun module trouvé pour le moment...',
    'projectModulesCard.published': 'publié',
    'projectModulesCard.title': 'Modules ({{count}})',
    'projectModulesCard.toReview': 'Vérifier',
    'projectPage.actionsTooltip':
      'Cliquez pour ouvrir le menu des actions du projet',
    'projectPage.deleteConfirm.cancel': 'Annuler',
    'projectPage.deleteConfirm.confirm': 'Supprimer',
    'projectPage.deleteConfirm.message':
      'Ce projet, ainsi que tous ses modules et tâches, seront définitivement supprimés. Cette action est irréversible. Les artefacts conservés dans le référentiel cible seront préservés.',
    'projectPage.deleteConfirm.title': 'Supprimer le projet « {{name}} » ?',
    'projectPage.deleteError': 'Échec de la suppression du projet',
    'projectPage.deleteProject': 'Supprimer',
    'projectPage.title': 'Projet',
    'projectTable.deleteError': 'Échec de la suppression du projet',
    'retriggerInit.confirm.confirmButton': 'Redéclenchement',
    'retriggerInit.confirm.message':
      "Cela relancera la phase de découverte du projet, en démarrant une nouvelle tâche d'initialisation. Tous les résultats d'initialisation précédents seront remplacés.",
    'retriggerInit.confirm.title':
      'Réinitialiser la phase d\'initialisation pour "{{name}}" ?',
    'retriggerInit.confirm.userPromptLabel': 'Invite utilisateur (facultatif)',
    'retriggerInit.confirm.userPromptPlaceholder':
      'Fournissez des instructions supplémentaires pour la conversion…',
    'retriggerInit.error':
      "Échec de la relance de l'initialisation pour le projet « {{name}} ».",
    'retriggerInit.errorStart':
      "Échec du démarrage de l'initialisation du projet",
    'retriggerInit.firstTrigger.confirmButton':
      "Phase d'initialisation du déclencheur",
    'retriggerInit.firstTrigger.message':
      "Une fois confirmée, la phase de découverte de ce projet débutera. Il se peut que l'on vous demande vos jetons SCM source et cible.",
    'retriggerInit.firstTrigger.title':
      'Déclencher la phase d\'initialisation pour "{{name}}" ?',
    'retriggerInit.firstTrigger.userPromptLabel':
      'Invite utilisateur (facultatif)',
    'retriggerInit.firstTrigger.userPromptPlaceholder':
      'Fournissez des instructions supplémentaires pour la conversion…',
    'rulesPage.addRule': 'Ajouter une règle',
    'rulesPage.deleteConfirm.cancel': 'Annuler',
    'rulesPage.deleteConfirm.confirm': 'Supprimer',
    'rulesPage.deleteConfirm.deleteError':
      'Erreur lors de la suppression de la règle',
    'rulesPage.deleteConfirm.message':
      'Cette règle sera définitivement supprimée. Les projets existants ayant déjà accepté cette règle ne seront pas affectés.',
    'rulesPage.deleteConfirm.title': 'Supprimer la règle « {{title}} » ?',
    'rulesPage.dialog.cancel': 'Annuler',
    'rulesPage.dialog.createError': 'Erreur lors de la création de la règle',
    'rulesPage.dialog.createTitle': 'Créer une règle',
    'rulesPage.dialog.descriptionField': 'Description',
    'rulesPage.dialog.editTitle': 'Modifier la règle',
    'rulesPage.dialog.requiredField': 'Obligatoire pour tous les projets',
    'rulesPage.dialog.save': 'Enregistrer',
    'rulesPage.dialog.titleField': 'Titre',
    'rulesPage.dialog.updateError': 'Erreur lors de la mise à jour de la règle',
    'rulesPage.manageRules': 'Gérer les règles',
    'rulesPage.notAllowed':
      "Vous n'avez pas la permission de gérer les règles.",
    'rulesPage.subtitle':
      'Gérez les règles que les projets doivent accepter lors de la création.',
    'rulesPage.table.createdAt': 'Créé',
    'rulesPage.table.deleteRule': 'Supprimer la règle',
    'rulesPage.table.description': 'Description',
    'rulesPage.table.editRule': 'Modifier la règle',
    'rulesPage.table.id': 'ID',
    'rulesPage.table.noRules': 'Aucune règle définie pour le moment.',
    'rulesPage.table.optional': 'Optionnel',
    'rulesPage.table.required': 'Obligatoire',
    'rulesPage.table.title': 'Titre',
    'rulesPage.title': 'Règles de conversion',
    'scaffolder.rulesAcceptance.fetchError':
      'Erreur lors du chargement des règles',
    'scaffolder.rulesAcceptance.loadingRules': 'Chargement des règles...',
    'scaffolder.rulesAcceptance.noRulesConfigured': 'Aucune règle configurée.',
    'scaffolder.rulesAcceptance.required': 'obligatoire',
    'sidebar.x2a.title': 'Centre de conversion',
    'table.actions.collapseAll': 'Réduire toutes les lignes',
    'table.actions.collapseRow': 'Réduire la rangée',
    'table.actions.deleteProject': 'Supprimer le projet',
    'table.actions.expandAll': 'Développer toutes les lignes',
    'table.actions.expandRow': 'Développer la ligne',
    'table.actions.retriggerInit': "Phase d'initialisation du projet Retrigger",
    'table.columns.createdAt': 'Heure de création',
    'table.columns.name': 'Nom',
    'table.columns.sourceRepo': 'Référentiel de sources',
    'table.columns.status': 'Statut',
    'table.columns.statusSortDisabledTooltip':
      "Le tri par statut n'est pas disponible lorsque le nombre de projets dépasse {{threshold}}.",
    'table.columns.targetRepo': 'Référentiel cible',
    'table.projectsCount': 'Projets ({{count}})',
    'time.ago.daysAndHours': 'il y a {{jours}}j {{heures}}h',
    'time.ago.daysOnly': 'il y a {{jours}}',
    'time.ago.hoursAndMinutes': 'il y a {{heures}}h {{minutes}}m',
    'time.ago.hoursOnly': 'il y a {{heures}}h',
    'time.ago.lessThanMinute': "il y a moins d'un million",
    'time.ago.minutes': 'il y a {{minutes}}m',
    'time.duration.daysAndHours': '{{jours}}j {{heures}}h',
    'time.duration.daysOnly': '{{jours}}d',
    'time.duration.hoursAndMinutes': '{{heures}}h {{minutes}}m',
    'time.duration.hoursOnly': '{{heures}}h',
    'time.duration.minutesAndSeconds': '{{minutes}}m {{secondes}}s',
    'time.duration.secondsOnly': '{{secondes}}s',
    'time.jobTiming.finished': 'Terminé {{timeAgo}} (a pris {{duration}})',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': "Durée d'exécution : {{duration}}",
  },
});

export default x2aPluginTranslationFr;
