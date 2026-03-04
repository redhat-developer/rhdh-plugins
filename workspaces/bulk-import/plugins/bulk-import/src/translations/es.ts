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

import { bulkImportTranslationRef } from './ref';

/**
 * es translation for plugin.bulk-import.
 * @public
 */
const bulkImportTranslationEs = createTranslationMessages({
  ref: bulkImportTranslationRef,
  messages: {
    'page.title': 'Importación masiva',
    'page.subtitle': 'Importar entidades a Red Hat Developer Hub',
    'page.addRepositoriesTitle': 'Agregar repositorios',
    'page.importEntitiesTitle': 'Importar entidades',
    'page.addRepositoriesSubtitle':
      'Agregue repositorios a Red Hat Developer Hub en cuatro pasos',
    'page.importEntitiesSubtitle': 'Importar a Red Hat Developer Hub',
    'page.typeLink': 'Importación masiva',
    'sidebar.bulkImport': 'Importación masiva',
    'permissions.title': 'Permiso requerido',
    'permissions.addRepositoriesMessage':
      'Para agregar repositorios, comuníquese con su administrador para que le otorgue el permiso `bulk.import`.',
    'status.alreadyImported': 'Ya importado',
    'status.added': 'Agregado',
    'status.waitingForApproval': 'Esperando aprobación',
    'status.imported': 'Importado',
    'status.readyToImport': 'Listo para importar',
    'status.waitingForPullRequestToStart':
      'Esperando que se inicie la solicitud de extracción',
    'status.missingConfigurations': 'Configuración faltante',
    'status.failedCreatingPR': 'No se pudo crear la PR',
    'status.pullRequestRejected': 'Solicitud de extracción rechazada',
    'errors.prErrorPermissions':
      'No se pudo crear una nueva PR debido a permisos insuficientes. Comuníquese con su administrador.',
    'errors.catalogInfoExists':
      'Dado que catalog-info.yaml ya existe en el repositorio, no se creará ninguna PR nueva. Sin embargo, la entidad seguirá registrada en la página del catálogo.',
    'table.headers.name': 'Nombre',
    'table.headers.url': 'URL',
    'table.headers.repoUrl': 'URL del repositorio',
    'table.headers.organization': 'Organización',
    'table.headers.organizationGroup': 'Organización/grupo',
    'table.headers.group': 'Grupo',
    'table.headers.status': 'Estado',
    'table.headers.taskStatus': 'Estado de la tarea',
    'table.headers.lastUpdated': 'Última actualización',
    'table.headers.actions': 'Acciones',
    'table.headers.catalogInfoYaml': 'catalog-info.yaml',
    'table.pagination.rows5': '5 filas',
    'table.pagination.rows10': '10 filas',
    'table.pagination.rows20': '20 filas',
    'table.pagination.rows50': '50 filas',
    'table.pagination.rows100': '100 filas',
    'steps.chooseApprovalTool':
      'Elegir una herramienta de control de versiones para la creación de solicitudes de extracción',
    'steps.chooseRepositories': 'Elegir qué elementos desea importar',
    'steps.chooseItems': 'Elegir qué elementos desea importar',
    'steps.generateCatalogInfo':
      'Generar un archivo catalog-info.yaml para cada elemento seleccionado',
    'steps.generateCatalogInfoItems':
      'Generar un archivo catalog-info.yaml para cada elemento seleccionado',
    'steps.editPullRequest':
      'Ver los detalles de la solicitud de extracción/fusión',
    'steps.trackStatus': 'Hacer el seguimiento del estado de aprobación',
    'addRepositories.approvalTool.title': 'Herramienta de control de versiones',
    'addRepositories.approvalTool.description':
      'Elegir la herramienta de control de versiones para la creación de PR',
    'addRepositories.approvalTool.tooltip':
      'La importación requiere aprobación. Una vez aprobada la solicitud de extracción, los repositorios se importarán a la página Catálogo.',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.repositoryType.title': 'Tipo de repositorio',
    'addRepositories.repositoryType.repository': 'Repositorio',
    'addRepositories.repositoryType.organization': 'Organización',
    'addRepositories.repositoryType.project': 'Proyecto',
    'addRepositories.repositoryType.group': 'Grupo',
    'addRepositories.searchPlaceholder': 'Buscar',
    'addRepositories.clearSearch': 'borrar búsqueda',
    'addRepositories.noRepositoriesFound': 'No se encontraron repositorios',
    'addRepositories.allRepositoriesAdded':
      'Se agregaron todos los repositorios',
    'addRepositories.noSelection': 'Ninguno',
    'addRepositories.selectRepositories': 'Seleccionar repositorios',
    'addRepositories.selectedRepositories': 'repositorios',
    'addRepositories.selectedProjects': 'proyectos',
    'addRepositories.selectedLabel': 'Seleccionado',
    'addRepositories.selectedCount': '{{count}} seleccionados',
    'addRepositories.addSelected': 'Agregar seleccionados',
    'addRepositories.generateCatalogInfo': 'Generar catalog-info.yaml',
    'addRepositories.editPullRequest': 'Modificar solicitud de extracción',
    'addRepositories.preview': 'Vista previa',
    'catalogInfo.status.generating': 'Generando',
    'common.add': 'Agregar',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.delete': 'Eliminar',
    'common.documentation': 'Documentación',
    'common.edit': 'Modificar',
    'common.filter': 'Filtrar',
    'common.import': 'Importar',
    'common.remove': 'Eliminar',
    'common.save': 'Guardar',
    'common.select': 'Seleccionar',
    'common.update': 'Actualizar',
    'common.view': 'Ver',
    'time.daysAgo': 'Hace {{count}} día(s)',
    'time.hoursAgo': 'Hace {{count}} hora(s)',
    'time.minutesAgo': 'Hace {{count}} minuto(s)',
    'time.secondsAgo': 'Hace {{count}} segundo(s)',
    'previewFile.previewFile': 'Previsualizar archivo',
    'previewFile.previewFiles': 'Previsualizar archivos',
    'previewFile.failedToCreatePR': 'No se pudo crear la PR',
    'previewFile.prCreationUnsuccessful':
      'La creación de PR no se realizó correctamente en algunos repositorios. Haga clic en `Modificar` para ver el motivo.',
    'previewFile.failedToFetchPR':
      'No se pudo obtener la solicitud de extracción. Se generó una nueva entidad YAML a continuación.',
    'previewFile.invalidEntityYaml':
      'La entidad YAML de su solicitud de extracción no es válida (archivo vacío o falta apiVersion, kind o metadata.name). Se generó una nueva entidad YAML a continuación.',
    'previewFile.pullRequestText': 'solicitud de extracción',
    'previewFile.viewRepository': 'Ver repositorio',
    'previewFile.closeDrawer': 'Cerrar el panel',
    'previewFile.keyValuePlaceholder': 'key1: value2; key2: value2',
    'previewFile.useSemicolonSeparator':
      'Use punto y coma para separar {{label}}',
    'previewFile.pullRequest.title': 'Solicitud de extracción',
    'previewFile.pullRequest.mergeRequest': 'Solicitud de fusión',
    'previewFile.pullRequest.serviceNowTicket': 'Ticket de ServiceNow',
    'previewFile.pullRequest.details': 'Detalles de {{tool}}',
    'previewFile.pullRequest.titleLabel': 'Título de {{tool}}',
    'previewFile.pullRequest.bodyLabel': 'Texto de {{tool}}',
    'previewFile.pullRequest.titlePlaceholder':
      'Agregar archivos descriptores de entidades del catálogo de Backstage',
    'previewFile.pullRequest.bodyPlaceholder':
      'Un texto descriptivo con soporte para Markdown',
    'previewFile.pullRequest.entityConfiguration': 'Configuración de entidad',
    'previewFile.pullRequest.componentNameLabel':
      'Nombre del componente creado',
    'previewFile.pullRequest.componentNamePlaceholder': 'Nombre del componente',
    'previewFile.pullRequest.entityOwnerLabel': 'Propietario de la entidad',
    'previewFile.pullRequest.entityOwnerPlaceholder': 'grupos y usuarios',
    'previewFile.pullRequest.entityOwnerHelper':
      'Seleccionar un propietario de la lista o ingresar una referencia a un grupo o un usuario',
    'previewFile.pullRequest.loadingText': 'Cargando grupos y usuarios',
    'previewFile.pullRequest.previewEntities': 'Previsualizar entidades',
    'previewFile.pullRequest.annotations': 'Anotaciones',
    'previewFile.pullRequest.labels': 'Etiquetas',
    'previewFile.pullRequest.spec': 'Especificación',
    'previewFile.pullRequest.useCodeOwnersFile':
      'Usar el archivo *CODEOWNERS* como propietario de la entidad',
    'previewFile.pullRequest.codeOwnersWarning':
      'ADVERTENCIA: Esto puede fallar si no se encuentra ningún archivo CODEOWNERS en la ubicación de destino.',
    'forms.footer.createServiceNowTicket': 'Crear un ticket de ServiceNow',
    'forms.footer.createServiceNowTickets': 'Crear tickets de ServiceNow',
    'forms.footer.createPullRequest': 'Crear solicitud de extracción',
    'forms.footer.createPullRequests': 'Crear solicitudes de extracción',
    'forms.footer.selectRepositoryTooltip':
      'Seleccione un repositorio para importar.',
    'forms.footer.serviceNowTooltip':
      'Los archivos catalog-info.yaml deben generarse antes de crear un ticket de ServiceNow',
    'forms.footer.importTooltip':
      'Es necesario generar los archivos catalog-info.yaml para la importación.',
    'forms.footer.pullRequestTooltip':
      'Los archivos catalog-info.yaml deben generarse antes de crear una solicitud de extracción',
    'tasks.tasksFor': 'Tareas para {{importJobStatusId}}',
    'tasks.taskLink': 'Enlace de la tarea',
    'tasks.viewTask': 'Ver tarea',
    'tasks.taskCancelled': 'Cancelada',
    'tasks.taskCompleted': 'Completada',
    'tasks.taskFailed': 'Fallida',
    'tasks.taskOpen': 'Abierta',
    'tasks.taskProcessing': 'En proceso',
    'tasks.taskSkipped': 'Omitida',
    'workflows.workflowsFor': 'Flujos de trabajo para {{importJobStatusId}}',
    'workflows.workflowLink': 'Enlace del flujo de trabajo',
    'workflows.viewWorkflow': 'Ver flujo de trabajo',
    'workflows.workflowPending': 'Pendiente',
    'workflows.workflowActive': 'Activo',
    'workflows.workflowCompleted': 'Completado',
    'workflows.workflowAborted': 'Cancelado',
    'workflows.workflowError': 'Error',
    'workflows.workflowFetchError': 'Error de extracción del flujo de trabajo',
    'workflows.workflowSuspended': 'Suspendido',
    'importActions.loading': 'Cargando...',
    'importActions.errorFetchingData': 'Error al extraer los datos',
    'importActions.noActions':
      'No se encontraron acciones de importación para este repositorio.',
  },
});

export default bulkImportTranslationEs;
