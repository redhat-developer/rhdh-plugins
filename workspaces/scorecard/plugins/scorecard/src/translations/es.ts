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
    // Empty state translations
    'emptyState.title': 'Aún no se agregaron tarjetas de puntuación',
    'emptyState.description':
      'Las tarjetas de puntuación ayudan a monitorear el estado del componente de un vistazo. Para comenzar, explore la documentación para obtener pautas de configuración.',
    'emptyState.button': 'Ver documentación',
    'emptyState.altText': 'No hay tarjetas de puntuación',

    // Permission required translations
    'permissionRequired.title': 'Permiso faltante',
    'permissionRequired.description':
      'Para ver el complemento de tarjetas de puntuación, comuníquese con su administrador para que le otorgue el permiso {{permission}}.',
    'permissionRequired.button': 'Leer más',
    'permissionRequired.altText': 'Permiso requerido',

    // Not found state
    'notFound.title': '404 No pudimos encontrar esa página',
    'notFound.description':
      'Intente agregar un archivo {{indexFile}} en la raíz del directorio de documentación de este repositorio.',
    'notFound.readMore': 'Leer más',
    'notFound.goBack': 'Volver',
    'notFound.contactSupport': 'Contactar soporte',
    'notFound.altText': 'Página no encontrada',

    // Error messages
    'errors.entityMissingProperties':
      'Entidad a la que le faltan las propiedades requeridas para la búsqueda en la tarjeta de puntuación',
    'errors.invalidApiResponse':
      'Formato de respuesta no válido de la API de la tarjeta de puntuación',
    'errors.fetchError':
      'Error al extraer las tarjetas de puntuación: {{error}}',
    'errors.metricDataUnavailable': 'Datos de métricas no disponibles',
    'errors.invalidThresholds': 'Umbrales no válidos',
    'errors.missingPermission': 'Permiso faltante',
    'errors.noDataFound': 'No se encontraron datos',
    'errors.authenticationError': 'Error de autenticación',
    'errors.missingPermissionMessage':
      'Para ver las métricas de la tarjeta de puntuación, su administrador debe otorgarle el permiso requerido.',
    'errors.userNotFoundInCatalogMessage':
      'Entidad de usuario no encontrada en el catálogo',
    'errors.noDataFoundMessage':
      'Para ver tus datos aquí, comprueba que tus entidades estén reportando valores relacionados con esta métrica.',
    'errors.authenticationErrorMessage': 'Inicie sesión para ver sus datos.',
    'errors.noMetricsFound':
      'No se encontraron métricas para la ID de métrica especificada.',
    'errors.multipleMetricsFound':
      'Se encontraron múltiples métricas para la ID de métrica especificada. Se esperaba exactamente una.',

    // Metric translations
    'metric.github.open_prs.title': 'GitHub PRs abiertas',
    'metric.github.open_prs.description':
      'Recuento actual de Pull Requests abiertas para un repositorio de GitHub dado.',
    'metric.jira.open_issues.title': 'Jira tickets bloqueantes abiertos',
    'metric.jira.open_issues.description':
      'Destaca el número de problemas críticos y bloqueantes que están actualmente abiertos en Jira.',
    'metric.lastUpdated': 'Última actualización: {{timestamp}}',
    'metric.someEntitiesNotReportingValues':
      'Algunas entidades no están reportando valores relacionados con esta métrica.',

    // Threshold translations
    'thresholds.success': 'Éxito',
    'thresholds.warning': 'Advertencia',
    'thresholds.error': 'Error',
    'thresholds.noEntities': 'No hay entidades en el estado {{category}}',
    'thresholds.entities_one': '{{count}} entidad',
    'thresholds.entities_other': '{{count}} entidades',

    // Entities page translations
    'entitiesPage.unknownMetric': 'Métrica desconocida',
    'entitiesPage.noDataFound':
      'Para ver tus datos aquí, comprueba que tus entidades estén reportando valores relacionados con esta métrica.',
    'entitiesPage.missingPermission':
      'Para ver las métricas de scorecard, tu administrador debe otorgarle el permiso requerido.',
    'entitiesPage.metricProviderNotRegistered':
      'Proveedor de métrica con ID {{metricId}} no registrado.',
    'entitiesPage.entitiesTable.title': 'Entidades',
    'entitiesPage.entitiesTable.unavailable': 'No disponible',
    'entitiesPage.entitiesTable.titleWithCount': 'Entidades ({{count}})',
    'entitiesPage.entitiesTable.header.metric': 'Métrica',
    'entitiesPage.entitiesTable.header.value': 'Valor',
    'entitiesPage.entitiesTable.header.entity': 'Entidad',
    'entitiesPage.entitiesTable.header.owner': 'Propietario',
    'entitiesPage.entitiesTable.header.kind': 'Tipo',
    'entitiesPage.entitiesTable.header.lastUpdated': 'Última actualización',
    'entitiesPage.entitiesTable.footer.allRows': 'Todas las filas',
    'entitiesPage.entitiesTable.footer.rows_one': '{{count}} fila',
    'entitiesPage.entitiesTable.footer.rows_other': '{{count}} filas',
    'entitiesPage.entitiesTable.footer.of': 'de',
  },
});

export default scorecardTranslationEs;
