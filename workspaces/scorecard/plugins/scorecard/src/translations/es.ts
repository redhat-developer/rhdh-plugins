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
    'common.current': 'actual',
    'card.menuAriaLabel': 'Más opciones',
    'card.viewDataSources': 'Ver fuentes de datos',
    'dataSourcesDialog.title': 'Fuentes de {{title}}',
    'dataSourcesDialog.close': 'Cerrar',
    'dataSourcesDialog.unknownPlugin': 'Desconocido',
    'dataSourcesDialog.statusTooltip':
      'El valor {{value}} coincide con el umbral {{status}} {{expression}}',
    'dataSourcesDialog.collectorStatusTooltip':
      'Este recopilador proporciona solo datos de entrada. El valor del check {{metric}} se calcula a partir de los recopiladores y se muestra en la tarjeta de scorecard.',
    'dataSourcesDialog.collectorEmptyValue': '--',
    'dataSourcesDialog.collectorUnavailableStatus': 'N/D',
    'dataSourcesDialog.columns.plugin': 'COMPLEMENTO',
    'dataSourcesDialog.columns.check': 'CONTROLAR',
    'dataSourcesDialog.columns.value': 'VALOR',
    'dataSourcesDialog.columns.status': 'ESTADO',
    'dataSourcesDialog.columns.lastSynced': 'ÚLTIMA SINCRONIZACIÓN',
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
    'metric.weightedStatusScoreCenterTooltipMaxLabel':
      'Puntuación máxima posible',
    'metric.weightedStatusScoreCenterTooltipTotalLabel': 'Puntuación total',
    'metric.weightedStatusScoreCenterTooltipBreakdownRow_one':
      '{{status}}: {{count}} entidad, puntuación: {{score}}',
    'metric.weightedStatusScoreCenterTooltipBreakdownRow_other':
      '{{status}}: {{count}} entidades, puntuación: {{score}}',
    'metric.weightedStatusScoreLegendTooltipEntitiesEach_one':
      '{{count}} entidad, cada una con {{score}}',
    'metric.weightedStatusScoreLegendTooltipEntitiesEach_other':
      '{{count}} entidades, cada una con {{score}}',
    'metric.weightedStatusScoreLegendTooltipRowTotal':
      'Puntuación total {{total}}',
    'metric.drillDownCalculationFailures':
      'No se pudieron validar una o más entidades cuando se calculó esta métrica.',
    'metric.dora.deploymentFrequency.description':
      'Registra la frecuencia con la que el código se implementa correctamente en producción durante los últimos 30 días. Los profesionales de élite implementan bajo demanda (varias veces al día).',
    'metric.dora.deploymentFrequency.title':
      'DORA: frecuencia de implementación',
    'metric.dora.medianLeadTimeForChanges.description':
      'Mide el tiempo medio transcurrido desde la confirmación del código hasta su implementación en producción durante los últimos 30 días. Los profesionales de élite tienen un tiempo de entrega inferior a 24 horas.',
    'metric.dora.medianLeadTimeForChanges.title':
      'DORA: tiempo medio de entrega de cambios',
    'metric.dora.changeFailureRate.description':
      'Controla el porcentaje de implementaciones que provocan fallos en producción durante los últimos 30 días. Los profesionales de élite mantienen una tasa de fallos en los cambios inferior al 5 %.',
    'metric.dora.changeFailureRate.title':
      'DORA: tasa de fallos en los cambios',
    'metric.dora.medianTimeToRestore.description':
      'Registra el tiempo medio necesario para restablecer el servicio tras un incidente en los últimos 30 días. Los profesionales de élite restablecen el servicio en menos de una hora.',
    'metric.dora.medianTimeToRestore.title':
      'DORA: tiempo medio de recuperación',
    'metric.filecheck.description':
      'Comprueba si el archivo {{name}} existe en el repositorio.',
    'metric.filecheck.title': 'Verificación de archivo: {{name}}',
    'metric.github.openPRs.description':
      'Recuento actual de solicitudes de extracción abiertas para un repositorio de GitHub determinado.',
    'metric.github.openPRs.title': 'PR abiertas de GitHub',
    'metric.gitlab.openIssues.title': 'Issues abiertos de GitLab',
    'metric.gitlab.openIssues.description':
      'Recuento actual de issues abiertos para un proyecto de GitLab determinado.',
    'metric.gitlab.openedIssues7d.title': 'Issues abiertos de GitLab (7 d)',
    'metric.gitlab.openedIssues7d.description':
      'Número de issues abiertos en los últimos 7 días para un proyecto de GitLab determinado.',
    'metric.gitlab.closedIssues7d.title': 'Issues cerrados de GitLab (7 d)',
    'metric.gitlab.closedIssues7d.description':
      'Número de issues en estado cerrado que se actualizaron en los últimos 7 días para un proyecto de GitLab determinado.',
    'metric.gitlab.openMergeRequests.title':
      'Merge requests abiertas de GitLab',
    'metric.gitlab.openMergeRequests.description':
      'Recuento actual de merge requests abiertas para un proyecto de GitLab determinado.',
    'metric.gitlab.openedMergeRequests7d.title':
      'Merge requests abiertas de GitLab (7 d)',
    'metric.gitlab.openedMergeRequests7d.description':
      'Número de merge requests abiertas en los últimos 7 días para un proyecto de GitLab determinado.',
    'metric.gitlab.closedMergeRequests7d.title':
      'Merge requests cerradas de GitLab (7 d)',
    'metric.gitlab.closedMergeRequests7d.description':
      'Número de merge requests en estado cerrado o fusionado que se actualizaron en los últimos 7 días para un proyecto de GitLab determinado.',
    'metric.gitlab.startedPipelines7d.title':
      'Pipelines iniciados de GitLab (7 d)',
    'metric.gitlab.startedPipelines7d.description':
      'Número de pipelines iniciados en los últimos 7 días para un proyecto de GitLab determinado.',
    'metric.gitlab.successfulPipelines7d.title':
      'Pipelines correctos de GitLab (7 d)',
    'metric.gitlab.successfulPipelines7d.description':
      'Número de pipelines finalizados correctamente en los últimos 7 días para un proyecto de GitLab determinado.',
    'metric.gitlab.failedPipelines7d.title':
      'Pipelines fallidos de GitLab (7 d)',
    'metric.gitlab.failedPipelines7d.description':
      'Número de pipelines fallidos en los últimos 7 días para un proyecto de GitLab determinado.',
    'metric.gitlab.pipelineSuccessRatio7d.title':
      'Tasa de éxito de pipelines de GitLab (7 d)',
    'metric.gitlab.pipelineSuccessRatio7d.description':
      'Proporción de pipelines correctos frente a correctos+fallidos en los últimos 7 días (porcentaje). Ignora pipelines pendientes, en ejecución y cancelados.',
    'metric.gitlab.pipelineSuccessRatio24h.title':
      'Tasa de éxito de pipelines de GitLab (24 h)',
    'metric.gitlab.pipelineSuccessRatio24h.description':
      'Proporción de pipelines correctos frente a correctos+fallidos en las últimas 24 horas (porcentaje). Ignora pipelines pendientes, en ejecución y cancelados.',
    'metric.gitlab.startedJobs7d.title': 'Jobs iniciados de GitLab (7 d)',
    'metric.gitlab.startedJobs7d.description':
      'Número de jobs iniciados en los últimos 7 días para un proyecto de GitLab determinado.',
    'metric.gitlab.successfulJobs7d.title': 'Jobs correctos de GitLab (7 d)',
    'metric.gitlab.successfulJobs7d.description':
      'Número de jobs finalizados correctamente en los últimos 7 días para un proyecto de GitLab determinado.',
    'metric.gitlab.failedJobs7d.title': 'Jobs fallidos de GitLab (7 d)',
    'metric.gitlab.failedJobs7d.description':
      'Número de jobs fallidos en los últimos 7 días para un proyecto de GitLab determinado.',
    'metric.gitlab.jobSuccessRatio7d.title':
      'Tasa de éxito de jobs de GitLab (7 d)',
    'metric.gitlab.jobSuccessRatio7d.description':
      'Proporción de jobs correctos frente a correctos+fallidos en los últimos 7 días (porcentaje). Ignora jobs pendientes, en ejecución y cancelados.',
    'metric.gitlab.jobSuccessRatio24h.title':
      'Tasa de éxito de jobs de GitLab (24 h)',
    'metric.gitlab.jobSuccessRatio24h.description':
      'Proporción de jobs correctos frente a correctos+fallidos en las últimas 24 horas (porcentaje). Ignora jobs pendientes, en ejecución y cancelados.',
    'metric.homepageEntityCalculationHealth':
      '{{healthy}} / {{total}} entidades sin errores de cálculo de métricas',
    'metric.homepageEntityHealthRatio': '{{healthy}}/{{total}} entidades',
    'aggregation.min': 'Mín.',
    'aggregation.max': 'Máx.',
    'aggregation.sum': 'Suma',
    'aggregation.count': 'Recuento',
    'aggregation.average': 'Promedio',
    'metric.jira.openIssues.description':
      'Destaca la cantidad de problemas críticos y bloqueantes que están abiertos actualmente en Jira.',
    'metric.jira.openIssues.title': 'Tickets de bloqueo abiertos en Jira',
    'metric.lastUpdated': 'Última actualización: {{timestamp}}',
    'metric.lastUpdatedNotAvailable': 'Última actualización: no disponible',
    'metric.someEntitiesNotReportingValues':
      'Algunas entidades no informan valores relacionados con esta métrica.',
    'metric.sonarqube.codeCoverage.description':
      'Porcentaje general de cobertura de código en SonarQube.',
    'metric.sonarqube.codeCoverage.title': 'Cobertura de código de SonarQube',
    'metric.sonarqube.codeDuplications.description':
      'Porcentaje de líneas duplicadas en SonarQube.',
    'metric.sonarqube.codeDuplications.title':
      'Duplicaciones de código de SonarQube',
    'metric.sonarqube.maintainabilityIssues.description':
      'Cantidad de code smells abiertos en SonarQube.',
    'metric.sonarqube.maintainabilityIssues.title':
      'Problemas de mantenibilidad de SonarQube',
    'metric.sonarqube.maintainabilityRating.description':
      'Calificación de mantenibilidad de SonarQube.',
    'metric.sonarqube.maintainabilityRating.title':
      'Calificación de mantenibilidad de SonarQube',
    'metric.sonarqube.openIssues.description':
      'Cantidad de problemas abiertos (ABIERTOS, CONFIRMADOS, REABIERTOS) en SonarQube.',
    'metric.sonarqube.openIssues.title': 'Problemas abiertos de SonarQube',
    'metric.sonarqube.qualityGate.description':
      'Si el proyecto supera el control de calidad de SonarQube.',
    'metric.sonarqube.qualityGate.title':
      'Estado del control de calidad de SonarQube',
    'metric.sonarqube.reliabilityIssues.description':
      'Cantidad de errores abiertos en SonarQube.',
    'metric.sonarqube.reliabilityIssues.title':
      'Problemas de confiabilidad de SonarQube',
    'metric.sonarqube.reliabilityRating.description':
      'Calificación de confiabilidad de SonarQube.',
    'metric.sonarqube.reliabilityRating.title':
      'Calificación de confiabilidad de SonarQube',
    'metric.sonarqube.securityHotspots.description':
      'Cantidad de puntos críticos de seguridad que deben revisarse en SonarQube.',
    'metric.sonarqube.securityHotspots.title':
      'Puntos críticos de seguridad SonarQube',
    'metric.sonarqube.securityIssues.description':
      'Cantidad de vulnerabilidades de seguridad abiertas en SonarQube.',
    'metric.sonarqube.securityIssues.title':
      'Problemas de seguridad de SonarQube',
    'metric.sonarqube.securityRating.description':
      'Calificación de seguridad de SonarQube.',
    'metric.sonarqube.securityRating.title':
      'Calificación de seguridad de SonarQube',
    'metric.sonarqube.securityReviewRating.description':
      'Calificación de la revisión de seguridad de SonarQube.',
    'metric.sonarqube.securityReviewRating.title':
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
    'thresholds.elite': 'Élite',
    'thresholds.entities_one': '{{count}} entidad',
    'thresholds.entities_other': '{{count}} entidades',
    'thresholds.error': 'Error',
    'thresholds.exist': 'Existente',
    'thresholds.low': 'Baja',
    'thresholds.medium': 'Media',
    'thresholds.missing': 'Faltante',
    'thresholds.noEntities': 'No hay entidades en el estado {{category}}',
    'thresholds.success': 'Éxito',
    'thresholds.warning': 'Advertencia',
  },
});

export default scorecardTranslationEs;
