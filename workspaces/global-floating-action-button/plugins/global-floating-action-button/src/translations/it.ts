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
 * Italian translation for plugin.global-floating-action-button.
 * @public
 */
const globalFloatingActionButtonTranslationIt = createTranslationMessages({
  ref: globalFloatingActionButtonTranslationRef,
  messages: {
    'fab.create.label': 'Crea',
    'fab.create.tooltip': 'Crea entità',
    'fab.docs.label': 'Documenti',
    'fab.docs.tooltip': 'Documentazione',
    'fab.apis.label': 'API',
    'fab.apis.tooltip': 'Documentazione API',
    'fab.github.label': 'GitHub',
    'fab.github.tooltip': 'Repository GitHub',
    'fab.bulkImport.label': 'Importazione in blocco',
    'fab.bulkImport.tooltip': 'Registra più repository in blocco',
    'fab.quay.label': 'Quay',
    'fab.quay.tooltip': 'Registro dei container di Quay',
    'fab.menu.tooltip': 'Menu',
  },
});

export default globalFloatingActionButtonTranslationIt;
