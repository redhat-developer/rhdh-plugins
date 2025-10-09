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

const globalFloatingActionButtonTranslationEs = createTranslationMessages({
  ref: globalFloatingActionButtonTranslationRef,
  messages: {
    'fab.create.label': 'Crear',
    'fab.create.tooltip': 'Crear entidad',
    'fab.docs.label': 'Documentación',
    'fab.docs.tooltip': 'Documentación',
    'fab.apis.label': 'APIs',
    'fab.apis.tooltip': 'Documentación de API',
    'fab.github.label': 'GitHub',
    'fab.github.tooltip': 'Repositorio de GitHub',
    'fab.bulkImport.label': 'Importación masiva',
    'fab.bulkImport.tooltip': 'Registrar múltiples repositorios de una vez',
    'fab.quay.label': 'Quay',
    'fab.quay.tooltip': 'Registro de contenedores Quay',
    'fab.menu.tooltip': 'Menú',
  },
});

export default globalFloatingActionButtonTranslationEs;
