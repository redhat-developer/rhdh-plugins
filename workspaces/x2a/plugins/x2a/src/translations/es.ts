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
 * Spanish translation for the x2a plugin.
 * @public
 */
const x2aPluginTranslationEs = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'sidebar.x2a.title': 'Hub de conversión',
    'page.title': 'Hub de conversión',
    'page.subtitle':
      'Inicie y realice el seguimiento de las conversiones asíncronas de archivos Chef a playbooks Ansible listos para producción.',
    'page.devTitle': 'Hub de conversión',
    'table.columns.name': 'Nombre',
    'table.columns.abbreviation': 'Abreviatura',
    'table.columns.status': 'Estado',
    'table.columns.description': 'Descripción',
    'table.columns.sourceRepo': 'Repositorio de origen',
    'table.columns.targetRepo': 'Repositorio de destino',
    'table.columns.createdAt': 'Creado el',
    'table.actions.deleteProject': 'Eliminar proyecto',
    'table.detailPanel': 'TODO: Detalles del proyecto {{name}}',
    'table.projectsCount': 'Proyectos ({{count}})',
    'common.newProject': 'Nuevo proyecto',
    'wizard.cancel': 'Cancelar',
    'wizard.back': 'Atrás',
    'wizard.next': 'Siguiente',
  },
});

export default x2aPluginTranslationEs;
