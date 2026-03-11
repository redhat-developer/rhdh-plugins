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
    'table.columns.name': 'Nombre',
    'table.columns.status': 'Estado',
    'table.columns.sourceRepo': 'Repositorio de origen',
    'table.columns.targetRepo': 'Repositorio de destino',
    'table.columns.createdAt': 'Creado el',
    'table.actions.deleteProject': 'Eliminar proyecto',
    'table.actions.expandAll': 'Expandir todas las filas',
    'table.actions.collapseAll': 'Contraer todas las filas',
    'table.actions.expandRow': 'Expandir fila',
    'table.actions.collapseRow': 'Contraer fila',
    'table.projectsCount': 'Proyectos ({{count}})',
    empty: '-',
    'initPhaseCard.title': 'Fase de descubrimiento',
    'projectDetailsCard.title': 'Detalles del proyecto',
    'projectDetailsCard.name': 'Nombre',
    'projectDetailsCard.abbreviation': 'Abreviatura',
    'projectDetailsCard.status': 'Estado',
    'projectDetailsCard.createdBy': 'Propietario',
    'projectDetailsCard.description': 'Descripción',
    'projectDetailsCard.sourceRepo': 'Repositorio de origen',
    'projectDetailsCard.targetRepo': 'Repositorio de destino',
    'projectModulesCard.title': 'Módulos ({{count}})',
    'projectModulesCard.noModules': 'Aún no se encontraron módulos...',
    'projectModulesCard.toReview': 'revisar',
    'projectModulesCard.published': 'publicado',
    'projectPage.title': 'Proyecto',
    'projectPage.actionsTooltip':
      'Haga clic para abrir el menú para las acciones del proyecto',
    'projectPage.deleteError': 'Error al eliminar el proyecto',
    'projectPage.deleteProject': 'Eliminar',
    'projectPage.deleteConfirm.title': '¿Eliminar proyecto "{{name}}"?',
    'projectPage.deleteConfirm.message':
      'Este proyecto, todos sus módulos y trabajos se eliminarán permanentemente. Esta acción no se puede deshacer. Los artefactos persistidos en el repositorio de destino se preservarán.',
    'projectPage.deleteConfirm.cancel': 'Cancelar',
    'projectPage.deleteConfirm.confirm': 'Eliminar',
    'projectTable.deleteError': 'Error al eliminar el proyecto',
    'project.description': 'Descripción',
    'project.id': 'ID',
    'project.abbreviation': 'Abreviatura',
    'project.createdBy': 'Propietario',
    'project.statuses.none': '-',
    'project.statuses.created': 'Creado',
    'project.statuses.initializing': 'Inicializando',
    'project.statuses.initialized': 'Inicializado',
    'project.statuses.inProgress': 'En curso',
    'project.statuses.completed': 'Completado',
    'project.statuses.failed': 'Fallido',
    'project.noModules': 'Aún no se encontraron módulos...',
    'common.newProject': 'Nuevo proyecto',
    'emptyPage.noConversionInitiatedYet':
      'Aún no se ha iniciado ninguna conversión',
    'emptyPage.noConversionInitiatedYetDescription':
      'Inicie y realice el seguimiento de la conversión de archivos Chef a Ansible listos para producción',
    'emptyPage.startFirstConversion': 'Iniciar primera conversión',
    'emptyPage.notAllowedTitle': 'Acceso denegado',
    'emptyPage.notAllowedDescription':
      'No tiene permiso para acceder a los proyectos de conversión.',
    'module.phases.init': 'Inicio',
    'module.phases.none': '-',
    'module.phases.analyze': 'Analizar',
    'module.phases.migrate': 'Migrar',
    'module.phases.publish': 'Publicar',
    'module.summary.total': 'Total',
    'module.summary.finished': 'Finalizado',
    'module.summary.waiting': 'En espera',
    'module.summary.pending': 'Pendiente',
    'module.summary.running': 'En ejecución',
    'module.summary.error': 'Error',
    'module.summary.toReview_one':
      '{{count}} módulo con artefactos para revisar',
    'module.summary.toReview_other':
      '{{count}} módulos con artefactos para revisar',
    'module.actions.runNextPhase': 'Ejecutar siguiente fase',
    'module.currentPhase': 'Fase actual',
    'module.lastUpdate': 'Última actualización',
    'module.notStarted': 'No iniciado',
    'module.name': 'Nombre',
    'module.status': 'Estado',
    'module.sourcePath': 'Ruta de origen',
    'module.artifacts': 'Artefactos',
    'artifact.types.migration_plan': 'Plan de migración',
    'artifact.types.module_migration_plan': 'Plan del módulo',
    'module.statuses.none': '-',
    'module.statuses.pending': 'Pendiente',
    'module.statuses.running': 'En ejecución',
    'module.statuses.success': 'Éxito',
    'module.statuses.error': 'Error',
    'artifact.types.migrated_sources': 'Fuentes migradas',
    'artifact.types.project_metadata': 'Metadatos del proyecto',
    'artifact.types.ansible_project': 'Proyecto AAP',
    'modulePage.title': 'Detalles del módulo',
    'modulePage.artifacts.title': 'Artefactos para revisar',
    'modulePage.artifacts.migration_plan':
      'Plan de migración general del proyecto',
    'modulePage.artifacts.module_migration_plan':
      'Plan del módulo por análisis',
    'modulePage.artifacts.migrated_sources': 'Fuentes migradas',
    'modulePage.artifacts.ansible_project': 'Proyecto AAP',
    'modulePage.artifacts.description':
      'Estos artefactos son generados por el proceso de conversión y están disponibles para revisión.',
    'modulePage.phases.title': 'Fases de migración',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.duration': 'Duración',
    'modulePage.phases.k8sJobName': 'Nombre del trabajo de Kubernetes',
    'modulePage.phases.startedAt': 'Iniciado el',
    'modulePage.phases.status': 'Estado',
    'modulePage.phases.errorDetails': 'Detalles del error',
    'modulePage.phases.statuses.notStarted': 'No iniciado',
    'modulePage.phases.statuses.pending': 'Pendiente',
    'modulePage.phases.statuses.running': 'En ejecución',
    'modulePage.phases.statuses.success': 'Éxito',
    'modulePage.phases.statuses.error': 'Error',
    'modulePage.phases.reanalyzeInstructions':
      'El plan de migración del módulo ya existe. Si el plan de migración general del proyecto se ha actualizado, vuelva a ejecutar el análisis para reflejar los cambios.',
    'modulePage.phases.rerunAnalyze': 'Recrear el plan de migración del módulo',
    'modulePage.phases.analyzeInstructions':
      'Antes de ejecutar el análisis, revise primero el plan de migración general del proyecto; su contenido guiará el análisis del módulo.',
    'modulePage.phases.runAnalyze': 'Crear plan de migración del módulo',
    'modulePage.phases.migrateInstructions':
      'Antes de ejecutar la migración, revise el plan de migración del módulo. El proceso de migración convertirá el código Chef a Ansible basado en el plan.',
    'modulePage.phases.runMigrate': 'Migrar fuentes del módulo',
    'modulePage.phases.remigrateInstructions':
      'Las fuentes migradas ya existen. Vuelva a ejecutar la migración para recrear el código Ansible convertido.',
    'modulePage.phases.rerunMigrate': 'Recrear fuentes migradas',
    'modulePage.phases.publishInstructions':
      'Antes de publicar, revise las fuentes migradas. El proceso de publicación confirmará el código convertido en el repositorio de destino.',
    'modulePage.phases.runPublish': 'Publicar en el repositorio de destino',
    'modulePage.phases.republishInstructions':
      'El módulo ya ha sido publicado. Vuelva a ejecutar la publicación para actualizar el repositorio de destino.',
    'modulePage.phases.rerunPublish':
      'Volver a publicar en el repositorio de destino',
    'modulePage.phases.commitId': 'Último ID de commit',
    'modulePage.phases.viewLog': 'Ver registro',
    'modulePage.phases.hideLog': 'Ocultar registro',
    'modulePage.phases.noLogsAvailable': 'Aún no hay registros disponibles...',
    'modulePage.phases.telemetry.title': 'Telemetría',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'No hay telemetría disponible',
    'modulePage.phases.telemetry.agentName': 'Nombre del agente',
    'modulePage.phases.telemetry.duration': 'Duración',
    'modulePage.phases.telemetry.inputTokens': 'Tokens de entrada',
    'modulePage.phases.telemetry.outputTokens': 'Tokens de salida',
    'modulePage.phases.telemetry.toolCalls':
      'Cantidad de llamadas de herramientas',
    'modulePage.phases.resyncMigrationPlanInstructions':
      'Resincronizar la lista de módulos para que coincida con el plan de migración.',
    'time.duration.daysAndHours': '{{days}}d {{hours}}h',
    'time.duration.daysOnly': '{{days}}d',
    'time.duration.hoursAndMinutes': '{{hours}}h {{minutes}}min',
    'time.duration.hoursOnly': '{{hours}}h',
    'time.duration.minutesAndSeconds': '{{minutes}}min {{seconds}}s',
    'time.duration.secondsOnly': '{{seconds}}s',
    'time.ago.daysAndHours': 'hace {{days}}d {{hours}}h',
    'time.ago.daysOnly': 'hace {{days}}d',
    'time.ago.hoursAndMinutes': 'hace {{hours}}h {{minutes}}min',
    'time.ago.hoursOnly': 'hace {{hours}}h',
    'time.ago.minutes': 'hace {{minutes}}min',
    'time.ago.lessThanMinute': 'hace <1min',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': 'En ejecución desde hace {{duration}}',
    'time.jobTiming.finished': 'Finalizado {{timeAgo}} (duró {{duration}})',
  },
});

export default x2aPluginTranslationEs;
