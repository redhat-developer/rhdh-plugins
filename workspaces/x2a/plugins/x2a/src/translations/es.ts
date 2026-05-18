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
    'artifact.types.ansible_project': 'Proyecto AAP',
    'artifact.types.migrated_sources': 'Fuentes migradas',
    'artifact.types.migration_plan': 'Plan de migración de proyectos',
    'artifact.types.module_migration_plan': 'Plan de migración de módulos',
    'artifact.types.project_metadata': 'Metadatos del proyecto',
    'bulkRun.cancel': 'Cancelar',
    'bulkRun.confirm': 'Ejecutar todo',
    'bulkRun.errorGlobal': 'No se pudo ejecutar la operación masiva',
    'bulkRun.errorModuleStart':
      'No se pudo iniciar la fase “{{phase}}” para el módulo “{{moduleName}}”',
    'bulkRun.errorProject':
      'No se pudieron ejecutar los módulos en el proyecto “{{name}}”',
    'bulkRun.globalAction': 'Ejecutar todo',
    'bulkRun.globalConfirm.message':
      'Esto activará la siguiente fase de migración para todos los módulos que cumplan con los requisitos en todos los proyectos a los que tenga acceso de escritura, incluidos aquellos que no son visibles en la página actual. Asegúrese de que se hayan revisado todos los artefactos necesarios en los repositorios de destino antes de ejecutar esta acción.',
    'bulkRun.globalConfirm.messageInitRetrigger':
      'Algunos proyectos cumplen con los requisitos para volver a ejecutar la fase de inicialización. También se volverá a activar su fase de detección.',
    'bulkRun.globalConfirm.noInitEligible':
      'Actualmente, ningún proyecto cumple con los requisitos para volver a ejecutar la fase de inicialización.',
    'bulkRun.globalConfirm.title':
      '¿Desea ejecutar todos los proyectos y módulos que cumplan con los requisitos?',
    'bulkRun.globalConfirm.userPromptLabel':
      'Solicitud al usuario para volver a activar la inicialización (opcional)',
    'bulkRun.globalConfirm.userPromptPlaceholder':
      'Si es necesario volver a activar la fase de inicialización de algún proyecto, se utilizará esta solicitud para personalizar la conversión…',
    'bulkRun.projectAction': 'Ejecutar todos los módulos',
    'bulkRun.projectConfirm.message':
      'Esto activará la siguiente fase de migración para cada módulo de este proyecto que lo permita según su estado actual. Asegúrese de que se hayan revisado todos los artefactos necesarios en los repositorios de destino antes de ejecutar esta acción. Se omitirán los módulos que no cumplan con los requisitos.',
    'bulkRun.projectConfirm.title':
      '¿Desea ejecutar todos los módulos en el proyecto “{{name}}”?',
    'bulkRun.projectPageAction': 'Ejecutar todo',
    'bulkRun.projectPageConfirm.message':
      'Esto activará la siguiente fase de migración para cada módulo de este proyecto que lo permita según su estado actual. Asegúrese de que se hayan revisado todos los artefactos necesarios en los repositorios de destino antes de ejecutar esta acción. Se omitirán los módulos que no cumplan con los requisitos.',
    'bulkRun.projectPageConfirm.title':
      '¿Desea ejecutar todos los módulos en “{{name}}”?',
    'common.newProject': 'Nuevo proyecto',
    'editProjectDialog.cancel': 'Cancelar',
    'editProjectDialog.nameRequired': 'El nombre es obligatorio',
    'editProjectDialog.ownerChangeConfirm': 'Transferir propiedad',
    'editProjectDialog.ownerChangeWarning':
      'Cambiar el propietario puede hacer que pierda el acceso a este proyecto si sus permisos no cubren al nuevo propietario. Un administrador puede restaurar el acceso si es necesario.',
    'editProjectDialog.ownerChangeWarningTitle':
      'Confirmar transferencia de propiedad',
    'editProjectDialog.ownerFormatHint':
      'Debe ser una referencia de entidad de Backstage, p.ej. user:default/nombre o group:default/equipo',
    'editProjectDialog.title': 'Editar proyecto',
    'editProjectDialog.update': 'Actualizar',
    'editProjectDialog.updateError': 'Error al actualizar el proyecto',
    empty: '-',
    'emptyPage.noConversionInitiatedYet':
      'Aún no se ha iniciado ninguna conversión',
    'emptyPage.noConversionInitiatedYetDescription':
      'Inicie y realice el seguimiento de la conversión de la automatización existente en Ansible listo para la producción',
    'emptyPage.notAllowedDescription':
      'No tiene permiso para acceder a los proyectos de conversión.',
    'emptyPage.notAllowedTitle': 'Acceso denegado',
    'emptyPage.startFirstConversion': 'Iniciar la primera conversión',
    'initPhaseCard.title': 'Fase de detección',
    'module.actions.cancelPhase': 'Cancelar la fase {{phase}}',
    'module.actions.cancelPhaseError': 'No se pudo cancelar la fase del módulo',
    'module.actions.runNextPhase': 'Ejecutar la siguiente fase {{phase}}',
    'module.actions.runNextPhaseError':
      'No se pudo ejecutar la siguiente fase del módulo',
    'module.artifacts': 'Artefactos',
    'module.currentPhase': 'Fase actual',
    'module.lastUpdate': 'Última actualización',
    'module.name': 'Nombre',
    'module.notStarted': 'No iniciado',
    'module.phases.analyze': 'Analizar',
    'module.phases.init': 'Inicializar',
    'module.phases.migrate': 'Migrar',
    'module.phases.none': '-',
    'module.phases.publish': 'Publicar',
    'module.sourcePath': 'Ruta de origen',
    'module.status': 'Estado',
    'module.statuses.cancelled': 'Cancelada',
    'module.statuses.error': 'Error',
    'module.statuses.none': '-',
    'module.statuses.pending': 'Pendiente',
    'module.statuses.running': 'En ejecución',
    'module.statuses.success': 'Éxito',
    'module.summary.cancelled': 'Cancelada',
    'module.summary.error': 'Error',
    'module.summary.finished': 'Finalizado',
    'module.summary.pending': 'Pendiente',
    'module.summary.running': 'En ejecución',
    'module.summary.toReview_one':
      '{{count}} módulo con artefactos para revisar',
    'module.summary.toReview_other':
      '{{count}} módulos con artefactos para revisar',
    'module.summary.total': 'Total',
    'module.summary.waiting': 'En espera',
    'modulePage.artifacts.ansible_project': 'Proyecto AAP',
    'modulePage.artifacts.description':
      'Estos artefactos se generan en el proceso de conversión y están disponibles para su revisión.',
    'modulePage.artifacts.migrated_sources': 'Fuentes migradas',
    'modulePage.artifacts.migration_plan':
      'Plan general de migración de proyectos',
    'modulePage.artifacts.module_migration_plan':
      'Plan de módulos por análisis',
    'modulePage.artifacts.title': 'Artefactos para revisar',
    'modulePage.phases.analyzeInstructions':
      'Antes de ejecutar el análisis, revise el plan general de migración del proyecto. Su contenido guiará el análisis del módulo.',
    'modulePage.phases.cancel': 'Cancelar',
    'modulePage.phases.cancelError': 'No se pudo cancelar la fase del módulo',
    'modulePage.phases.commitId': 'ID de la última confirmación',
    'modulePage.phases.duration': 'Duración',
    'modulePage.phases.errorDetails': 'Detalles del error',
    'modulePage.phases.hideLog': 'Ocultar registro',
    'modulePage.phases.id': 'ID',
    'modulePage.phases.k8sJobName': 'Nombre de la tarea de Kubernetes',
    'modulePage.phases.logWaitingForStream':
      'Esperando la salida de registro del clúster…',
    'modulePage.phases.migrateInstructions':
      'Antes de ejecutar la migración, revise el plan de migración del módulo. El proceso de migración convertirá el código fuente a Ansible en función del plan.',
    'modulePage.phases.noLogsAvailable': 'Aún no hay registros disponibles…',
    'modulePage.phases.publishInstructions':
      'Antes de publicar, revise las fuentes migradas. El proceso de publicación confirmará el código convertido en el repositorio de destino.',
    'modulePage.phases.reanalyzeInstructions':
      'El plan de migración del módulo ya está disponible. Si se ha actualizado el plan general de migración del proyecto, vuelva a activar el análisis para reflejar los cambios.',
    'modulePage.phases.remigrateInstructions':
      'Las fuentes migradas ya están presentes. Vuelva a activar la migración para recrear el código Ansible convertido.',
    'modulePage.phases.republishInstructions':
      'El módulo ya se ha publicado. Vuelva a activar la publicación para actualizar el repositorio de destino.',
    'modulePage.phases.rerunAnalyze':
      'Volver a crear el plan de migración del módulo',
    'modulePage.phases.rerunMigrate': 'Recrear fuentes migradas',
    'modulePage.phases.rerunPublish':
      'Vuelva a publicar en el repositorio de destino',
    'modulePage.phases.resyncMigrationPlanInstructions':
      'Vuelva a sincronizar la lista de módulos para que coincida con el plan de migración.',
    'modulePage.phases.runAnalyze': 'Crear plan de migración del módulo',
    'modulePage.phases.runError': 'No se pudo ejecutar la fase del módulo',
    'modulePage.phases.runMigrate': 'Migrar fuentes de módulos',
    'modulePage.phases.runPublish': 'Publicar en el repositorio de destino',
    'modulePage.phases.startedAt': 'Iniciado a las',
    'modulePage.phases.status': 'Estado',
    'modulePage.phases.statuses.cancelled': 'Cancelada',
    'modulePage.phases.statuses.error': 'Error',
    'modulePage.phases.statuses.notStarted': 'No iniciado',
    'modulePage.phases.statuses.pending': 'Pendiente',
    'modulePage.phases.statuses.running': 'En ejecución',
    'modulePage.phases.statuses.success': 'Éxito',
    'modulePage.phases.telemetry.agentName': 'Nombre del agente',
    'modulePage.phases.telemetry.duration': 'Duración',
    'modulePage.phases.telemetry.inputTokens': 'Tokens de entrada',
    'modulePage.phases.telemetry.noTelemetryAvailable':
      'No hay telemetría disponible',
    'modulePage.phases.telemetry.outputTokens': 'Tokens de salida',
    'modulePage.phases.telemetry.title': 'Telemetría',
    'modulePage.phases.telemetry.toolCalls':
      'Cantidad de llamadas a herramientas',
    'modulePage.phases.title': 'Fases de migración',
    'modulePage.phases.viewLog': 'Ver registro',
    'modulePage.title': 'Detalles del módulo',
    'page.subtitle':
      'Inicie y realice el seguimiento de la conversión asíncrona de la automatización existente en Ansible Playbooks listos para producción.',
    'page.title': 'Conversion Hub',
    'project.description': 'Descripción',
    'project.dirName': 'Nombre del directorio',
    'project.id': 'ID',
    'project.noModules': 'Aún no se han encontrado módulos…',
    'project.ownedBy': 'Propietario',
    'project.statuses.completed': 'Completado',
    'project.statuses.created': 'Creado',
    'project.statuses.failed': 'Fallido',
    'project.statuses.inProgress': 'En curso',
    'project.statuses.initialized': 'Inicializado',
    'project.statuses.initializing': 'Inicializando',
    'project.statuses.none': '-',
    'projectDetailsCard.description': 'Descripción',
    'projectDetailsCard.dirName': 'Nombre del directorio',
    'projectDetailsCard.edit': 'Editar',
    'projectDetailsCard.name': 'Nombre',
    'projectDetailsCard.ownedBy': 'Propietario',
    'projectDetailsCard.sourceRepo': 'Repositorio de origen',
    'projectDetailsCard.status': 'Estado',
    'projectDetailsCard.targetRepo': 'Repositorio de destino',
    'projectDetailsCard.title': 'Detalles del proyecto',
    'projectModulesCard.noModules': 'Aún no se han encontrado módulos…',
    'projectModulesCard.published': 'publicados',
    'projectModulesCard.title': 'Módulos ({{count}})',
    'projectModulesCard.toReview': 'revisados',
    'projectPage.actionsTooltip':
      'Haga clic para abrir el menú de acciones del proyecto',
    'projectPage.deleteConfirm.cancel': 'Cancelar',
    'projectPage.deleteConfirm.confirm': 'Eliminar',
    'projectPage.deleteConfirm.message':
      'Se eliminará este proyecto, todos sus módulos y tareas de forma permanente. Esta acción no se puede deshacer. Los artefactos almacenados en el repositorio de destino se conservarán.',
    'projectPage.deleteConfirm.title':
      '¿Desea eliminar el proyecto “{{name}}”?',
    'projectPage.deleteError': 'No se pudo eliminar el proyecto',
    'projectPage.deleteProject': 'Eliminar',
    'projectPage.title': 'Proyecto',
    'projectTable.deleteError': 'No se pudo eliminar el proyecto',
    'retriggerInit.confirm.confirmButton': 'Reactivar',
    'retriggerInit.confirm.message':
      'Esto volverá a activar la fase de detección del proyecto y comenzará una nueva tarea de inicialización. Se reemplazarán todos los resultados de inicialización anteriores.',
    'retriggerInit.confirm.title':
      '¿Desea volver a activar la fase de inicialización para “{{name}}”?',
    'retriggerInit.confirm.userPromptLabel': 'Solicitud del usuario (opcional)',
    'retriggerInit.confirm.userPromptPlaceholder':
      'Proporcione instrucciones adicionales para la conversión…',
    'retriggerInit.error':
      'No se pudo volver a activar la inicialización del proyecto “{{name}}”',
    'retriggerInit.errorStart':
      'No se pudo iniciar la inicialización del proyecto',
    'retriggerInit.firstTrigger.confirmButton':
      'Activar fase de inicialización',
    'retriggerInit.firstTrigger.message':
      'Una vez confirmado, se iniciará la fase de detección de este proyecto. Es posible que se soliciten sus tokens de control de versiones de origen y destino.',
    'retriggerInit.firstTrigger.title':
      '¿Desea activar la fase de inicialización para “{{name}}”?',
    'retriggerInit.firstTrigger.userPromptLabel':
      'Solicitud del usuario (opcional)',
    'retriggerInit.firstTrigger.userPromptPlaceholder':
      'Proporcione instrucciones adicionales para la conversión…',
    'rulesPage.addRule': 'Agregar regla',
    'rulesPage.deleteConfirm.cancel': 'Cancelar',
    'rulesPage.deleteConfirm.confirm': 'Eliminar',
    'rulesPage.deleteConfirm.deleteError': 'Error al eliminar la regla',
    'rulesPage.deleteConfirm.message':
      'Esta regla se eliminará permanentemente. Los proyectos existentes que ya aceptaron esta regla no se verán afectados.',
    'rulesPage.deleteConfirm.title': '¿Eliminar regla "{{title}}"?',
    'rulesPage.dialog.cancel': 'Cancelar',
    'rulesPage.dialog.createError': 'Error al crear la regla',
    'rulesPage.dialog.createTitle': 'Crear regla',
    'rulesPage.dialog.descriptionField': 'Descripción',
    'rulesPage.dialog.editTitle': 'Editar regla',
    'rulesPage.dialog.requiredField': 'Obligatorio para todos los proyectos',
    'rulesPage.dialog.save': 'Guardar',
    'rulesPage.dialog.titleField': 'Título',
    'rulesPage.dialog.updateError': 'Error al actualizar la regla',
    'rulesPage.manageRules': 'Gestionar reglas',
    'rulesPage.notAllowed': 'No tiene permiso para gestionar reglas.',
    'rulesPage.subtitle':
      'Gestione las reglas que los proyectos deben aceptar en el momento de la creación.',
    'rulesPage.table.createdAt': 'Creado',
    'rulesPage.table.deleteRule': 'Eliminar regla',
    'rulesPage.table.description': 'Descripción',
    'rulesPage.table.editRule': 'Editar regla',
    'rulesPage.table.id': 'ID',
    'rulesPage.table.noRules': 'Aún no se han definido reglas.',
    'rulesPage.table.optional': 'Opcional',
    'rulesPage.table.required': 'Obligatorio',
    'rulesPage.table.title': 'Título',
    'rulesPage.title': 'Reglas de conversión',
    'scaffolder.rulesAcceptance.fetchError': 'Error al cargar las reglas',
    'scaffolder.rulesAcceptance.loadingRules': 'Cargando reglas...',
    'scaffolder.rulesAcceptance.noRulesConfigured':
      'No hay reglas configuradas.',
    'scaffolder.rulesAcceptance.required': 'obligatorio',
    'sidebar.x2a.title': 'Conversion Hub',
    'table.actions.collapseAll': 'Contraer todas las filas',
    'table.actions.collapseRow': 'Contraer fila',
    'table.actions.deleteProject': 'Eliminar proyecto',
    'table.actions.expandAll': 'Expandir todas las filas',
    'table.actions.expandRow': 'Expandir fila',
    'table.actions.retriggerInit':
      'Volver a activar la fase de inicialización del proyecto',
    'table.columns.createdAt': 'Creado a',
    'table.columns.name': 'Nombre',
    'table.columns.sourceRepo': 'Repositorio de origen',
    'table.columns.status': 'Estado',
    'table.columns.statusSortDisabledTooltip':
      'La ordenación por estado no está disponible cuando la cantidad de proyectos supera {{threshold}}',
    'table.columns.targetRepo': 'Repositorio de destino',
    'table.projectsCount': 'Proyectos ({{count}})',
    'time.ago.daysAndHours': 'Hace {{days}}d {{hours}}h',
    'time.ago.daysOnly': 'Hace {{days}}d',
    'time.ago.hoursAndMinutes': 'Hace {{hours}}h {{minutes}}m',
    'time.ago.hoursOnly': 'Hace {{hours}}h',
    'time.ago.lessThanMinute': 'Hace menos de 1 minuto',
    'time.ago.minutes': 'Hace {{minutes}}m',
    'time.duration.daysAndHours': '{{days}}d {{hours}}h',
    'time.duration.daysOnly': '{{days}}d',
    'time.duration.hoursAndMinutes': '{{hours}}h {{minutes}}m',
    'time.duration.hoursOnly': '{{hours}}h',
    'time.duration.minutesAndSeconds': '{{minutes}}m {{seconds}}s',
    'time.duration.secondsOnly': '{{seconds}}s',
    'time.jobTiming.finished':
      'Finalizado hace {{timeAgo}} (tardó {{duration}})',
    'time.jobTiming.noStartTime': '-',
    'time.jobTiming.running': 'Ejecutándose durante {{duration}}',
  },
});

export default x2aPluginTranslationEs;
