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
      'Inicie y realice el seguimiento de la conversión asíncrona de automatización existente a playbooks Ansible listos para producción.',
    'table.columns.name': 'Nombre',
    'table.columns.status': 'Estado',
    'table.columns.statusSortDisabledTooltip':
      'La ordenación por estado no está disponible cuando el número de proyectos supera {{threshold}}',
    'table.columns.sourceRepo': 'Repositorio de origen',
    'table.columns.targetRepo': 'Repositorio de destino',
    'table.columns.createdAt': 'Creado el',
    'table.actions.deleteProject': 'Eliminar proyecto',
    'table.actions.retriggerInit': 'Reiniciar fase de inicio del proyecto',
    'table.actions.expandAll': 'Expandir todas las filas',
    'table.actions.collapseAll': 'Contraer todas las filas',
    'table.actions.expandRow': 'Expandir fila',
    'table.actions.collapseRow': 'Contraer fila',
    'table.projectsCount': 'Proyectos ({{count}})',
    empty: '-',
    'initPhaseCard.title': 'Fase de descubrimiento',
    'projectDetailsCard.title': 'Detalles del proyecto',
    'projectDetailsCard.name': 'Nombre',
    'projectDetailsCard.status': 'Estado',
    'projectDetailsCard.ownedBy': 'Propietario',
    'projectDetailsCard.dirName': 'Nombre del directorio',
    'projectDetailsCard.description': 'Descripción',
    'projectDetailsCard.sourceRepo': 'Repositorio de origen',
    'projectDetailsCard.targetRepo': 'Repositorio de destino',
    'projectDetailsCard.edit': 'Editar',
    'editProjectDialog.title': 'Editar proyecto',
    'editProjectDialog.cancel': 'Cancelar',
    'editProjectDialog.update': 'Actualizar',
    'editProjectDialog.updateError': 'Error al actualizar el proyecto',
    'editProjectDialog.ownerChangeWarningTitle':
      'Confirmar transferencia de propiedad',
    'editProjectDialog.ownerChangeWarning':
      'Cambiar el propietario puede hacer que pierda el acceso a este proyecto si sus permisos no cubren al nuevo propietario. Un administrador puede restaurar el acceso si es necesario.',
    'editProjectDialog.ownerChangeConfirm': 'Transferir propiedad',
    'editProjectDialog.nameRequired': 'El nombre es obligatorio',
    'editProjectDialog.ownerFormatHint':
      'Debe ser una referencia de entidad de Backstage, p.ej. user:default/nombre o group:default/equipo',
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
    'project.ownedBy': 'Propietario',
    'project.dirName': 'Nombre del directorio',
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
      'Inicie y realice el seguimiento de la conversión de automatización existente a Ansible listo para producción',
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
    'module.summary.cancelled': 'Cancelado',
    'module.summary.toReview_one':
      '{{count}} módulo con artefactos para revisar',
    'module.summary.toReview_other':
      '{{count}} módulos con artefactos para revisar',
    'module.actions.runNextPhase': 'Ejecutar la siguiente fase {{phase}}',
    'module.actions.cancelPhase': 'Cancelar la fase {{phase}}',
    'module.actions.cancelPhaseError':
      'Error al cancelar la fase para el módulo',
    'module.actions.runNextPhaseError':
      'Error al ejecutar la siguiente fase para el módulo',
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
    'module.statuses.cancelled': 'Cancelado',
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
    'modulePage.phases.statuses.cancelled': 'Cancelado',
    'modulePage.phases.reanalyzeInstructions':
      'El plan de migración del módulo ya existe. Si el plan de migración general del proyecto se ha actualizado, vuelva a ejecutar el análisis para reflejar los cambios.',
    'modulePage.phases.rerunAnalyze': 'Recrear el plan de migración del módulo',
    'modulePage.phases.analyzeInstructions':
      'Antes de ejecutar el análisis, revise primero el plan de migración general del proyecto; su contenido guiará el análisis del módulo.',
    'modulePage.phases.runAnalyze': 'Crear plan de migración del módulo',
    'modulePage.phases.migrateInstructions':
      'Antes de ejecutar la migración, revise el plan de migración del módulo. El proceso de migración convertirá el código fuente a Ansible basado en el plan.',
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
    'modulePage.phases.cancel': 'Cancelar',
    'modulePage.phases.runError': 'Error al ejecutar la fase para el módulo',
    'modulePage.phases.cancelError': 'Error al cancelar la fase para el módulo',
    'modulePage.phases.commitId': 'Último ID de commit',
    'modulePage.phases.viewLog': 'Ver registro',
    'modulePage.phases.hideLog': 'Ocultar registro',
    'modulePage.phases.noLogsAvailable': 'Aún no hay registros disponibles...',
    'modulePage.phases.logWaitingForStream':
      'Esperando la salida de registro del clúster...',
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
    'bulkRun.projectAction': 'Ejecutar todos los módulos',
    'bulkRun.globalAction': 'Ejecutar todo',
    'bulkRun.projectPageAction': 'Ejecutar todo',
    'bulkRun.projectConfirm.title':
      '¿Ejecutar todos los módulos en el proyecto "{{name}}"?',
    'bulkRun.projectConfirm.message':
      'Esto activará la siguiente fase de migración para cada módulo en este proyecto cuyo estado actual lo permita. Asegúrese de haber revisado todos los artefactos necesarios en los repositorios de destino antes de ejecutar esta acción. Los módulos que no sean elegibles se omitirán.',
    'bulkRun.globalConfirm.title':
      '¿Ejecutar todos los proyectos y módulos elegibles?',
    'bulkRun.globalConfirm.message':
      'Esto activará la siguiente fase de migración para todos los módulos elegibles en todos los proyectos a los que tiene acceso de escritura, incluidos los proyectos no visibles en la página actual. Asegúrese de haber revisado todos los artefactos necesarios en los repositorios de destino antes de ejecutar esta acción.',
    'bulkRun.globalConfirm.messageInitRetrigger':
      'Algunos proyectos son elegibles para volver a ejecutar la fase de inicio. Su fase de descubrimiento también será reactivada.',
    'bulkRun.globalConfirm.noInitEligible':
      'Actualmente no hay proyectos elegibles para volver a ejecutar la fase de inicio.',
    'bulkRun.globalConfirm.userPromptLabel':
      'Instrucciones del usuario para reinicio de init (opcional)',
    'bulkRun.globalConfirm.userPromptPlaceholder':
      'Si algún proyecto necesita reiniciar su fase de init, estas instrucciones se usarán para personalizar la conversión…',
    'bulkRun.projectPageConfirm.title':
      '¿Ejecutar todos los módulos en "{{name}}"?',
    'bulkRun.projectPageConfirm.message':
      'Esto activará la siguiente fase de migración para cada módulo en este proyecto cuyo estado actual lo permita. Asegúrese de haber revisado todos los artefactos necesarios en los repositorios de destino antes de ejecutar esta acción. Los módulos que no sean elegibles se omitirán.',
    'bulkRun.confirm': 'Ejecutar todo',
    'bulkRun.cancel': 'Cancelar',
    'bulkRun.errorProject':
      'Error al ejecutar los módulos en el proyecto "{{name}}"',
    'bulkRun.errorModuleStart':
      'Error al iniciar la fase "{{phase}}" para el módulo "{{moduleName}}"',
    'bulkRun.errorGlobal': 'Error en la operación masiva',
    'retriggerInit.confirm.title':
      '¿Reiniciar la fase de inicio para "{{name}}"?',
    'retriggerInit.confirm.message':
      'Esto volverá a activar la fase de descubrimiento del proyecto, iniciando un nuevo trabajo de inicialización. Los resultados anteriores de inicialización serán reemplazados.',
    'retriggerInit.confirm.userPromptLabel':
      'Instrucciones del usuario (opcional)',
    'retriggerInit.confirm.userPromptPlaceholder':
      'Proporcione instrucciones adicionales para la conversión…',
    'retriggerInit.confirm.confirmButton': 'Reiniciar',
    'retriggerInit.firstTrigger.title':
      '¿Activar la fase de inicio para "{{name}}"?',
    'retriggerInit.firstTrigger.message':
      'Una vez confirmado, se iniciará la fase de descubrimiento de este proyecto. Es posible que se le soliciten los tokens SCM de origen y destino.',
    'retriggerInit.firstTrigger.userPromptLabel':
      'Instrucciones del usuario (opcional)',
    'retriggerInit.firstTrigger.userPromptPlaceholder':
      'Proporcione instrucciones adicionales para la conversión…',
    'retriggerInit.firstTrigger.confirmButton': 'Activar fase de inicio',
    'retriggerInit.error':
      'Error al reiniciar la fase de inicio del proyecto "{{name}}"',
    'retriggerInit.errorStart':
      'Error al iniciar la inicialización del proyecto',
    'scaffolder.rulesAcceptance.loadingRules': 'Cargando reglas...',
    'scaffolder.rulesAcceptance.noRulesConfigured':
      'No hay reglas configuradas.',
    'scaffolder.rulesAcceptance.required': 'obligatorio',
    'scaffolder.rulesAcceptance.fetchError': 'Error al cargar las reglas',
    'rulesPage.title': 'Reglas de conversión',
    'rulesPage.subtitle':
      'Gestione las reglas que los proyectos deben aceptar en el momento de la creación.',
    'rulesPage.addRule': 'Agregar regla',
    'rulesPage.manageRules': 'Gestionar reglas',
    'rulesPage.notAllowed': 'No tiene permiso para gestionar reglas.',
    'rulesPage.table.id': 'ID',
    'rulesPage.table.title': 'Título',
    'rulesPage.table.description': 'Descripción',
    'rulesPage.table.required': 'Obligatorio',
    'rulesPage.table.optional': 'Opcional',
    'rulesPage.table.createdAt': 'Creado',
    'rulesPage.table.editRule': 'Editar regla',
    'rulesPage.table.deleteRule': 'Eliminar regla',
    'rulesPage.table.noRules': 'Aún no se han definido reglas.',
    'rulesPage.deleteConfirm.title': '¿Eliminar regla "{{title}}"?',
    'rulesPage.deleteConfirm.message':
      'Esta regla se eliminará permanentemente. Los proyectos existentes que ya aceptaron esta regla no se verán afectados.',
    'rulesPage.deleteConfirm.confirm': 'Eliminar',
    'rulesPage.deleteConfirm.cancel': 'Cancelar',
    'rulesPage.deleteConfirm.deleteError': 'Error al eliminar la regla',
    'rulesPage.dialog.createTitle': 'Crear regla',
    'rulesPage.dialog.editTitle': 'Editar regla',
    'rulesPage.dialog.titleField': 'Título',
    'rulesPage.dialog.descriptionField': 'Descripción',
    'rulesPage.dialog.requiredField': 'Obligatorio para todos los proyectos',
    'rulesPage.dialog.save': 'Guardar',
    'rulesPage.dialog.cancel': 'Cancelar',
    'rulesPage.dialog.createError': 'Error al crear la regla',
    'rulesPage.dialog.updateError': 'Error al actualizar la regla',
  },
});

export default x2aPluginTranslationEs;
