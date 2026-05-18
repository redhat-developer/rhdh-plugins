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
import { scorecardTranslationRef } from './ref';

/**
 * es translation for plugin.scorecard.
 * @public
 */
const scorecardTranslationEs = createTranslationMessages({
  ref: scorecardTranslationRef,
  messages: {
    'emptyState.title': 'Aún no se agregaron tarjetas de puntuación',
    'emptyState.description': 'Las tarjetas de puntuación ayudan a monitorear el estado del componente de un vistazo. Para comenzar, explore la documentación para obtener pautas de configuración.',
    'emptyState.altText': 'No hay tarjetas de puntuación',
    'notFound.title': '404 No pudimos encontrar esa página',
    'notFound.description': 'Intente agregar un archivo {{indexFile}} en la root del directorio docs de este repositorio.',
    'notFound.goBack': 'Volver',
    'notFound.contactSupport': 'Comuníquese con Soporte',
    'notFound.altText': 'Pagina no encontrada',
    'permissionRequired.title': 'Permiso faltante',
    'permissionRequired.description': 'Para ver el complemento de tarjetas de puntuación, comuníquese con su administrador para que le otorgue el permiso {{permission}}.',
    'permissionRequired.altText': 'Permiso requerido',
    'common.loading': 'Cargando',
    'errors.entityMissingProperties': 'Entidad a la que le faltan las propiedades requeridas para la búsqueda en la tarjeta de puntuación',
    'errors.missingAggregationId': 'La tarjeta de puntuación está mal configurada; no se proporcionó la propiedad de ID de agregación (o ID de métrica)',
    'errors.invalidApiResponse': 'Formato de respuesta no válido de la API de la tarjeta de puntuación',
    'errors.fetchError': 'Error al extraer las tarjetas de puntuación: {{error}}',
    'errors.invalidThresholds': 'Umbrales no válidos',
    'errors.missingPermission': 'Permiso faltante',
    'errors.noDataFound': 'No se encontraron datos',
    'errors.authenticationError': 'Error de autenticación',
    'errors.missingPermissionMessage': 'Para ver las métricas de la tarjeta de puntuación, su administrador debe otorgarle el permiso requerido.',
    'thresholds.success': 'Éxito',
    'thresholds.warning': 'Advertencia',
    'thresholds.error': 'Error',
    'thresholds.exist': 'Existente',
    'thresholds.missing': 'Faltante',
    'thresholds.noEntities': 'No hay entidades en el estado {{category}}',
    'thresholds.entities_one': '{{count}} entidad',
    'thresholds.entities_other': '{{count}} entidades',
    'entitiesPage.unknownMetric': 'Métrica desconocida',
    'entitiesPage.noDataFound': 'Para ver sus datos aquí, compruebe que sus entidades informen valores relacionados con esta métrica.',
  },
});

export default scorecardTranslationEs;
