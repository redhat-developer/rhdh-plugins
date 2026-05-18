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
 * es translation for plugin.x2a.
 * @public
 */
const x2aPluginTranslationEs = createTranslationMessages({
  ref: x2aPluginTranslationRef,
  messages: {
    'sidebar.x2a.title': 'Conversion Hub',
    'page.title': 'Conversion Hub',
    'page.subtitle':
      'Inicie y realice el seguimiento de la conversión asíncrona de la automatización existente en Ansible Playbooks listos para producción.',
    'projectPage.title': 'Proyecto',
    'projectPage.deleteProject': 'Eliminar',
    'projectPage.actionsTooltip':
      'Haga clic para abrir el menú de acciones del proyecto',
    'projectPage.deleteError': 'No se pudo eliminar el proyecto',
    'projectPage.deleteConfirm.title':
      '¿Desea eliminar el proyecto “{{name}}”?',
    'projectModulesCard.title': 'Módulos ({{count}})',
    'projectModulesCard.published': 'publicados',
    'initPhaseCard.title': 'Fase de detección',
    'modulePage.title': 'Detalles del módulo',
    'modulePage.artifacts.title': 'Artefactos para revisar',
    'modulePage.artifacts.migration_plan':
      'Plan general de migración de proyectos',
    'modulePage.artifacts.module_migration_plan':
      'Plan de módulos por análisis',
    'modulePage.artifacts.migrated_sources': 'Fuentes migradas',
    'modulePage.artifacts.ansible_project': 'Proyecto AAP',
    'modulePage.artifacts.description':
      'Estos artefactos se generan en el proceso de conversión y están disponibles para su revisión.',
    'modulePage.phases.title': 'Fases de migración',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.duration': 'Duración',
    'modulePage.phases.k8sJobName': 'Nombre de la tarea de Kubernetes',
    'modulePage.phases.startedAt': 'Iniciado a las',
    'modulePage.phases.status': 'Estado',
    'modulePage.phases.errorDetails': 'Detalles del error',
    'modulePage.phases.statuses.notStarted': 'No iniciado',
    'modulePage.phases.statuses.pending': 'Pendiente',
    'modulePage.phases.statuses.running': 'En ejecución',
    'modulePage.phases.statuses.success': 'Éxito',
    'modulePage.phases.statuses.error': 'Error',
    'modulePage.phases.statuses.cancelled': 'Cancelada',
    'modulePage.phases.resyncMigrationPlanInstructions':
      'Vuelva a sincronizar la lista de módulos para que coincida con el plan de migración.',
    'modulePage.phases.reanalyzeInstructions':
      'El plan de migración del módulo ya está disponible. Si se ha actualizado el plan general de migración del proyecto, vuelva a activar el análisis para reflejar los cambios.',
    'modulePage.phases.analyzeInstructions':
      'Antes de ejecutar el análisis, revise el plan general de migración del proyecto. Su contenido guiará el análisis del módulo.',
    'modulePage.phases.migrateInstructions':
      'Antes de ejecutar la migración, revise el plan de migración del módulo. El proceso de migración convertirá el código fuente a Ansible en función del plan.',
    'modulePage.phases.remigrateInstructions':
      'Las fuentes migradas ya están presentes. Vuelva a activar la migración para recrear el código Ansible convertido.',
    'modulePage.phases.rerunMigrate': 'Recrear fuentes migradas',
    'modulePage.phases.publishInstructions':
      'Antes de publicar, revise las fuentes migradas. El proceso de publicación confirmará el código convertido en el repositorio de destino.',
    'modulePage.phases.republishInstructions':
      'El módulo ya se ha publicado. Vuelva a activar la publicación para actualizar el repositorio de destino.',
    'modulePage.phases.rerunPublish':
      'Vuelva a publicar en el repositorio de destino',
    'modulePage.phases.cancel': 'Cancelar',
    'modulePage.phases.runError': 'No se pudo ejecutar la fase del módulo',
    'modulePage.phases.cancelError': 'No se pudo cancelar la fase del módulo',
    'modulePage.phases.commitId': 'ID de la última confirmación',
    'modulePage.phases.viewLog': 'Ver registro',
    'modulePage.phases.hideLog': 'Ocultar registro',
    'modulePage.phases.noLogsAvailable': 'Aún no hay registros disponibles…',
    'modulePage.phases.logWaitingForStream':
      'Esperando la salida de registro del clúster…',
    'modulePage.phases.telemetry.title': 'Telemetría',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'No hay telemetría disponible',
    'modulePage.phases.telemetry.agentName': 'Nombre del agente',
    'modulePage.phases.telemetry.duration': 'Duración',
    'modulePage.phases.telemetry.inputTokens': 'Tokens de entrada',
    'modulePage.phases.telemetry.outputTokens': 'Tokens de salida',
    'modulePage.phases.telemetry.toolCalls':
      'Cantidad de llamadas a herramientas',
    'table.columns.name': 'Nombre',
    'table.columns.status': 'Estado',
    'table.columns.statusSortDisabledTooltip':
      'La ordenación por estado no está disponible cuando la cantidad de proyectos supera {{threshold}}',
    'table.columns.targetRepo': 'Repositorio de destino',
    'table.columns.createdAt': 'Creado a',
    'table.actions.deleteProject': 'Eliminar proyecto',
    'table.actions.retriggerInit':
      'Volver a activar la fase de inicialización del proyecto',
    'table.actions.expandAll': 'Expandir todas las filas',
    'table.actions.collapseAll': 'Contraer todas las filas',
    'table.actions.expandRow': 'Expandir fila',
    'table.actions.collapseRow': 'Contraer fila',
    'table.projectsCount': 'Proyectos ({{count}})',
    'common.newProject': 'Nuevo proyecto',
    'emptyPage.noConversionInitiatedYet':
      'Aún no se ha iniciado ninguna conversión',
    'emptyPage.noConversionInitiatedYetDescription':
      'Inicie y realice el seguimiento de la conversión de la automatización existente en Ansible listo para la producción',
    'emptyPage.startFirstConversion': 'Iniciar la primera conversión',
    'emptyPage.notAllowedTitle': 'Acceso denegado',
    'emptyPage.notAllowedDescription':
      'No tiene permiso para acceder a los proyectos de conversión.',
    'bulkRun.projectAction': 'Ejecutar todos los módulos',
    'bulkRun.globalAction': 'Ejecutar todo',
    'bulkRun.projectPageAction': 'Ejecutar todo',
    'bulkRun.projectConfirm.title':
      '¿Desea ejecutar todos los módulos en el proyecto “{{name}}”?',
    'bulkRun.cancel': 'Cancelar',
    'bulkRun.errorProject':
      'No se pudieron ejecutar los módulos en el proyecto “{{name}}”',
    'artifact.types.migration_plan': 'Plan de migración de proyectos',
    'artifact.types.module_migration_plan': 'Plan de migración de módulos',
    'artifact.types.migrated_sources': 'Fuentes migradas',
    'artifact.types.project_metadata': 'Metadatos del proyecto',
    'artifact.types.ansible_project': 'Proyecto AAP',
    'time.duration.daysAndHours': '{{days}}d {{hours}}h',
    'time.duration.daysOnly': '{{days}}d',
    'time.duration.hoursAndMinutes': '{{hours}}h {{minutes}}m',
    'time.duration.hoursOnly': '{{hours}}h',
    'time.duration.minutesAndSeconds': '{{minutes}}m {{seconds}}s',
    'time.duration.secondsOnly': '{{seconds}}s',
    'time.ago.daysAndHours': 'Hace {{days}}d {{hours}}h',
    'time.ago.daysOnly': 'Hace {{days}}d',
    'time.ago.hoursAndMinutes': 'Hace {{hours}}h {{minutes}}m',
    'time.ago.hoursOnly': 'Hace {{hours}}h',
    'time.ago.minutes': 'Hace {{minutes}}m',
    'time.ago.lessThanMinute': 'Hace menos de 1 minuto',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': 'Ejecutándose durante {{duration}}',
    empty: '-',
  },
});

export default x2aPluginTranslationEs;
