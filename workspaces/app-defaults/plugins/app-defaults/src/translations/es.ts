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

import { createTranslationMessages } from '@backstage/frontend-plugin-api';
import { translationRef } from './ref';

/**
 * @internal
 */
export default createTranslationMessages({
  ref: translationRef,
  messages: {
    'catalog.emptyState.title': 'No hay elementos disponibles en el catálogo',
    'catalog.emptyState.description':
      'Todavía no hay entidades en el catálogo, o no tiene permiso para ver ninguna. Aparecerán aquí una vez que se registren y tenga acceso.',
    'catalog.emptyState.action': 'Registrar un componente',
    'catalogGraph.emptyState.title':
      'No hay elementos disponibles en el catálogo',
    'catalogGraph.emptyState.description':
      'Todavía no hay entidades en el catálogo, o no tiene permiso para ver ninguna. El grafo del catálogo aparecerá aquí una vez que se registren y tenga acceso.',
    'catalogGraph.emptyState.action': 'Ir al catálogo',
    'scaffolder.emptyState.title': 'No hay plantillas disponibles',
    'scaffolder.emptyState.description':
      'Todavía no hay plantillas de software, o no tiene permiso para ver ninguna. Aparecerán aquí una vez que se registren y tenga acceso.',
    'scaffolder.emptyState.action': 'Registrar una plantilla',
    'apiDocs.emptyState.title': 'No hay APIs disponibles',
    'apiDocs.emptyState.description':
      'Todavía no hay APIs, o no tiene permiso para ver ninguna. Aparecerán aquí una vez que se registren y tenga acceso.',
    'apiDocs.emptyState.action': 'Registrar una API',
    'docs.emptyState.title': 'No hay documentación disponible',
    'docs.emptyState.description':
      'Todavía no hay entidades documentadas, o no tiene permiso para ver ninguna. La documentación aparecerá aquí una vez que se registren entidades con anotaciones de TechDocs y tenga acceso.',
    'docs.emptyState.action': 'Más información',
  },
});
