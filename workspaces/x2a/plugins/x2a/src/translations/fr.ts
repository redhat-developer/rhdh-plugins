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
    'sidebar.x2a.title': 'Centre de conversion',
    'page.title': 'Centre de conversion',
    'page.subtitle': 'Lancer et suivre la conversion asynchrone de l\'automatisation existante en playbooks Ansible prêts pour la production.',
    'projectPage.title': 'Projet',
    'projectPage.deleteProject': 'Supprimer',
    'projectPage.actionsTooltip': 'Cliquez pour ouvrir le menu des actions du projet',
    'projectPage.deleteError': 'Échec de la suppression du projet',
    'projectPage.deleteConfirm.title': 'Supprimer le projet « {{name}} » ?',
    'projectModulesCard.title': 'Modules ({{count}})',
    'projectModulesCard.published': 'publié',
    'initPhaseCard.title': 'Phase de découverte',
    'modulePage.title': 'Détails du module',
    'modulePage.artifacts.title': 'Objets à examiner',
    'modulePage.artifacts.migration_plan': 'Plan global de migration du projet',
    'modulePage.artifacts.module_migration_plan': 'Plan de module par analyse',
    'modulePage.artifacts.migrated_sources': 'Sources migrées',
    'modulePage.artifacts.ansible_project': 'Projet AAP',
    'modulePage.artifacts.description': 'Ces éléments sont générés par le processus de conversion et peuvent être consultés.',
    'modulePage.phases.title': 'Phases de migration',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.duration': 'Durée',
    'modulePage.phases.k8sJobName': 'Nom de la tâche Kubernetes',
    'modulePage.phases.startedAt': 'Commencé à',
    'modulePage.phases.status': 'Statut',
    'modulePage.phases.errorDetails': 'Détails de l’erreur',
    'modulePage.phases.statuses.notStarted': 'non démarré',
    'modulePage.phases.statuses.pending': 'En attente',
    'modulePage.phases.statuses.running': 'En cours d’exécution',
    'modulePage.phases.statuses.success': 'Succès',
    'modulePage.phases.statuses.error': 'Erreur',
    'modulePage.phases.statuses.cancelled': 'Annulé',
    'modulePage.phases.resyncMigrationPlanInstructions': 'Resynchronisez la liste des modules pour qu\'elle corresponde au plan de migration.',
    'modulePage.phases.reanalyzeInstructions': 'Le plan de migration des modules est déjà en place. Si le plan global de migration du projet a été mis à jour, relancez l\'analyse pour prendre en compte les modifications.',
    'modulePage.phases.analyzeInstructions': 'Avant de lancer l\'analyse, examinez d\'abord le plan de migration global du projet. Son contenu orientera l\'analyse du module.',
    'modulePage.phases.migrateInstructions': 'Avant de lancer la migration, veuillez consulter le plan de migration des modules. Le processus de migration convertira le code source en Ansible conformément au plan.',
    'modulePage.phases.remigrateInstructions': 'Les sources migrées sont déjà présentes. Relancez la migration pour recréer le code Ansible converti.',
    'modulePage.phases.rerunMigrate': 'Recréer les sources migrées',
    'modulePage.phases.publishInstructions': 'Avant publication, veuillez vérifier les sources migrées. Le processus de publication enregistrera le code converti dans le référentiel  cible.',
    'modulePage.phases.republishInstructions': 'Le module a déjà été publié. Relancez la publication pour mettre à jour le référentiel cible.',
    'modulePage.phases.rerunPublish': 'Republier dans le référentiel cible',
    'modulePage.phases.cancel': 'Annuler',
    'modulePage.phases.runError': 'Échec de l\'exécution de la phase pour le module',
    'modulePage.phases.cancelError': 'Échec de l\'annulation de la phase pour le module',
    'modulePage.phases.commitId': 'ID du dernier commit',
    'modulePage.phases.viewLog': 'Afficher le journal',
    'modulePage.phases.hideLog': 'Masquer le journal',
    'modulePage.phases.noLogsAvailable': 'Aucun journal disponible pour le moment...',
    'modulePage.phases.logWaitingForStream': 'En attente des journaux de sortie du cluster...',
    'modulePage.phases.telemetry.title': 'Télémétrie',
    'modulePage.phases.telemetry.noTelemetryAvailable': 'Aucune télémétrie disponible',
    'modulePage.phases.telemetry.agentName': 'Nom de l\'agent',
    'modulePage.phases.telemetry.duration': 'Durée',
    'modulePage.phases.telemetry.inputTokens': 'Jetons d\'entrée',
    'modulePage.phases.telemetry.outputTokens': 'Jetons de sortie',
    'modulePage.phases.telemetry.toolCalls': 'Nombre d\'appels d\'outils',
    'table.columns.name': 'Nom',
    'table.columns.status': 'Statut',
    'table.columns.statusSortDisabledTooltip': 'Le tri par statut n\'est pas disponible lorsque le nombre de projets dépasse {{threshold}}.',
    'table.columns.targetRepo': 'Référentiel cible',
    'table.columns.createdAt': 'Heure de création',
    'table.actions.deleteProject': 'Supprimer le projet',
    'table.actions.retriggerInit': 'Phase d\'initialisation du projet Retrigger',
    'table.actions.expandAll': 'Développer toutes les lignes',
    'table.actions.collapseAll': 'Réduire toutes les lignes',
    'table.actions.expandRow': 'Développer la ligne',
    'table.actions.collapseRow': 'Réduire la rangée',
    'table.projectsCount': 'Projets ({{count}})',
    'common.newProject': 'Nouveau projet',
    'emptyPage.noConversionInitiatedYet': 'Aucune conversion n\'a encore été initiée.',
    'emptyPage.noConversionInitiatedYetDescription': 'Initier et suivre la conversion de l\'automatisation existante en Ansible prêt pour la production.',
    'emptyPage.startFirstConversion': 'Commencez la première conversion',
    'emptyPage.notAllowedTitle': 'Accès refusé',
    'emptyPage.notAllowedDescription': 'Vous n\'êtes pas autorisé à accéder aux projets de conversion.',
    'bulkRun.projectAction': 'Exécuter tous les modules',
    'bulkRun.globalAction': 'Exécuter tout',
    'bulkRun.projectPageAction': 'Exécuter tout',
    'bulkRun.projectConfirm.title': 'Exécuter tous les modules du projet « {{name}} » ?',
    'bulkRun.cancel': 'Annuler',
    'bulkRun.errorProject': 'Échec de l\'exécution des modules dans le projet « {{name}} »',
    'artifact.types.migration_plan': 'Plan de migration du projet',
    'artifact.types.module_migration_plan': 'Plan de migration des modules',
    'artifact.types.migrated_sources': 'Sources migrées',
    'artifact.types.project_metadata': 'Métadonnées du projet',
    'artifact.types.ansible_project': 'Projet AAP',
    'time.duration.daysAndHours': '{{jours}}j {{heures}}h',
    'time.duration.daysOnly': '{{jours}}d',
    'time.duration.hoursAndMinutes': '{{heures}}h {{minutes}}m',
    'time.duration.hoursOnly': '{{heures}}h',
    'time.duration.minutesAndSeconds': '{{minutes}}m {{secondes}}s',
    'time.duration.secondsOnly': '{{secondes}}s',
    'time.ago.daysAndHours': 'il y a {{jours}}j {{heures}}h',
    'time.ago.daysOnly': 'il y a {{jours}}',
    'time.ago.hoursAndMinutes': 'il y a {{heures}}h {{minutes}}m',
    'time.ago.hoursOnly': 'il y a {{heures}}h',
    'time.ago.minutes': 'il y a {{minutes}}m',
    'time.ago.lessThanMinute': 'il y a moins d\'un million',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': 'Durée d\'exécution : {{duration}}',
    'empty': '-',
  },
});

export default x2aPluginTranslationFr;
