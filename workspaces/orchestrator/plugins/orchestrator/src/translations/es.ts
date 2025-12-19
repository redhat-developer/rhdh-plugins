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

const orchestratorTranslationEs = createTranslationMessages({
  ref: orchestratorTranslationRef,
  messages: {
    'page.title': 'Orquestador de Flujos de Trabajo',
    'page.tabs.workflows': 'Flujos de trabajo',
    'page.tabs.allRuns': 'Todas las ejecuciones',
    'page.tabs.workflowDetails': 'Detalles del flujo de trabajo',
    'page.tabs.workflowRuns': 'Ejecuciones del flujo de trabajo',
    'table.title.workflows': 'Flujos de trabajo',
    'table.title.allRuns': 'Todas las ejecuciones ({{count}})',
    'table.title.allWorkflowRuns':
      'Ejecuciones del flujo de trabajo ({{count}})',
    'table.headers.name': 'Nombre',
    'table.headers.runStatus': 'Estado de ejecución',
    'table.headers.started': 'Iniciado',
    'table.headers.status': 'Estado',
    'table.headers.lastRun': 'Última ejecución',
    'table.headers.lastRunStatus': 'Estado de la última ejecución',
    'table.headers.workflowStatus': 'Estado del flujo de trabajo',
    'table.headers.duration': 'Duración',
    'table.headers.description': 'Descripción',
    'table.headers.workflowName': 'Nombre del flujo de trabajo',
    'table.actions.run': 'Ejecutar',
    'table.actions.viewRuns': 'Ver ejecuciones',
    'table.actions.viewInputSchema': 'Ver esquema de entrada',
    'table.status.running': 'Ejecutándose',
    'table.status.failed': 'Fallido',
    'table.status.completed': 'Completado',
    'table.status.aborted': 'Abortado',
    'table.status.pending': 'Pendiente',
    'table.status.active': 'Activo',
    'table.filters.status': 'Estado',
    'table.filters.started': 'Iniciado',
    'table.filters.startedOptions.today': 'Hoy',
    'table.filters.startedOptions.yesterday': 'Ayer',
    'table.filters.startedOptions.last7days': 'Últimos 7 días',
    'table.filters.startedOptions.thisMonth': 'Este mes',
    'workflow.details': 'Detalles',
    'workflow.definition': 'Definición del flujo de trabajo',
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
      'ID de ejecución copiado a la portapapeles',
    'workflow.errors.retriggerFailed': 'Reactivar fallido: {{reason}}',
    'workflow.errors.abortFailed':
      'Abortar fallido: La ejecución ya ha sido completada.',
    'workflow.errors.abortFailedWithReason': 'Abortar fallido: {{reason}}',
    'workflow.errors.failedToLoadDetails':
      'Error al cargar los detalles para el ID de flujo de trabajo: {{id}}',
    'workflow.messages.areYouSureYouWantToRunThisWorkflow':
      '¿Estás seguro de que quieres ejecutar este flujo de trabajo?',
    'workflow.buttons.run': 'Ejecutar',
    'workflow.buttons.runWorkflow': 'Ejecutar flujo de trabajo',
    'workflow.buttons.runAgain': 'Ejecutar de nuevo',
    'workflow.buttons.running': 'Ejecutándose...',
    'workflow.buttons.fromFailurePoint': 'Desde el punto de fallo',
    'workflow.buttons.runFailedAgain': 'Reactivar fallido',
    'run.title': 'Ejecutar flujo de trabajo',
    'run.variables': 'Variables de ejecución',
    'run.inputs': 'Entradas',
    'run.pageTitle': '{{processName}} ejecución',
    'run.results': 'Resultados',
    'run.abort.title': '¿Abortar la ejecución del flujo de trabajo?',
    'run.abort.button': 'Abortar',
    'run.abort.warning':
      'Abortar detendrá inmediatamente todos los pasos en progreso y pendientes. Cualquier trabajo en progreso se perderá.',
    'run.abort.completed.title': 'Ejecución completada',
    'run.abort.completed.message':
      'No es posible abortar la ejecución ya que ha sido completada.',
    'run.status.completed': 'Ejecución completada',
    'run.status.failed': 'La ejecución ha fallado {{time}}',
    'run.status.aborted': 'La ejecución ha sido abortada',
    'run.status.completedWithMessage':
      'Ejecución completada {{time}} con mensaje',
    'run.status.completedAt': 'Ejecución completada {{time}}',
    'run.status.running':
      'El flujo de trabajo se está ejecutando. Iniciado {{time}}',
    'run.status.runningWaitingAtNode':
      'El flujo de trabajo se está ejecutando - esperando en el nodo {{node}} desde {{formattedTime}}',
    'run.status.workflowIsRunning':
      'El flujo de trabajo se está ejecutando. Iniciado {{time}}',
    'run.status.noAdditionalInfo':
      'El flujo de trabajo no proporcionó información adicional sobre el estado.',
    'run.status.resultsWillBeDisplayedHereOnceTheRunIsComplete':
      'Los resultados se mostrarán aquí una vez que la ejecución se complete.',
    'run.retrigger': 'Reactivar',
    'run.viewVariables': 'Ver variables',
    'run.suggestedNextWorkflow': 'Flujo de trabajo sugerido siguiente',
    'run.suggestedNextWorkflows': 'Flujos de trabajo sugeridos siguientes',
    'tooltips.completed': 'Completado',
    'tooltips.active': 'Activo',
    'tooltips.aborted': 'Abortado',
    'tooltips.suspended': 'Suspendido',
    'tooltips.pending': 'Pendiente',
    'tooltips.workflowDown':
      'El flujo de trabajo está actualmente inactivo o en estado de error',
    'tooltips.userNotAuthorizedAbort':
      'usuario no autorizado para abortar el flujo de trabajo',
    'tooltips.userNotAuthorizedExecute':
      'usuario no autorizado para ejecutar el flujo de trabajo',
    'messages.noDataAvailable': 'No hay datos disponibles',
    'messages.noVariablesFound':
      'No se encontraron variables para esta ejecución.',
    'messages.noInputSchemaWorkflow':
      'No hay esquema de entrada definido para este flujo de trabajo.',
    'messages.workflowInstanceNoInputs':
      'La instancia del flujo de trabajo no tiene entradas',
    'messages.missingJsonSchema.title':
      'Esquema JSON faltante para el formulario de entrada',
    'messages.missingJsonSchema.message':
      'Este flujo de trabajo no tiene un esquema JSON definido para la validación de entradas. Aún puedes ejecutar el flujo de trabajo, pero la validación de entradas será limitada.',
    'messages.additionalDetailsAboutThisErrorAreNotAvailable':
      'No hay detalles adicionales sobre este error disponibles',
    'reviewStep.hiddenFieldsNote':
      'Algunos campos están ocultos en esta página pero se incluirán en la solicitud de ejecución del flujo de trabajo.',
    'common.close': 'Cerrar',
    'common.cancel': 'Cancelar',
    'common.execute': 'Ejecutar',
    'common.details': 'Detalles',
    'common.links': 'Enlaces',
    'common.values': 'Valores',
    'common.unavailable': '---',
    'common.back': 'Atrás',
    'common.run': 'Ejecutar',
    'common.next': 'Siguiente',
    'common.review': 'Revisar',
    'duration.aFewSeconds': 'unos segundos',
    'duration.aSecond': 'un segundo',
    'duration.seconds': '{{count}} segundos',
    'duration.aMinute': 'un minuto',
    'duration.minutes': '{{count}} minutos',
    'duration.anHour': 'una hora',
    'duration.hours': '{{count}} horas',
    'duration.aDay': 'un día',
    'duration.days': '{{count}} días',
    'duration.aMonth': 'un mes',
    'duration.months': '{{count}} meses',
    'duration.aYear': 'un año',
    'duration.years': '{{count}} años',
    'stepperObjectField.error':
      'El campo de objeto del stepper no es compatible con esquemas que no contienen propiedades',
    'formDecorator.error':
      'El decorador de formularios debe proporcionar datos de contexto.',
    'aria.close': 'cerrar',
  },
});

export default orchestratorTranslationEs;
