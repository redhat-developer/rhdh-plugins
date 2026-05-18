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

/**
 * fr translation for plugin.global-floating-action-button.
 * @public
 */
const globalFloatingActionButtonTranslationFr = createTranslationMessages({
  ref: globalFloatingActionButtonTranslationRef,
  messages: {
    'fab.create.label': 'Créer',
    'fab.create.tooltip': 'Créer une entité',
    'fab.docs.label': 'Docs',
    'fab.docs.tooltip': 'Documentation',
    'fab.apis.label': 'APIs',
    'fab.apis.tooltip': 'Documentation de l\'API',
    'fab.github.label': 'GitHub',
    'fab.github.tooltip': 'Référentiel GitHub',
    'fab.bulkImport.label': 'Importation en vrac',
    'fab.bulkImport.tooltip': 'Enregistrez plusieurs référentiels en masse',
    'fab.quay.label': 'Quay',
    'fab.quay.tooltip': 'Registre des conteneurs de Quay',
    'fab.menu.tooltip': 'Menu',
  },
});

export default globalFloatingActionButtonTranslationFr;
