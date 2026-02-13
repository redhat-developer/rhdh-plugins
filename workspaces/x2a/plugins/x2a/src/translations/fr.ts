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
    'page.devTitle': 'Hub de conversion',
    'table.columns.name': 'Nom',
    'table.columns.abbreviation': 'Abréviation',
    'table.columns.status': 'Statut',
    'table.columns.description': 'Description',
    'table.columns.sourceRepo': 'Dépôt source',
    'table.columns.targetRepo': 'Dépôt cible',
    'table.columns.createdAt': 'Créé le',
    'table.actions.deleteProject': 'Supprimer le projet',
    'table.detailPanel': 'TODO : Détails du projet {{name}}',
    'table.projectsCount': 'Projets ({{count}})',
    'project.description': 'Description',
    'project.id': 'ID',
    'project.abbreviation': 'Abréviation',
    'project.createdBy': 'Créé par',
    'project.statuses.none': '-',
    'project.statuses.created': 'Créé',
    'project.statuses.initializing': 'Initialisation en cours',
    'project.statuses.initialized': 'Initialisé',
    'project.statuses.inProgress': 'En cours',
    'project.statuses.completed': 'Terminé',
    'project.statuses.failed': 'Échoué',
    'common.newProject': 'Nouveau projet',
    'wizard.cancel': 'Annuler',
    'wizard.back': 'Retour',
    'wizard.next': 'Suivant',
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
    'module.actions.runNextPhase': 'Exécuter la phase suivante',
    'module.lastPhase': 'Dernière phase',
    'module.name': 'Nom',
    'module.status': 'Statut',
    'module.sourcePath': 'Chemin source',
    'module.artifacts': 'Artefacts',
    'module.startedAt': 'Démarré le',
    'module.finishedAt': 'Terminé le',
    'artifact.types.migration_plan': 'Plan de migration du projet',
    'artifact.types.module_migration_plan': 'Plan du module',
    'module.statuses.none': '-',
    'module.statuses.pending': 'En attente',
    'module.statuses.running': 'En cours',
    'module.statuses.success': 'Succès',
    'module.statuses.error': 'Erreur',
    'artifact.types.migrated_sources': 'Sources migrées',
  },
});

export default x2aPluginTranslationFr;
