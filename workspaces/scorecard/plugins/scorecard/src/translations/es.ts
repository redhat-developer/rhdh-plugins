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
    'common.loading': 'Cargando',
    'emptyState.altText': 'No hay tarjetas de puntuación',
    'emptyState.button': 'Ver documentación',
    'emptyState.description':
      'Las tarjetas de puntuación ayudan a monitorear el estado del componente de un vistazo. Para comenzar, explore la documentación para obtener pautas de configuración.',
    'emptyState.title': 'Aún no se agregaron tarjetas de puntuación',
    'entitiesPage.entitiesTable.footer.allRows': 'Todas las filas',
    'entitiesPage.entitiesTable.footer.of': 'de',
    'entitiesPage.entitiesTable.footer.rows_one': '{{count}} fila',
    'entitiesPage.entitiesTable.footer.rows_other': '{{count}} filas',
    'entitiesPage.entitiesTable.header.entity': 'Entidad',
    'entitiesPage.entitiesTable.header.kind': 'Tipo',
    'entitiesPage.entitiesTable.header.lastUpdated': 'Última actualización',
    'entitiesPage.entitiesTable.header.owner': 'Propietario',
    'entitiesPage.entitiesTable.header.status': 'Estado',
    'entitiesPage.entitiesTable.header.value': 'Valor',
    'entitiesPage.entitiesTable.title': 'Entidades',
    'entitiesPage.entitiesTable.titleWithCount': 'Entidades ({{count}})',
    'entitiesPage.entitiesTable.unavailable': 'No disponible',
    'entitiesPage.metricProviderNotRegistered':
      'El proveedor de métricas con el ID {{metricId}} no está registrado.',
    'entitiesPage.missingPermission':
      'Para ver las métricas de la tarjeta de puntuación, su administrador debe otorgarle el permiso requerido.',
    'entitiesPage.noDataFound':
      'Para ver sus datos aquí, compruebe que sus entidades informen valores relacionados con esta métrica.',
    'entitiesPage.unknownMetric': 'Métrica desconocida',
    'errors.authenticationError': 'Error de autenticación',
    'errors.authenticationErrorMessage': 'Inicie sesión para ver sus datos.',
    'errors.entityMissingProperties':
      'Entidad a la que le faltan las propiedades requeridas para la búsqueda en la tarjeta de puntuación',
    'errors.fetchError':
      'Error al extraer las tarjetas de puntuación: {{error}}',
    'errors.invalidApiResponse':
      'Formato de respuesta no válido de la API de la tarjeta de puntuación',
    'errors.invalidThresholds': 'Umbrales no válidos',
    'errors.metricDataUnavailable': 'Datos métricos no disponibles',
    'errors.missingAggregationId':
      'La tarjeta de puntuación está mal configurada; no se proporcionó la propiedad de ID de agregación (o ID de métrica)',
    'errors.missingPermission': 'Permiso faltante',
    'errors.missingPermissionMessage':
      'Para ver las métricas de la tarjeta de puntuación, su administrador debe otorgarle el permiso requerido.',
    'errors.noDataFound': 'No se encontraron datos',
    'errors.noDataFoundMessage':
      'Para ver sus datos aquí, compruebe que sus entidades informen valores relacionados con esta métrica.',
    'errors.unsupportedAggregationType':
      'Esta tarjeta de puntuación utiliza un tipo de agregación que no es compatible con esta versión del complemento.',
    'errors.userNotFoundInCatalogMessage':
      'No se encontró la entidad de usuario en el catálogo.',
    'metric.averageCenterTooltipMaxLabel': 'Puntuación máxima posible',
    'metric.averageCenterTooltipTotalLabel': 'Puntuación total',
    'metric.averageLegendTooltipEntitiesEach_one':
      '{{count}} entidad, cada una con {{score}}',
    'metric.averageLegendTooltipEntitiesEach_other':
      '{{count}} entidades, cada una con {{score}}',
    'metric.averageLegendTooltipRowTotal': 'Puntuación total {{total}}',
    'metric.drillDownCalculationFailures':
      'No se pudieron validar una o más entidades cuando se calculó esta métrica.',
    'metric.filecheck.description':
      'Comprueba si el archivo {{name}} existe en el repositorio.',
    'metric.filecheck.title': 'Verificación de archivo: {{name}}',
    'metric.github.open_prs.description':
      'Recuento actual de solicitudes de extracción abiertas para un repositorio de GitHub determinado.',
    'metric.github.open_prs.title': 'PR abiertas de GitHub',
    'metric.homepageEntityCalculationHealth':
      '{{healthy}} / {{total}} entidades sin errores de cálculo de métricas',
    'metric.homepageEntityHealthRatio': '{{healthy}}/{{total}} entidades',
    'metric.jira.open_issues.description':
      'Destaca la cantidad de problemas críticos y bloqueantes que están abiertos actualmente en Jira.',
    'metric.jira.open_issues.title': 'Tickets de bloqueo abiertos en Jira',
    'metric.lastUpdated': 'Última actualización: {{timestamp}}',
    'metric.lastUpdatedNotAvailable': 'Última actualización: no disponible',
    'metric.someEntitiesNotReportingValues':
      'Algunas entidades no informan valores relacionados con esta métrica.',
    'metric.sonarqube.code_coverage.description':
      'Porcentaje general de cobertura de código en SonarQube.',
    'metric.sonarqube.code_coverage.title': 'Cobertura de código de SonarQube',
    'metric.sonarqube.code_duplications.description':
      'Porcentaje de líneas duplicadas en SonarQube.',
    'metric.sonarqube.code_duplications.title':
      'Duplicaciones de código de SonarQube',
    'metric.sonarqube.maintainability_issues.description':
      'Cantidad de code smells abiertos en SonarQube.',
    'metric.sonarqube.maintainability_issues.title':
      'Problemas de mantenibilidad de SonarQube',
    'metric.sonarqube.maintainability_rating.description':
      'Calificación de mantenibilidad de SonarQube.',
    'metric.sonarqube.maintainability_rating.title':
      'Calificación de mantenibilidad de SonarQube',
    'metric.sonarqube.open_issues.description':
      'Cantidad de problemas abiertos (ABIERTOS, CONFIRMADOS, REABIERTOS) en SonarQube.',
    'metric.sonarqube.open_issues.title': 'Problemas abiertos de SonarQube',
    'metric.sonarqube.quality_gate.description':
      'Si el proyecto supera el control de calidad de SonarQube.',
    'metric.sonarqube.quality_gate.title':
      'Estado del control de calidad de SonarQube',
    'metric.sonarqube.reliability_issues.description':
      'Cantidad de errores abiertos en SonarQube.',
    'metric.sonarqube.reliability_issues.title':
      'Problemas de confiabilidad de SonarQube',
    'metric.sonarqube.reliability_rating.description':
      'Calificación de confiabilidad de SonarQube.',
    'metric.sonarqube.reliability_rating.title':
      'Calificación de confiabilidad de SonarQube',
    'metric.sonarqube.security_hotspots.description':
      'Cantidad de puntos críticos de seguridad que deben revisarse en SonarQube.',
    'metric.sonarqube.security_hotspots.title':
      'Puntos críticos de seguridad SonarQube',
    'metric.sonarqube.security_issues.description':
      'Cantidad de vulnerabilidades de seguridad abiertas en SonarQube.',
    'metric.sonarqube.security_issues.title':
      'Problemas de seguridad de SonarQube',
    'metric.sonarqube.security_rating.description':
      'Calificación de seguridad de SonarQube.',
    'metric.sonarqube.security_rating.title':
      'Calificación de seguridad de SonarQube',
    'metric.sonarqube.security_review_rating.description':
      'Calificación de la revisión de seguridad de SonarQube.',
    'metric.sonarqube.security_review_rating.title':
      'Calificación de la revisión de seguridad de SonarQube',
    'notFound.altText': 'Pagina no encontrada',
    'notFound.contactSupport': 'Comuníquese con Soporte',
    'notFound.description':
      'Intente agregar un archivo {{indexFile}} en la root del directorio docs de este repositorio.',
    'notFound.goBack': 'Volver',
    'notFound.readMore': 'Leer más',
    'notFound.title': '404 No pudimos encontrar esa página',
    'permissionRequired.altText': 'Permiso requerido',
    'permissionRequired.button': 'Leer más',
    'permissionRequired.description':
      'Para ver el complemento de tarjetas de puntuación, comuníquese con su administrador para que le otorgue el permiso {{permission}}.',
    'permissionRequired.title': 'Permiso faltante',
    'thresholds.entities_one': '{{count}} entidad',
    'thresholds.entities_other': '{{count}} entidades',
    'thresholds.error': 'Error',
    'thresholds.exist': 'Existente',
    'thresholds.missing': 'Faltante',
    'thresholds.noEntities': 'No hay entidades en el estado {{category}}',
    'thresholds.success': 'Éxito',
    'thresholds.warning': 'Advertencia',
  },
});

export default scorecardTranslationEs;
