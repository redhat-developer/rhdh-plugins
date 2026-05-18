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
    'addRepositories.addSelected': 'Agregar seleccionados',
    'addRepositories.allRepositoriesAdded':
      'Se agregaron todos los repositorios',
    'addRepositories.approvalTool.description':
      'Elegir la herramienta de control de versiones para la creación de PR',
    'addRepositories.approvalTool.github': 'GitHub',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.approvalTool.title': 'Herramienta de control de versiones',
    'addRepositories.approvalTool.tooltip':
      'La importación requiere aprobación. Una vez aprobada la solicitud de extracción, los repositorios se importarán a la página Catálogo.',
    'addRepositories.clearSearch': 'borrar búsqueda',
    'addRepositories.editPullRequest': 'Modificar solicitud de extracción',
    'addRepositories.generateCatalogInfo': 'Generar catalog-info.yaml',
    'addRepositories.noRepositoriesFound': 'No se encontraron repositorios',
    'addRepositories.noSelection': 'Ninguno',
    'addRepositories.preview': 'Vista previa',
    'addRepositories.repositoryType.group': 'Grupo',
    'addRepositories.repositoryType.organization': 'Organización',
    'addRepositories.repositoryType.project': 'Proyecto',
    'addRepositories.repositoryType.repository': 'Repositorio',
    'addRepositories.repositoryType.title': 'Tipo de repositorio',
    'addRepositories.searchPlaceholder': 'Buscar',
    'addRepositories.selectRepositories': 'Seleccionar repositorios',
    'addRepositories.selectedCount': '{{count}} seleccionados',
    'addRepositories.selectedLabel': 'Seleccionado',
    'addRepositories.selectedProjects': 'proyectos',
    'addRepositories.selectedRepositories': 'repositorios',
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
    'errors.addIntegrationsToConfig':
      'Para resolver este problema, asegúrese de que las integraciones se agreguen al archivo de configuración de Backstage (app-config.yaml).',
    'errors.catalogEntityConflict':
      'No se pudo crear una nueva PR debido a un conflicto de entidades de catálogo.',
    'errors.catalogInfoExists':
      'Dado que catalog-info.yaml ya existe en el repositorio, no se creará ninguna PR nueva. Sin embargo, la entidad seguirá registrada en la página del catálogo.',
    'errors.codeOwnersNotFound':
      'Falta el archivo CODEOWNERS en el repositorio. Agregue un archivo CODEOWNERS para crear una nueva PR.',
    'errors.errorOccurred': 'Ocurrió un error',
    'errors.failedToCreatePullRequest':
      'No se pudo crear la solicitud de extracción',
    'errors.noIntegrationsConfigured':
      'No hay integraciones de GitHub o GitLab configuradas. Agregue al menos una integración para utilizar la funcionalidad de importación masiva.',
    'errors.prErrorPermissions':
      'No se pudo crear una nueva PR debido a permisos insuficientes. Comuníquese con su administrador.',
    'errors.repoEmpty':
      'No se pudo crear una nueva PR porque el repositorio está vacío. Envíe una confirmación inicial al repositorio.',
    'forms.footer.createPullRequest': 'Crear solicitud de extracción',
    'forms.footer.createPullRequests': 'Crear solicitudes de extracción',
    'forms.footer.createServiceNowTicket': 'Crear un ticket de ServiceNow',
    'forms.footer.createServiceNowTickets': 'Crear tickets de ServiceNow',
    'forms.footer.importTooltip':
      'Es necesario generar los archivos catalog-info.yaml para la importación.',
    'forms.footer.pullRequestTooltip':
      'Los archivos catalog-info.yaml deben generarse antes de crear una solicitud de extracción',
    'forms.footer.selectRepositoryTooltip':
      'Seleccione un repositorio para importar.',
    'forms.footer.serviceNowTooltip':
      'Los archivos catalog-info.yaml deben generarse antes de crear un ticket de ServiceNow',
    'importActions.errorFetchingData': 'Error al extraer los datos',
    'importActions.loading': 'Cargando...',
    'importActions.noActions':
      'No se encontraron acciones de importación para este repositorio.',
    'page.addRepositoriesSubtitle':
      'Agregue repositorios a Red Hat Developer Hub en cuatro pasos',
    'page.addRepositoriesTitle': 'Agregar repositorios',
    'page.importEntitiesSubtitle': 'Importar a Red Hat Developer Hub',
    'page.importEntitiesTitle': 'Importar entidades',
    'page.subtitle': 'Importar entidades a Red Hat Developer Hub',
    'page.title': 'Importación masiva',
    'page.typeLink': 'Importación masiva',
    'permissions.addRepositoriesMessage':
      'Para agregar repositorios, comuníquese con su administrador para que le otorgue el permiso `bulk.import`.',
    'permissions.title': 'Permiso requerido',
    'permissions.viewRepositoriesMessage':
      'Para ver los repositorios agregados, comuníquese con su administrador para que le otorgue el permiso `bulk.import`.',
    'previewFile.closeDrawer': 'Cerrar el panel',
    'previewFile.failedToCreatePR': 'No se pudo crear la PR',
    'previewFile.failedToFetchPR':
      'No se pudo obtener la solicitud de extracción. Se generó una nueva entidad YAML a continuación.',
    'previewFile.invalidEntityYaml':
      'La entidad YAML de su solicitud de extracción no es válida (archivo vacío o falta apiVersion, kind o metadata.name). Se generó una nueva entidad YAML a continuación.',
    'previewFile.keyValuePlaceholder': 'key1: value2; key2: value2',
    'previewFile.prCreationUnsuccessful':
      'La creación de PR no se realizó correctamente en algunos repositorios. Haga clic en `Modificar` para ver el motivo.',
    'previewFile.preview': 'Vista previa',
    'previewFile.previewFile': 'Previsualizar archivo',
    'previewFile.previewFiles': 'Previsualizar archivos',
    'previewFile.pullRequest.annotations': 'Anotaciones',
    'previewFile.pullRequest.bodyLabel': 'Texto de {{tool}}',
    'previewFile.pullRequest.bodyPlaceholder':
      'Un texto descriptivo con soporte para Markdown',
    'previewFile.pullRequest.codeOwnersWarning':
      'ADVERTENCIA: Esto puede fallar si no se encuentra ningún archivo CODEOWNERS en la ubicación de destino.',
    'previewFile.pullRequest.componentNameLabel':
      'Nombre del componente creado',
    'previewFile.pullRequest.componentNamePlaceholder': 'Nombre del componente',
    'previewFile.pullRequest.details': 'Detalles de {{tool}}',
    'previewFile.pullRequest.entityConfiguration': 'Configuración de entidad',
    'previewFile.pullRequest.entityOwnerHelper':
      'Seleccionar un propietario de la lista o ingresar una referencia a un grupo o un usuario',
    'previewFile.pullRequest.entityOwnerLabel': 'Propietario de la entidad',
    'previewFile.pullRequest.entityOwnerPlaceholder': 'grupos y usuarios',
    'previewFile.pullRequest.labels': 'Etiquetas',
    'previewFile.pullRequest.loadingText': 'Cargando grupos y usuarios',
    'previewFile.pullRequest.mergeRequest': 'Solicitud de fusión',
    'previewFile.pullRequest.previewEntities': 'Previsualizar entidades',
    'previewFile.pullRequest.serviceNowTicket': 'Ticket de ServiceNow',
    'previewFile.pullRequest.spec': 'Especificación',
    'previewFile.pullRequest.title': 'Solicitud de extracción',
    'previewFile.pullRequest.titleLabel': 'Título de {{tool}}',
    'previewFile.pullRequest.titlePlaceholder':
      'Agregar archivos descriptores de entidades del catálogo de Backstage',
    'previewFile.pullRequest.useCodeOwnersFile':
      'Usar el archivo *CODEOWNERS* como propietario de la entidad',
    'previewFile.pullRequestPendingApproval':
      'La [{{pullRequestText}}]({{pullRequestUrl}}) está pendiente de aprobación',
    'previewFile.pullRequestText': 'solicitud de extracción',
    'previewFile.useSemicolonSeparator':
      'Use punto y coma para separar {{label}}',
    'previewFile.viewRepository': 'Ver repositorio',
    'repositories.addedRepositories': 'Repositorios agregados',
    'repositories.addedRepositoriesCount': 'Repositorios agregados ({{count}})',
    'repositories.cannotRemoveRepositoryUrl':
      'No se puede eliminar el repositorio porque falta la URL del repositorio.',
    'repositories.deleteRepository': 'Eliminar repositorio',
    'repositories.editCatalogInfoTooltip':
      'Modificar la solicitud de extracción catalog-info.yaml',
    'repositories.errorOccured': 'Ocurrió un error',
    'repositories.errorOccuredWhileFetching':
      'Ocurrió un error al obtener la solicitud de extracción',
    'repositories.failedToCreatePullRequest':
      'No se pudo crear la solicitud de extracción',
    'repositories.import': 'Importar',
    'repositories.importedEntities': 'Entidades importadas',
    'repositories.importedEntitiesCount': 'Entidades importadas ({{count}})',
    'repositories.noProjectsFound':
      'No hay proyectos disponibles para importar.',
    'repositories.noRecordsFound':
      'No hay repositorios disponibles para importar.',
    'repositories.pr': 'PR',
    'repositories.refresh': 'Actualizar',
    'repositories.removeRepositoryQuestion':
      '¿Eliminar {{repositoryText}} {{repoName}}?',
    'repositories.removeRepositoryWarning':
      'Al eliminar un repositorio se borra toda la información asociada de la página Catálogo.',
    'repositories.removeRepositoryWarningGitlab':
      'Al eliminarlo se borrará toda la información asociada de la página Catálogo.',
    'repositories.removeRepositoryWarningOrchestrator':
      'Elimine el repositorio y la información del flujo de trabajo del orquestador asociado.',
    'repositories.removeRepositoryWarningScaffolder':
      'Al eliminar un repositorio también se eliminará toda la información de la tarea de scaffolder asociada.',
    'repositories.removeTooltipDisabled':
      'Este repositorio se agregó al archivo app-config. Para eliminarlo, modifique el archivo directamente',
    'repositories.removeTooltipRepositoryOrchestrator':
      'Eliminar el repositorio y la información del flujo de trabajo del orquestador asociado',
    'repositories.removeTooltipRepositoryScaffolder':
      'Eliminar el repositorio y la información de la tarea de scaffolder asociada',
    'repositories.removing': 'Eliminando...',
    'repositories.repositoryText': 'repositorio',
    'repositories.unableToRemoveRepository':
      'No se puede eliminar el repositorio. {{error}}',
    'repositories.viewCatalogInfoTooltip': 'Ver el archivo catalog-info.yaml',
    'sidebar.bulkImport': 'Importación masiva',
    'status.added': 'Agregado',
    'status.alreadyImported': 'Ya importado',
    'status.failedCreatingPR': 'No se pudo crear la PR',
    'status.imported': 'Importado',
    'status.missingConfigurations': 'Configuración faltante',
    'status.pullRequestRejected': 'Solicitud de extracción rechazada',
    'status.readyToImport': 'Listo para importar',
    'status.waitingForApproval': 'Esperando aprobación',
    'status.waitingForPullRequestToStart':
      'Esperando que se inicie la solicitud de extracción',
    'steps.chooseApprovalTool':
      'Elegir una herramienta de control de versiones para la creación de solicitudes de extracción',
    'steps.chooseItems': 'Elegir qué elementos desea importar',
    'steps.chooseRepositories': 'Elegir qué elementos desea importar',
    'steps.editPullRequest':
      'Ver los detalles de la solicitud de extracción/fusión',
    'steps.generateCatalogInfo':
      'Generar un archivo catalog-info.yaml para cada elemento seleccionado',
    'steps.generateCatalogInfoItems':
      'Generar un archivo catalog-info.yaml para cada elemento seleccionado',
    'steps.trackStatus': 'Hacer el seguimiento del estado de aprobación',
    'table.headers.actions': 'Acciones',
    'table.headers.catalogInfoYaml': 'catalog-info.yaml',
    'table.headers.group': 'Grupo',
    'table.headers.lastUpdated': 'Última actualización',
    'table.headers.name': 'Nombre',
    'table.headers.organization': 'Organización',
    'table.headers.organizationGroup': 'Organización/grupo',
    'table.headers.repoUrl': 'URL del repositorio',
    'table.headers.status': 'Estado',
    'table.headers.taskStatus': 'Estado de la tarea',
    'table.headers.url': 'URL',
    'table.pagination.rows10': '10 filas',
    'table.pagination.rows100': '100 filas',
    'table.pagination.rows20': '20 filas',
    'table.pagination.rows5': '5 filas',
    'table.pagination.rows50': '50 filas',
    'tasks.taskCancelled': 'Cancelada',
    'tasks.taskCompleted': 'Completada',
    'tasks.taskFailed': 'Fallida',
    'tasks.taskId': 'ID de la tarea',
    'tasks.taskLink': 'Enlace de la tarea',
    'tasks.taskOpen': 'Abierta',
    'tasks.taskProcessing': 'En proceso',
    'tasks.taskSkipped': 'Omitida',
    'tasks.tasksFor': 'Tareas para {{importJobStatusId}}',
    'tasks.viewTask': 'Ver tarea',
    'time.daysAgo': 'Hace {{count}} día(s)',
    'time.hoursAgo': 'Hace {{count}} hora(s)',
    'time.minutesAgo': 'Hace {{count}} minuto(s)',
    'time.secondsAgo': 'Hace {{count}} segundo(s)',
    'validation.componentNameInvalid':
      '"{{value}}" no es válido; se esperaba una cadena que consistiera en secuencias de [a-zA-Z0-9] separadas por cualquiera de [-_.], con un máximo de 63 caracteres en total. Para aprender más sobre el formato de archivo del catálogo, visite: https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md',
    'validation.componentNameRequired': 'Se requiere el nombre del componente',
    'validation.descriptionRequired':
      'Se requiere la descripción de {{approvalTool}}',
    'validation.entityOwnerRequired':
      'Se requiere el propietario de la entidad',
    'validation.keyValuePairFormat':
      'Cada entrada debe tener una clave y un valor separados por dos puntos.',
    'validation.titleRequired': 'Se requiere el título de {{approvalTool}}',
    'workflows.viewWorkflow': 'Ver flujo de trabajo',
    'workflows.workflowAborted': 'Cancelado',
    'workflows.workflowActive': 'Activo',
    'workflows.workflowCompleted': 'Completado',
    'workflows.workflowError': 'Error',
    'workflows.workflowFetchError': 'Error de extracción del flujo de trabajo',
    'workflows.workflowId': 'ID del flujo de trabajo',
    'workflows.workflowLink': 'Enlace del flujo de trabajo',
    'workflows.workflowPending': 'Pendiente',
    'workflows.workflowSuspended': 'Suspendido',
    'workflows.workflowsFor': 'Flujos de trabajo para {{importJobStatusId}}',
  },
});

export default bulkImportTranslationEs;
