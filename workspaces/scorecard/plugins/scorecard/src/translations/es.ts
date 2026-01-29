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

const scorecardTranslationEs = createTranslationMessages({
  ref: scorecardTranslationRef,
  full: true,
  messages: {
    // Empty state
    'emptyState.title': 'Aún no se han añadido scorecards',
    'emptyState.description':
      'Los scorecards te ayudan a monitorear la salud de los componentes de un vistazo. Para comenzar, explora nuestra documentación para obtener pautas de configuración.',
    'emptyState.button': 'Ver documentación',
    'emptyState.altText': 'Sin scorecards',

    // Permission required state
    'permissionRequired.title': 'Permiso faltante',
    'permissionRequired.description':
      'Para ver el plugin Scorecard, contacta a tu administrador para otorgar el {{permission}} permiso.',
    'permissionRequired.button': 'Leer más',
    'permissionRequired.altText': 'Permiso requerido',

    // Error messages
    'errors.entityMissingProperties':
      'Entidad falta propiedades requeridas para búsqueda de scorecard',
    'errors.invalidApiResponse':
      'Formato de respuesta inválido de la API de scorecard',
    'errors.fetchError': 'Error al obtener scorecards: {{error}}',
    'errors.metricDataUnavailable': 'Datos de métrica no disponibles',
    'errors.invalidThresholds': 'Umbrales inválidos',
    'errors.missingPermission': 'Permiso faltante',
    'errors.aggregationSkipped': 'Agregación omitida',
    'errors.missingPermissionMessage':
      'Para ver las métricas de scorecard, tu administrador debe otorgarle el permiso requerido.',
    'errors.userNotFoundInCatalogMessage':
      'Entidad de usuario no encontrada en el catálogo',
    'errors.aggregationSkippedMessage':
      'No hay métricas que agregar para este proveedor de métricas. Compruebe si las entidades propias tiene valores de métricas',
    // Metric translations
    'metric.github.open_prs.title': 'GitHub PRs abiertas',
    'metric.github.open_prs.description':
      'Recuento actual de Pull Requests abiertas para un repositorio de GitHub dado.',
    'metric.jira.open_issues.title': 'Jira tickets bloqueantes abiertos',
    'metric.jira.open_issues.description':
      'Destaca el número de problemas críticos y bloqueantes que están actualmente abiertos en Jira.',

    // Threshold translations
    'thresholds.success': 'Éxito',
    'thresholds.warning': 'Advertencia',
    'thresholds.error': 'Error',
    'thresholds.noEntities': 'No hay entidades en el estado {{category}}',
    'thresholds.entities_one': '{{count}} entidad',
    'thresholds.entities_other': '{{count}} entidades',
  },
});

export default scorecardTranslationEs;
