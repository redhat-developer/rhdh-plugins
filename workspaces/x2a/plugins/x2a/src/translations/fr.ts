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
      'Lancez et suivez les conversions asynchrones de fichiers Chef en playbooks Ansible prêts pour la production.',
    'table.columns.name': 'Nom',
    'table.columns.status': 'Statut',
    'table.columns.sourceRepo': 'Dépôt source',
    'table.columns.targetRepo': 'Dépôt cible',
    'table.columns.createdAt': 'Créé le',
    'table.actions.deleteProject': 'Supprimer le projet',
    'table.projectsCount': 'Projets ({{count}})',
    empty: '-',
    'initPhaseCard.title': 'Phase de découverte',
    'projectDetailsCard.title': 'Détails du projet',
    'projectDetailsCard.name': 'Nom',
    'projectDetailsCard.abbreviation': 'Abréviation',
    'projectDetailsCard.status': 'Statut',
    'projectDetailsCard.createdBy': 'Propriétaire',
    'projectDetailsCard.description': 'Description',
    'projectDetailsCard.sourceRepo': 'Dépôt source',
    'projectDetailsCard.targetRepo': 'Dépôt cible',
    'projectModulesCard.title': 'Modules ({{count}})',
    'projectModulesCard.noModules': 'Aucun module trouvé pour le moment...',
    'projectModulesCard.toReview': 'réviser',
    'projectPage.title': 'Projet',
    'project.description': 'Description',
    'project.id': 'ID',
    'project.abbreviation': 'Abréviation',
    'project.createdBy': 'Propriétaire',
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
      'Lancez et suivez la conversion de fichiers Chef en playbooks Ansible prêts pour la production',
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
    'module.summary.toReview_one':
      '{{count}} module avec des artefacts à réviser',
    'module.summary.toReview_other':
      '{{count}} modules avec des artefacts à réviser',
    'module.actions.runNextPhase': 'Exécuter la phase suivante',
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
    'artifact.types.migrated_sources': 'Sources migrées',
    'artifact.types.project_metadata': 'Métadonnées du projet',
    'artifact.types.ansible_project': 'Projet Ansible',
    'modulePage.title': 'Détails du module',
    'modulePage.artifacts.title': 'Artefacts à réviser',
    'modulePage.artifacts.migration_plan': 'Plan de migration global du projet',
    'modulePage.artifacts.module_migration_plan': 'Plan du module par analyse',
    'modulePage.artifacts.migrated_sources': 'Sources migrées',
    'modulePage.artifacts.ansible_project': 'Projet Ansible',
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
    'modulePage.phases.reanalyzeInstructions':
      "Le plan de migration du module est déjà présent. Si le plan de migration global du projet a été mis à jour, relancez l'analyse pour refléter les changements.",
    'modulePage.phases.rerunAnalyze': 'Recréer le plan de migration du module',
    'modulePage.phases.analyzeInstructions':
      "Avant de lancer l'analyse, consultez d'abord le plan de migration global du projet ; son contenu guidera l'analyse du module.",
    'modulePage.phases.runAnalyze': 'Créer le plan de migration du module',
    'modulePage.phases.migrateInstructions':
      'Avant de lancer la migration, consultez le plan de migration du module. Le processus de migration convertira le code Chef en Ansible en fonction du plan.',
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
    'modulePage.phases.commitId': 'Dernier ID de commit',
    'modulePage.phases.viewLog': 'Voir le journal',
    'modulePage.phases.hideLog': 'Masquer le journal',
    'modulePage.phases.noLogsAvailable':
      'Aucun journal disponible pour le moment...',
    'modulePage.phases.resyncMigrationPlanInstructions':
      'Resynchroniser la liste des modules pour correspondre au plan de migration.',
  },
});

export default x2aPluginTranslationFr;
