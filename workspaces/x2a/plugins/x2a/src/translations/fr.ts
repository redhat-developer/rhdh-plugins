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
    'newProjectPage.title': 'Nouvelle conversion',
    'newProjectPage.subtitle':
      'Hub de conversion / Nouveau projet de conversion',
    'newProjectPage.steps.jobNameAndDescription':
      'Nom et description du travail',
    'newProjectPage.steps.sourceAndTargetRepos': 'Dépôts source et cible',
    'newProjectPage.steps.reviewAndStart': 'Vérifier et démarrer',
    'newProjectPage.steps.lastStep': 'Dernière étape',
    'table.columns.name': 'Nom',
    'table.columns.abbreviation': 'Abréviation',
    'table.columns.status': 'Statut',
    'table.columns.description': 'Description',
    'table.columns.createdAt': 'Créé le',
    'table.actions.deleteProject': 'Supprimer le projet',
    'table.detailPanel': 'TODO : Détails du projet {{name}}',
    'table.projectsCount': 'Projets ({{count}})',
    'common.newProject': 'Nouveau projet',
    'wizard.cancel': 'Annuler',
    'wizard.back': 'Retour',
    'wizard.next': 'Suivant',
  },
});

export default x2aPluginTranslationFr;
