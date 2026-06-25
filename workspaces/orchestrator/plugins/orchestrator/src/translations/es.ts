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
    'alerts.duplicateWorkflowIds.learnMore': 'Aprenda más',
    'alerts.duplicateWorkflowIds.message':
      'Se detectaron varios flujos de trabajo con el mismo ID. Asegúrese de utilizar ID únicos en las diferentes versiones.',
    'aria.close': 'cerrar',
    'common.back': 'Atrás',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.details': 'Detalles',
    'common.execute': 'Ejecutar',
    'common.goBack': 'Volver',
    'common.links': 'Enlaces',
    'common.next': 'Siguiente',
    'common.review': 'Revisar',
    'common.run': 'Ejecutar',
    'common.unavailable': '---',
    'common.values': 'Valores',
    'duration.aDay': 'un día',
    'duration.aFewSeconds': 'unos segundos',
    'duration.aMinute': 'un minuto',
    'duration.aMonth': 'un mes',
    'duration.aSecond': 'un segundo',
    'duration.aYear': 'un año',
    'duration.anHour': 'una hora',
    'duration.days': '{{count}} días',
    'duration.hours': '{{count}} horas',
    'duration.minutes': '{{count}} minutos',
    'duration.months': '{{count}} meses',
    'duration.seconds': '{{count}} segundos',
    'duration.years': '{{count}} años',
    'formDecorator.error':
      'El decorador de formulario debe proporcionar datos de contexto.',
    'messages.additionalDetailsAboutThisErrorAreNotAvailable':
      'No hay detalles adicionales disponibles sobre este error',
    'messages.missingJsonSchema.message':
      'Este flujo de trabajo no tiene un esquema JSON definido para la validación de entrada. Puede ejecutar el flujo de trabajo, pero la validación de entrada será limitada.',
    'messages.missingJsonSchema.title':
      'Falta un esquema JSON en el formulario de entrada',
    'messages.noDataAvailable': 'No hay datos disponibles',
    'messages.noInputSchemaWorkflow':
      'No se definió ningún esquema de entrada para este flujo de trabajo.',
    'messages.noVariablesFound':
      'No se encontraron variables para esta ejecución.',
    'messages.workflowInstanceNoInputs':
      'La instancia de flujo de trabajo no tiene entradas',
    'page.tabs.allRuns': 'Todas las ejecuciones',
    'page.tabs.workflowDetails': 'Detalles del flujo de trabajo',
    'page.tabs.workflowRuns': 'Ejecuciones del flujo de trabajo',
    'page.tabs.workflows': 'Flujos de trabajo',
    'page.title': 'Orquestador de flujos de trabajo',
    'permissions.accessDenied': 'Acceso denegado',
    'permissions.accessDeniedDescription':
      'No tiene permiso para ver la ejecución de este flujo de trabajo.',
    'permissions.contactAdmin':
      'Comuníquese con su administrador para solicitar los permisos necesarios.',
    'permissions.missingOwnership':
      'La ejecución de este flujo de trabajo no tiene información de propiedad registrada.',
    'permissions.notYourRun':
      'Otro usuario inició la ejecución de este flujo de trabajo.',
    'permissions.requiredPermission': 'Permiso requerido',
    'reviewStep.hiddenFieldsNote':
      'Algunos parámetros están ocultos en esta página.',
    'reviewStep.showHiddenParameters': 'Mostrar parámetros ocultos',
    'run.abort.button': 'Cancelar',
    'run.abort.completed.message':
      'No es posible cancelar la ejecución porque ya se completó.',
    'run.abort.completed.title': 'Ejecución completada',
    'run.abort.title': '¿Cancelar ejecución de flujo de trabajo?',
    'run.abort.warning':
      'Si cancela la ejecución, detendrá de inmediato todos los pasos en curso y pendientes. Todo trabajo en curso se perderá.',
    'run.inputs': 'Entradas',
    'run.logs.noLogsAvailable':
      'No hay registros disponibles para la ejecución de este flujo de trabajo.',
    'run.logs.title': 'Registros de ejecución',
    'run.logs.viewLogs': 'Ver registros',
    'run.messages.eventTriggered':
      'Se envió un evento para activar este flujo de trabajo. Aparecerá una vez que comience la ejecución.',
    'run.pageTitle': 'Ejecución de {{processName}}',
    'run.results': 'Resultados',
    'run.retrigger': 'Reactivar',
    'run.status.aborted': 'La ejecución se canceló',
    'run.status.completed': 'Ejecución completada',
    'run.status.completedAt': 'Ejecución completada {{time}}',
    'run.status.completedWithMessage':
      'Ejecución completada {{time}} con mensaje',
    'run.status.failed': 'La ejecución falló {{time}}',
    'run.status.failedAt': 'La ejecución falló {{time}}',
    'run.status.noAdditionalInfo':
      'El flujo de trabajo no proporcionó información adicional sobre el estado.',
    'run.status.resultsWillBeDisplayedHereOnceTheRunIsComplete':
      'Los resultados se mostrarán aquí una vez que se complete la ejecución.',
    'run.status.running':
      'El flujo de trabajo está en ejecución. Comenzó {{time}}',
    'run.status.runningWaitingAtNode':
      'El flujo de trabajo está en ejecución; esperando en el nodo {{node}} desde {{formattedTime}}',
    'run.status.workflowIsRunning':
      'El flujo de trabajo está en ejecución. Comenzó {{time}}',
    'run.suggestedNextWorkflow': 'Próximo flujo de trabajo sugerido',
    'run.suggestedNextWorkflows': 'Próximos flujos de trabajo sugeridos',
    'run.title': 'Ejecutar flujo de trabajo',
    'run.variables': 'Variables de ejecución',
    'run.viewVariables': 'Ver variables',
    'stepperObjectField.error':
      'El campo de objeto paso a paso no es compatible con esquemas que no contienen propiedades',
    'table.actions.run': 'Ejecutar',
    'table.actions.runAsEvent': 'Ejecutar como evento',
    'table.actions.viewInputSchema': 'Ver esquema de entrada',
    'table.actions.viewRuns': 'Ver ejecuciones',
    'table.filters.started': 'Iniciado',
    'table.filters.startedOptions.last7days': 'Últimos 7 días',
    'table.filters.startedOptions.thisMonth': 'Este mes',
    'table.filters.startedOptions.today': 'Hoy',
    'table.filters.startedOptions.yesterday': 'Ayer',
    'table.filters.status': 'Estado',
    'table.headers.description': 'Descripción',
    'table.headers.duration': 'Duración',
    'table.headers.lastRun': 'Última ejecución',
    'table.headers.lastRunStatus': 'Estado de la última ejecución',
    'table.headers.name': 'Nombre',
    'table.headers.runStatus': 'Estado de ejecución',
    'table.headers.started': 'Iniciado',
    'table.headers.status': 'Estado',
    'table.headers.version': 'Versión',
    'table.headers.workflowName': 'Nombre del flujo de trabajo',
    'table.headers.workflowStatus': 'Estado del flujo de trabajo',
    'table.status.aborted': 'Cancelado',
    'table.status.active': 'Activo',
    'table.status.completed': 'Completado',
    'table.status.failed': 'Fallido',
    'table.status.pending': 'Pendiente',
    'table.status.running': 'En ejecución',
    'table.title.allRuns': 'Todas las ejecuciones ({{count}})',
    'table.title.allWorkflowRuns':
      'Ejecuciones del flujo de trabajo ({{count}})',
    'table.title.workflows': 'Flujos de trabajo',
    'tooltips.aborted': 'Cancelado',
    'tooltips.active': 'Activo',
    'tooltips.completed': 'Completado',
    'tooltips.pending': 'Pendiente',
    'tooltips.suspended': 'Suspendido',
    'tooltips.userNotAuthorizedAbort':
      'Usuario no autorizado para cancelar el flujo de trabajo',
    'tooltips.userNotAuthorizedExecute':
      'Usuario no autorizado para ejecutar el flujo de trabajo',
    'tooltips.workflowDown':
      'El flujo de trabajo está actualmente inactivo o en estado de error',
    'workflow.buttons.fromFailurePoint': 'Desde el punto de fallo',
    'workflow.buttons.run': 'Ejecutar',
    'workflow.buttons.runAgain': 'Ejecutar nuevamente',
    'workflow.buttons.runAsEvent': 'Ejecutar como evento',
    'workflow.buttons.runFailedAgain': 'La ejecución falló nuevamente',
    'workflow.buttons.runWorkflow': 'Ejecutar flujo de trabajo',
    'workflow.buttons.running': 'En ejecución...',
    'workflow.definition': 'Definición de flujo de trabajo',
    'workflow.details': 'Detalles',
    'workflow.errors.abortFailed':
      'Error al cancelar: La ejecución ya se completó.',
    'workflow.errors.abortFailedWithReason': 'Error al cancelar: {{reason}}',
    'workflow.errors.failedToLoadDetails':
      'No se pudieron cargar los detalles del ID de flujo de trabajo: {{id}}',
    'workflow.errors.retriggerFailed': 'Error al reactivar: {{reason}}',
    'workflow.fields.description': 'Descripción',
    'workflow.fields.duration': 'Duración',
    'workflow.fields.runStatus': 'Estado de ejecución',
    'workflow.fields.started': 'Iniciado',
    'workflow.fields.version': 'Versión',
    'workflow.fields.workflow': 'Flujo de trabajo',
    'workflow.fields.workflowId': 'ID de ejecución',
    'workflow.fields.workflowIdCopied':
      'ID de ejecución copiado en el portapapeles',
    'workflow.fields.workflowStatus': 'Estado del flujo de trabajo',
    'workflow.messages.areYouSureYouWantToRunThisWorkflow':
      '¿Confirma que desea ejecutar este flujo de trabajo?',
    'workflow.messages.userNotAuthorizedExecute':
      'Usuario no autorizado para ejecutar el flujo de trabajo.',
    'workflow.messages.workflowDown':
      'El flujo de trabajo se encuentra actualmente inactivo o en estado de error. Si lo ejecuta ahora, pueden producirse errores o resultados inesperados.',
    'workflow.progress': 'Progreso del flujo de trabajo',
    'workflow.status.available': 'Disponible',
    'workflow.status.unavailable': 'No disponible',
    'samlSso.title': 'Sesión de GitHub SAML SSO expirada',
    'samlSso.reauthorizeButton': 'Reautorizar SSO',
    'samlSso.body':
      'Su sesión de GitHub SAML SSO ha expirado. Su organización requiere una sesión SAML activa para acceder a sus recursos.',
    'samlSso.reauthorizeHint':
      "Haga clic en 'Reautorizar SSO' para volver a autenticarse con el proveedor de identidad de su organización.",
    'samlSso.fallbackHint':
      'Por favor, cierre sesión y vuelva a iniciar sesión desde Configuración > Proveedores de autenticación para restablecer su sesión SAML.',
  },
});

export default orchestratorTranslationEs;
