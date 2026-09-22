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
import { appDefaultsTranslationRef } from './ref';

/**
 * @internal
 */
export default createTranslationMessages({
  ref: appDefaultsTranslationRef,
  messages: {
    'catalog.emptyState.title': 'No hay elementos del catálogo disponibles',
    'catalog.emptyState.description': 'Todavía no hay entidades del catálogo o no tiene permiso para visualizarlas. Aparecerán aquí una vez que se registren y usted tenga acceso.',
    'catalog.emptyState.importButtonTitle': 'Registrar un componente',
    'catalogGraph.emptyState.title': 'No hay elementos del catálogo disponibles',
    'catalogGraph.emptyState.description': 'Todavía no hay entidades del catálogo o no tiene permiso para visualizarlas. El gráfico del catálogo aparecerá aquí una vez que se registren y usted tenga acceso.',
    'catalogGraph.emptyState.importButtonTitle': 'Registrar un componente',
    'scaffolder.emptyState.title': 'No hay plantillas disponibles',
    'scaffolder.emptyState.description': 'Todavía no hay plantillas de software disponibles o no tiene permiso para visualizarlas. Aparecerán aquí una vez que se registren y usted tenga acceso.',
    'scaffolder.emptyState.importButtonTitle': 'Registrar una plantilla',
    'apiDocs.emptyState.title': 'No hay API disponibles',
    'apiDocs.emptyState.description': 'Todavía no hay API disponibles o no tiene permiso para visualizarlas. Aparecerán aquí una vez que se registren y usted tenga acceso.',
    'apiDocs.emptyState.importButtonTitle': 'Registrar una API',
    'docs.emptyState.title': 'No hay documentación disponible',
    'docs.emptyState.description': 'Todavía no hay entidades documentadas o no tiene permiso para visualizarlas. La documentación aparecerá aquí una vez que se registren las entidades con anotaciones de TechDocs y usted tenga acceso.',
    'docs.emptyState.importButtonTitle': 'Registrar un componente',
    'menuItem.learningPaths': 'Rutas de aprendizaje',
    'learningPaths.title': 'Rutas de aprendizaje',
    'learningPaths.error.title': 'No se pudieron extraer los datos.',
    'learningPaths.error.unknownError': 'Error desconocido',
      'apiDocs.emptyState.action': 'Registrar una API',
    'catalog.emptyState.action': 'Registrar un componente',
    'catalogGraph.emptyState.action': 'Ir al catálogo',
    'docs.emptyState.action': 'Aprenda más',
    'scaffolder.emptyState.action': 'Registrar una plantilla',
},
});
