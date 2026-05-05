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

import { orchestratorTranslationRef } from './ref';

/**
 * es translation for plugin.orchestrator.
 * @public
 */
const orchestratorTranslationEs = createTranslationMessages({
  ref: orchestratorTranslationRef,
  messages: {
    'page.title': 'Orquestador de flujos de trabajo',
    'page.tabs.workflows': 'Flujos de trabajo',
    'page.tabs.allRuns': 'Todas las ejecuciones',
    'page.tabs.workflowDetails': 'Detalles del flujo de trabajo',
    'page.tabs.workflowRuns': 'Ejecuciones del flujo de trabajo',
    'table.title.workflows': 'Flujos de trabajo',
    'table.title.allRuns': 'Todas las ejecuciones ({{count}})',
    'table.actions.run': 'Ejecutar',
    'table.actions.runAsEvent': 'Ejecutar como evento',
    'table.actions.viewRuns': 'Ver ejecuciones',
    'table.actions.viewInputSchema': 'Ver esquema de entrada',
    'table.status.running': 'En ejecución',
    'table.status.failed': 'Fallido',
    'table.status.completed': 'Completado',
    'table.status.aborted': 'Cancelado',
    'table.status.pending': 'Pendiente',
    'table.status.active': 'Activo',
    'table.filters.status': 'Estado',
    'table.filters.started': 'Iniciado',
    'table.filters.startedOptions.today': 'Hoy',
    'table.filters.startedOptions.yesterday': 'Ayer',
    'table.filters.startedOptions.last7days': 'Últimos 7 días',
    'table.filters.startedOptions.thisMonth': 'Este mes',
    'workflow.details': 'Detalles',
    'workflow.definition': 'Definición de flujo de trabajo',
    'workflow.progress': 'Progreso del flujo de trabajo',
    'workflow.status.available': 'Disponible',
    'workflow.status.unavailable': 'No disponible',
    'workflow.fields.workflow': 'Flujo de trabajo',
    'workflow.fields.workflowStatus': 'Estado del flujo de trabajo',
    'workflow.fields.runStatus': 'Estado de ejecución',
    'workflow.fields.duration': 'Duración',
    'workflow.fields.description': 'Descripción',
    'workflow.fields.started': 'Iniciado',
    'workflow.fields.workflowId': 'ID de ejecución',
    'workflow.fields.workflowIdCopied':
      'ID de ejecución copiado en el portapapeles',
    'workflow.fields.version': 'Versión',
    'table.headers.version': 'Versión',
    'workflow.errors.retriggerFailed': 'Error al reactivar: {{reason}}',
    'workflow.errors.abortFailedWithReason': 'Error al cancelar: {{reason}}',
    'workflow.buttons.runAsEvent': 'Ejecutar como evento',
    'run.title': 'Ejecutar flujo de trabajo',
    'run.pageTitle': 'Ejecución de {{processName}}',
    'run.variables': 'Variables de ejecución',
    'run.inputs': 'Entradas',
    'run.results': 'Resultados',
    'run.logs.viewLogs': 'Ver registros',
    'run.logs.title': 'Registros de ejecución',
    'run.logs.noLogsAvailable':
      'No hay registros disponibles para la ejecución de este flujo de trabajo.',
    'run.abort.title': '¿Cancelar ejecución de flujo de trabajo?',
    'run.abort.button': 'Cancelar',
    'run.abort.warning':
      'Si cancela la ejecución, detendrá de inmediato todos los pasos en curso y pendientes. Todo trabajo en curso se perderá.',
    'run.abort.completed.title': 'Ejecución completada',
    'run.abort.completed.message':
      'No es posible cancelar la ejecución porque ya se completó.',
    'run.status.completed': 'Ejecución completada',
    'run.status.failed': 'La ejecución falló {{time}}',
    'run.status.completedWithMessage':
      'Ejecución completada {{time}} con mensaje',
    'run.status.failedAt': 'La ejecución falló {{time}}',
    'run.messages.eventTriggered':
      'Se envió un evento para activar este flujo de trabajo. Aparecerá cuando comience la ejecución.',
    'run.viewVariables': 'Ver variables',
    'run.suggestedNextWorkflow': 'Próximo flujo de trabajo sugerido',
    'run.suggestedNextWorkflows': 'Próximos flujos de trabajo sugeridos',
    'tooltips.completed': 'Completado',
    'tooltips.active': 'Activo',
    'tooltips.aborted': 'Cancelado',
    'tooltips.suspended': 'Suspendido',
    'tooltips.pending': 'Pendiente',
    'tooltips.workflowDown':
      'El flujo de trabajo está actualmente inactivo o en estado de error',
    'tooltips.userNotAuthorizedAbort':
      'Usuario no autorizado para cancelar el flujo de trabajo',
    'tooltips.userNotAuthorizedExecute':
      'Usuario no autorizado para ejecutar el flujo de trabajo',
    'messages.noDataAvailable': 'No hay datos disponibles',
    'messages.noVariablesFound':
      'No se encontraron variables para esta ejecución.',
    'messages.noInputSchemaWorkflow':
      'No se definió ningún esquema de entrada para este flujo de trabajo.',
    'messages.workflowInstanceNoInputs':
      'La instancia de flujo de trabajo no tiene entradas',
    'messages.missingJsonSchema.title':
      'Falta un esquema JSON en el formulario de entrada',
    'messages.missingJsonSchema.message':
      'Este flujo de trabajo no tiene un esquema JSON definido para la validación de entrada. Puede ejecutar el flujo de trabajo, pero la validación de entrada será limitada.',
    'reviewStep.hiddenFieldsNote':
      'Algunos parámetros están ocultos en esta página.',
    'reviewStep.showHiddenParameters': 'Mostrar parámetros ocultos',
    'common.close': 'Cerrar',
    'common.cancel': 'Cancelar',
    'common.execute': 'Ejecutar',
    'common.details': 'Detalles',
    'common.links': 'Enlaces',
    'common.values': 'Valores',
    'common.back': 'Atrás',
    'common.run': 'Ejecutar',
    'common.next': 'Siguiente',
    'common.review': 'Revisar',
    'common.unavailable': '---',
    'common.goBack': 'Volver',
    'permissions.accessDenied': 'Acceso denegado',
    'permissions.accessDeniedDescription':
      'No tiene permiso para ver la ejecución de este flujo de trabajo.',
    'permissions.requiredPermission': 'Permiso requerido',
    'permissions.contactAdmin':
      'Comuníquese con su administrador para solicitar los permisos necesarios.',
    'permissions.missingOwnership':
      'La ejecución de este flujo de trabajo no tiene información de propiedad registrada.',
    'permissions.notYourRun':
      'Otro usuario inició la ejecución de este flujo de trabajo.',
    'duration.aFewSeconds': 'unos segundos',
    'duration.aSecond': 'un segundo',
    'duration.seconds': '{{count}} segundos',
    'duration.aMinute': 'un minuto',
    'duration.minutes': '{{count}} minutos',
    'duration.anHour': 'una hora',
    'duration.hours': '{{count}} horas',
    'duration.aDay': 'un día',
    'duration.days': '{{count}} días',
    'duration.aMonth': 'un mes',
    'duration.months': '{{count}} meses',
    'duration.aYear': 'un año',
    'duration.years': '{{count}} años',
    'alerts.duplicateWorkflowIds.message':
      'Se detectaron varios flujos de trabajo con el mismo ID. Use identificadores únicos entre versiones.',
    'alerts.duplicateWorkflowIds.learnMore': 'Más información',
    'stepperObjectField.error':
      'El campo de objeto paso a paso no es compatible con esquemas que no contienen propiedades',
    'formDecorator.error':
      'El decorador de formulario debe proporcionar datos de contexto.',
    'aria.close': 'cerrar',
  },
});

export default orchestratorTranslationEs;
