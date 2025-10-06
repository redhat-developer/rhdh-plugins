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

import { globalFloatingActionButtonTranslationRef } from './ref';

const globalFloatingActionButtonTranslationDe = createTranslationMessages({
  ref: globalFloatingActionButtonTranslationRef,
  messages: {
    'fab.create.label': 'Erstellen',
    'fab.create.tooltip': 'Entität erstellen',
    'fab.docs.label': 'Dokumentation',
    'fab.docs.tooltip': 'Dokumentation',
    'fab.apis.label': 'APIs',
    'fab.apis.tooltip': 'API-Dokumentation',
    'fab.github.label': 'GitHub',
    'fab.github.tooltip': 'GitHub-Repository',
    'fab.bulkImport.label': 'Bulk-Import',
    'fab.bulkImport.tooltip':
      'Mehrere Repositories in einem Vorgang registrieren',
    'fab.quay.label': 'Quay',
    'fab.quay.tooltip': 'Quay Container Registry',
    'fab.menu.tooltip': 'Menü',
  },
});

export default globalFloatingActionButtonTranslationDe;
