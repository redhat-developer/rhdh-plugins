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
 * French translation for the x2a plugin.
 * @public
 */
const x2aPluginTranslationFr = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'sidebar.x2a.title': 'Hub de conversion',
    'page.title': 'Hub de conversion',
    'page.subtitle':
      "Lancez et suivez la conversion asynchrone d'automatisation existante en playbooks Ansible prêts pour la production.",
    'table.columns.name': 'Nom',
    'table.columns.status': 'Statut',
    'table.columns.statusSortDisabledTooltip':
      "Le tri par statut n'est pas disponible lorsque le nombre de projets dépasse {{threshold}}",
    'table.columns.sourceRepo': 'Dépôt source',
    'table.columns.targetRepo': 'Dépôt cible',
    'table.columns.createdAt': 'Créé le',
    'table.actions.deleteProject': 'Supprimer le projet',
    'table.actions.retriggerInit':
      "Relancer la phase d'initialisation du projet",
    'table.actions.expandAll': 'Développer toutes les lignes',
    'table.actions.collapseAll': 'Réduire toutes les lignes',
    'table.actions.expandRow': 'Développer la ligne',
    'table.actions.collapseRow': 'Réduire la ligne',
    'table.projectsCount': 'Projets ({{count}})',
    empty: '-',
    'initPhaseCard.title': 'Phase de découverte',
    'projectDetailsCard.title': 'Détails du projet',
    'projectDetailsCard.name': 'Nom',
    'projectDetailsCard.status': 'Statut',
    'projectDetailsCard.ownedBy': 'Propriétaire',
    'projectDetailsCard.dirName': 'Nom du répertoire',
    'projectDetailsCard.description': 'Description',
    'projectDetailsCard.sourceRepo': 'Dépôt source',
    'projectDetailsCard.targetRepo': 'Dépôt cible',
    'projectDetailsCard.edit': 'Modifier',
    'editProjectDialog.title': 'Modifier le projet',
    'editProjectDialog.cancel': 'Annuler',
    'editProjectDialog.update': 'Mettre à jour',
    'editProjectDialog.updateError': 'Échec de la mise à jour du projet',
    'editProjectDialog.ownerChangeWarningTitle':
      'Confirmer le transfert de propriété',
    'editProjectDialog.ownerChangeWarning':
      "Le changement de propriétaire peut entraîner la perte d'accès à ce projet si vos autorisations ne couvrent pas le nouveau propriétaire. Un administrateur peut restaurer l'accès si nécessaire.",
    'editProjectDialog.ownerChangeConfirm': 'Transférer la propriété',
    'editProjectDialog.nameRequired': 'Le nom est requis',
    'editProjectDialog.ownerFormatHint':
      "Doit être une référence d'entité Backstage, p.ex. user:default/nom ou group:default/equipe",
    'projectModulesCard.title': 'Modules ({{count}})',
    'projectModulesCard.noModules': 'Aucun module trouvé pour le moment...',
    'projectModulesCard.toReview': 'réviser',
    'projectModulesCard.published': 'publié',
    'projectPage.title': 'Projet',
    'projectPage.actionsTooltip':
      'Cliquez pour ouvrir le menu pour les actions du projet',
    'projectPage.deleteError': 'Erreur lors de la suppression du projet',
    'projectPage.deleteProject': 'Supprimer',
    'projectPage.deleteConfirm.title': 'Supprimer le projet « {{name}} » ?',
    'projectPage.deleteConfirm.message':
      'Ce projet, tous ses modules et travaux seront définitivement supprimés. Cette action est irréversible. Les artefacts persistés dans le dépôt cible seront préservés.',
    'projectPage.deleteConfirm.cancel': 'Annuler',
    'projectPage.deleteConfirm.confirm': 'Supprimer',
    'projectTable.deleteError': 'Erreur lors de la suppression du projet',
    'project.description': 'Description',
    'project.id': 'ID',
    'project.ownedBy': 'Propriétaire',
    'project.dirName': 'Nom du répertoire',
    'project.statuses.none': '-',
    'project.statuses.created': 'Créé',
    'project.statuses.initializing': 'Initialisation en cours',
    'project.statuses.initialized': 'Initialisé',
    'project.statuses.inProgress': 'En cours',
    'project.statuses.completed': 'Terminé',
    'project.statuses.failed': 'Échoué',
    'project.noModules': 'Aucun module trouvé pour le moment...',
    'common.newProject': 'Nouveau projet',
    'emptyPage.noConversionInitiatedYet':
      'Aucune conversion initiée pour le moment',
    'emptyPage.noConversionInitiatedYetDescription':
      "Lancez et suivez la conversion d'automatisation existante en Ansible prêt pour la production",
    'emptyPage.startFirstConversion': 'Démarrer la première conversion',
    'emptyPage.notAllowedTitle': 'Accès refusé',
    'emptyPage.notAllowedDescription':
      "Vous n'êtes pas autorisé à accéder aux projets de conversion.",
    'module.phases.init': 'Init',
    'module.phases.none': '-',
    'module.phases.analyze': 'Analyser',
    'module.phases.migrate': 'Migrer',
    'module.phases.publish': 'Publier',
    'module.summary.total': 'Total',
    'module.summary.finished': 'Terminé',
    'module.summary.waiting': 'En attente',
    'module.summary.pending': 'En attente',
    'module.summary.running': 'En cours',
    'module.summary.error': 'Erreur',
    'module.summary.cancelled': 'Annulé',
    'module.summary.toReview_one':
      '{{count}} module avec des artefacts à réviser',
    'module.summary.toReview_other':
      '{{count}} modules avec des artefacts à réviser',
    'module.actions.runNextPhase': 'Exécuter la prochaine phase {{phase}}',
    'module.actions.cancelPhase': 'Annuler la phase {{phase}}',
    'module.actions.cancelPhaseError':
      "Échec de l'annulation de la phase pour le module",
    'module.actions.runNextPhaseError':
      "Échec de l'exécution de la prochaine phase pour le module",
    'module.currentPhase': 'Phase actuelle',
    'module.lastUpdate': 'Dernière mise à jour',
    'module.notStarted': 'Non commencé',
    'module.name': 'Nom',
    'module.status': 'Statut',
    'module.sourcePath': 'Chemin source',
    'module.artifacts': 'Artefacts',
    'artifact.types.migration_plan': 'Plan de migration du projet',
    'artifact.types.module_migration_plan': 'Plan du module',
    'module.statuses.none': '-',
    'module.statuses.pending': 'En attente',
    'module.statuses.running': 'En cours',
    'module.statuses.success': 'Succès',
    'module.statuses.error': 'Erreur',
    'module.statuses.cancelled': 'Annulé',
    'artifact.types.migrated_sources': 'Sources migrées',
    'artifact.types.project_metadata': 'Métadonnées du projet',
    'artifact.types.ansible_project': 'Projet AAP',
    'modulePage.title': 'Détails du module',
    'modulePage.artifacts.title': 'Artefacts à réviser',
    'modulePage.artifacts.migration_plan': 'Plan de migration global du projet',
    'modulePage.artifacts.module_migration_plan': 'Plan du module par analyse',
    'modulePage.artifacts.migrated_sources': 'Sources migrées',
    'modulePage.artifacts.ansible_project': 'Projet AAP',
    'modulePage.artifacts.description':
      'Ces artefacts sont générés par le processus de conversion et sont disponibles pour examen.',
    'modulePage.phases.title': 'Phases de migration',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.duration': 'Durée',
    'modulePage.phases.k8sJobName': 'Nom du job Kubernetes',
    'modulePage.phases.startedAt': 'Démarré le',
    'modulePage.phases.status': 'Statut',
    'modulePage.phases.errorDetails': "Détails de l'erreur",
    'modulePage.phases.statuses.notStarted': 'Non commencé',
    'modulePage.phases.statuses.pending': 'En attente',
    'modulePage.phases.statuses.running': 'En cours',
    'modulePage.phases.statuses.success': 'Succès',
    'modulePage.phases.statuses.error': 'Erreur',
    'modulePage.phases.statuses.cancelled': 'Annulé',
    'modulePage.phases.reanalyzeInstructions':
      "Le plan de migration du module est déjà présent. Si le plan de migration global du projet a été mis à jour, relancez l'analyse pour refléter les changements.",
    'modulePage.phases.rerunAnalyze': 'Recréer le plan de migration du module',
    'modulePage.phases.analyzeInstructions':
      "Avant de lancer l'analyse, consultez d'abord le plan de migration global du projet ; son contenu guidera l'analyse du module.",
    'modulePage.phases.runAnalyze': 'Créer le plan de migration du module',
    'modulePage.phases.migrateInstructions':
      'Avant de lancer la migration, consultez le plan de migration du module. Le processus de migration convertira le code source en Ansible en fonction du plan.',
    'modulePage.phases.runMigrate': 'Migrer les sources du module',
    'modulePage.phases.remigrateInstructions':
      'Les sources migrées sont déjà présentes. Relancez la migration pour recréer le code Ansible converti.',
    'modulePage.phases.rerunMigrate': 'Recréer les sources migrées',
    'modulePage.phases.publishInstructions':
      'Avant de publier, consultez les sources migrées. Le processus de publication validera le code converti dans le dépôt cible.',
    'modulePage.phases.runPublish': 'Publier dans le dépôt cible',
    'modulePage.phases.republishInstructions':
      'Le module a déjà été publié. Relancez la publication pour mettre à jour le dépôt cible.',
    'modulePage.phases.rerunPublish': 'Republier dans le dépôt cible',
    'modulePage.phases.cancel': 'Annuler',
    'modulePage.phases.runError':
      "Échec de l'exécution de la phase pour le module",
    'modulePage.phases.cancelError':
      "Échec de l'annulation de la phase pour le module",
    'modulePage.phases.commitId': 'Dernier ID de commit',
    'modulePage.phases.viewLog': 'Voir le journal',
    'modulePage.phases.hideLog': 'Masquer le journal',
    'modulePage.phases.noLogsAvailable':
      'Aucun journal disponible pour le moment...',
    'modulePage.phases.logWaitingForStream':
      'En attente des journaux du cluster...',
    'modulePage.phases.telemetry.title': 'Télémétrie',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'Aucune télémétrie disponible',
    'modulePage.phases.telemetry.agentName': "Nom de l'agent",
    'modulePage.phases.telemetry.duration': 'Durée',
    'modulePage.phases.telemetry.inputTokens': "Jetons d'entrée",
    'modulePage.phases.telemetry.outputTokens': 'Jetons de sortie',
    'modulePage.phases.telemetry.toolCalls': "Nombre d'appels d'outils",
    'modulePage.phases.resyncMigrationPlanInstructions':
      'Resynchroniser la liste des modules pour correspondre au plan de migration.',
    'time.duration.daysAndHours': '{{days}}j {{hours}}h',
    'time.duration.daysOnly': '{{days}}j',
    'time.duration.hoursAndMinutes': '{{hours}}h {{minutes}}min',
    'time.duration.hoursOnly': '{{hours}}h',
    'time.duration.minutesAndSeconds': '{{minutes}}min {{seconds}}s',
    'time.duration.secondsOnly': '{{seconds}}s',
    'time.ago.daysAndHours': 'il y a {{days}}j {{hours}}h',
    'time.ago.daysOnly': 'il y a {{days}}j',
    'time.ago.hoursAndMinutes': 'il y a {{hours}}h {{minutes}}min',
    'time.ago.hoursOnly': 'il y a {{hours}}h',
    'time.ago.minutes': 'il y a {{minutes}}min',
    'time.ago.lessThanMinute': 'il y a <1min',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': 'En cours depuis {{duration}}',
    'time.jobTiming.finished': 'Terminé {{timeAgo}} (durée {{duration}})',
    'bulkRun.projectAction': 'Exécuter tous les modules',
    'bulkRun.globalAction': 'Tout exécuter',
    'bulkRun.projectPageAction': 'Tout exécuter',
    'bulkRun.projectConfirm.title':
      'Exécuter tous les modules du projet « {{name}} » ?',
    'bulkRun.projectConfirm.message':
      "Cela déclenchera la prochaine phase de migration pour chaque module de ce projet dont l'état actuel le permet. Assurez-vous d'avoir examiné tous les artefacts nécessaires dans les dépôts cibles avant d'exécuter cette action. Les modules non éligibles seront ignorés.",
    'bulkRun.globalConfirm.title':
      'Exécuter tous les projets et modules éligibles ?',
    'bulkRun.globalConfirm.message':
      "Cela déclenchera la prochaine phase de migration pour tous les modules éligibles de tous les projets auxquels vous avez accès en écriture, y compris les projets non visibles sur la page actuelle. Assurez-vous d'avoir examiné tous les artefacts nécessaires dans les dépôts cibles avant d'exécuter cette action.",
    'bulkRun.globalConfirm.messageInitRetrigger':
      "Certains projets sont éligibles pour relancer la phase d'initialisation. Leur phase de découverte sera également relancée.",
    'bulkRun.globalConfirm.noInitEligible':
      "Aucun projet n'est actuellement éligible pour relancer la phase d'initialisation.",
    'bulkRun.globalConfirm.userPromptLabel':
      "Instructions utilisateur pour la relance d'init (optionnel)",
    'bulkRun.globalConfirm.userPromptPlaceholder':
      "Si des projets nécessitent une relance de leur phase d'init, ces instructions seront utilisées pour personnaliser la conversion…",
    'bulkRun.projectPageConfirm.title':
      'Exécuter tous les modules de « {{name}} » ?',
    'bulkRun.projectPageConfirm.message':
      "Cela déclenchera la prochaine phase de migration pour chaque module de ce projet dont l'état actuel le permet. Assurez-vous d'avoir examiné tous les artefacts nécessaires dans les dépôts cibles avant d'exécuter cette action. Les modules non éligibles seront ignorés.",
    'bulkRun.confirm': 'Tout exécuter',
    'bulkRun.cancel': 'Annuler',
    'bulkRun.errorProject':
      "Erreur lors de l'exécution des modules du projet « {{name}} »",
    'bulkRun.errorModuleStart':
      'Erreur lors du démarrage de la phase « {{phase}} » pour le module « {{moduleName}} »',
    'bulkRun.errorGlobal': "Erreur lors de l'opération groupée",
    'retriggerInit.confirm.title':
      "Relancer la phase d'initialisation pour « {{name}} » ?",
    'retriggerInit.confirm.message':
      "Cela relancera la phase de découverte du projet en démarrant un nouveau travail d'initialisation. Les résultats d'initialisation précédents seront remplacés.",
    'retriggerInit.confirm.userPromptLabel':
      'Instructions utilisateur (optionnel)',
    'retriggerInit.confirm.userPromptPlaceholder':
      'Fournir des instructions supplémentaires pour la conversion…',
    'retriggerInit.confirm.confirmButton': 'Relancer',
    'retriggerInit.firstTrigger.title':
      "Lancer la phase d'initialisation pour « {{name}} » ?",
    'retriggerInit.firstTrigger.message':
      "Après confirmation, la phase de découverte de ce projet sera lancée. Il se peut qu'on vous demande vos jetons SCM source et cible.",
    'retriggerInit.firstTrigger.userPromptLabel':
      'Instructions utilisateur (optionnel)',
    'retriggerInit.firstTrigger.userPromptPlaceholder':
      'Fournir des instructions supplémentaires pour la conversion…',
    'retriggerInit.firstTrigger.confirmButton':
      "Lancer la phase d'initialisation",
    'retriggerInit.error':
      "Erreur lors de la relance de la phase d'initialisation du projet « {{name}} »",
    'retriggerInit.errorStart':
      "Erreur lors du démarrage de l'initialisation du projet",
    'rulesPage.title': 'Règles de conversion',
    'rulesPage.subtitle':
      'Gérez les règles que les projets doivent accepter lors de la création.',
    'rulesPage.addRule': 'Ajouter une règle',
    'rulesPage.manageRules': 'Gérer les règles',
    'rulesPage.notAllowed':
      "Vous n'avez pas la permission de gérer les règles.",
    'rulesPage.table.id': 'ID',
    'rulesPage.table.title': 'Titre',
    'rulesPage.table.description': 'Description',
    'rulesPage.table.required': 'Obligatoire',
    'rulesPage.table.optional': 'Optionnel',
    'rulesPage.table.createdAt': 'Créé',
    'rulesPage.table.editRule': 'Modifier la règle',
    'rulesPage.table.noRules': 'Aucune règle définie pour le moment.',
    'rulesPage.dialog.createTitle': 'Créer une règle',
    'rulesPage.dialog.editTitle': 'Modifier la règle',
    'rulesPage.dialog.titleField': 'Titre',
    'rulesPage.dialog.descriptionField': 'Description',
    'rulesPage.dialog.requiredField': 'Obligatoire pour tous les projets',
    'rulesPage.dialog.save': 'Enregistrer',
    'rulesPage.dialog.cancel': 'Annuler',
    'rulesPage.dialog.createError': 'Erreur lors de la création de la règle',
    'rulesPage.dialog.updateError': 'Erreur lors de la mise à jour de la règle',
  },
});

export default x2aPluginTranslationFr;
