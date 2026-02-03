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
 * German translation for the x2a plugin.
 * @public
 */
const x2aPluginTranslationDe = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'sidebar.x2a.title': 'Konversions Hub',
    'page.title': 'Konversions Hub',
    'page.subtitle':
      'Starten und verfolgen Sie die asynchrone Umwandlung von Chef-Dateien in produktionsreife Ansible Playbooks.',
    'page.devTitle': 'Konversions Hub',
    'table.columns.name': 'Name',
    'table.columns.abbreviation': 'Abkürzung',
    'table.columns.status': 'Status',
    'table.columns.description': 'Beschreibung',
    'table.columns.sourceRepo': 'Quell-Repository',
    'table.columns.targetRepo': 'Ziel-Repository',
    'table.columns.createdAt': 'Erstellt am',
    'table.actions.deleteProject': 'Projekt löschen',
    'table.detailPanel': 'TODO: Details des Projekts {{name}}',
    'table.projectsCount': 'Projekte ({{count}})',
    'common.newProject': 'Neues Projekt',
    'wizard.cancel': 'Abbrechen',
    'wizard.back': 'Zurück',
    'wizard.next': 'Weiter',
  },
});

export default x2aPluginTranslationDe;
