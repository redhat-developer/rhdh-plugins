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

const bulkImportTranslationEs = createTranslationMessages({
  ref: bulkImportTranslationRef,
  messages: {
    // Page titles and subtitles
    'page.title': 'Importación masiva',
    'page.subtitle': 'Importar entidades a Red Hat Developer Hub',
    'page.addRepositoriesTitle': 'Agregar repositorios',
    'page.importEntitiesTitle': 'Importar entidades',
    'page.addRepositoriesSubtitle':
      'Agregar repositorios a Red Hat Developer Hub en 4 pasos',
    'page.importEntitiesSubtitle': 'Importar a Red Hat Developer Hub',
    'page.typeLink': 'Importación masiva',

    // Sidebar
    'sidebar.bulkImport': 'Importación masiva',

    // Permissions
    'permissions.title': 'Autorización requerida',
    'permissions.addRepositoriesMessage':
      'Para agregar repositorios, contacta a tu administrador para que te otorgue el permiso `bulk.import`.',
    'permissions.viewRepositoriesMessage':
      'Para ver los repositorios agregados, contacta a tu administrador para que te otorgue el permiso `bulk.import`.',

    // Pagination
    'pagination.rows5': '5 filas',
    'pagination.rows10': '10 filas',
    'pagination.rows20': '20 filas',
    'pagination.rows50': '50 filas',
    'pagination.rows100': '100 filas',
    'pagination.noRecordsFound': 'No se encontraron registros',

    // Repositories
    'repositories.addedRepositories': 'Repositorios agregados',
    'repositories.importedEntities': 'Entidades importadas',
    'repositories.addedRepositoriesCount': 'Repositorios agregados ({{count}})',
    'repositories.importedEntitiesCount': 'Entidades importadas ({{count}})',
    'repositories.noRecordsFound': 'No se encontraron registros',
    'repositories.refresh': 'Actualizar',
    'repositories.import': 'Importar',
    'repositories.add': 'Añadir',
    'repositories.remove': 'Eliminar',
    'repositories.cancel': 'Cancelar',
    'repositories.removing': 'Eliminando...',
    'repositories.close': 'Cerrar',
    'repositories.delete': 'Eliminar',
    'repositories.deleteRepository': 'Eliminar Repositorio',
    'repositories.removeRepositoryQuestion':
      '¿Eliminar {{repoName}} {{repositoryText}}?',
    'repositories.repositoryText': 'repositorio',
    'repositories.removeRepositoryWarning':
      'Eliminar {{action}} borra toda la información asociada de la página del Catálogo.',
    'repositories.removeAction': 'un repositorio',
    'repositories.removeActionGitlab': 'esto',
    'repositories.cannotRemoveRepositoryUrl':
      'No se puede eliminar el repositorio ya que falta la URL del repositorio.',
    'repositories.unableToRemoveRepository':
      'No se puede eliminar el repositorio. {{error}}',
    'repositories.removeTooltip': 'Eliminar',
    'repositories.removeTooltipDisabled':
      'Este repositorio se agregó al archivo app-config. Para eliminarlo, modifique el archivo directamente.',
    'repositories.errorOccuredWhileFetching':
      'Error al obtener la pull request',
    'repositories.failedToCreatePullRequest': 'Error al crear la pull request',
    'repositories.errorOccured': 'Error ocurrido',
    'repositories.update': 'Actualizar',
    'repositories.view': 'Ver',
    'repositories.editCatalogInfoTooltip':
      'Editar pull request catalog-info.yaml',
    'repositories.viewCatalogInfoTooltip': 'Ver archivo catalog-info.yaml',
    'repositories.waitingForApproval': 'Esperando aprobación',
    'repositories.pr': 'PR',

    // Status
    'status.alreadyImported': 'Ya importado',
    'status.added': 'Añadido',
    'status.waitingForApproval': 'Esperando aprobación',
    'status.imported': 'Importado',

    // Errors
    'errors.prErrorPermissions':
      'No se pudo crear una nueva PR debido a permisos insuficientes. Contacte a su administrador.',
    'errors.catalogInfoExists':
      'Dado que catalog-info.yaml ya existe en el repositorio, no se creará ninguna nueva PR. Sin embargo, la entidad aún se registrará en la página del catálogo.',
    'errors.catalogEntityConflict':
      'No se pudo crear una nueva PR debido a un conflicto de entidad del catálogo.',
    'errors.repoEmpty':
      'No se pudo crear una nueva PR porque el repositorio está vacío. Empuje un commit inicial al repositorio.',
    'errors.codeOwnersNotFound':
      'No se encontró archivo CODEOWNERS en el repositorio',

    // Validation
    'validation.componentNameInvalid':
      '"{{value}}" no es válido; se espera una cadena que son secuencias de [a-zA-Z0-9] separadas por [-_.], máximo 63 caracteres en total. Para obtener más información sobre el formato de archivo de catálogo, visite: https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md',
    'validation.componentNameRequired': 'El nombre del componente es requerido',
    'validation.entityOwnerRequired':
      'El propietario de la entidad es requerido',
    'validation.titleRequired': 'El título {{approvalTool}} es requerido',
    'validation.descriptionRequired':
      'La descripción {{approvalTool}} es requerida',

    // Table headers
    'table.headers.name': 'Nombre',
    'table.headers.url': 'URL',
    'table.headers.repoUrl': 'URL del repositorio',
    'table.headers.organization': 'Organización',
    'table.headers.organizationGroup': 'Organización/grupo',
    'table.headers.group': 'Grupo',
    'table.headers.status': 'Estado',
    'table.headers.lastUpdated': 'Última actualización',
    'table.headers.actions': 'Acciones',
    'table.headers.catalogInfoYaml': 'catalog-info.yaml',

    // Table pagination
    'table.pagination.rows5': '5 filas',
    'table.pagination.rows10': '10 filas',
    'table.pagination.rows20': '20 filas',
    'table.pagination.rows50': '50 filas',
    'table.pagination.rows100': '100 filas',

    // Steps
    'steps.chooseApprovalTool':
      'Elegir herramienta de aprobación (GitHub/GitLab) para la creación de PR',
    'steps.chooseRepositories': 'Elegir repositorios que quieres agregar',
    'steps.chooseItems': 'Elegir elementos que quieres importar',
    'steps.generateCatalogInfo':
      'Generar un archivo catalog-info.yaml para cada repositorio',
    'steps.generateCatalogInfoItems':
      'Generar un archivo catalog-info.yaml para cada elemento seleccionado',
    'steps.editPullRequest':
      'Editar los detalles del pull request si es necesario',
    'steps.trackStatus': 'Rastrear el estado de aprobación',

    // Add repositories
    'addRepositories.approvalTool.title': 'Herramienta de aprobación',
    'addRepositories.approvalTool.description':
      'Elegir herramienta de aprobación para la creación de PR',
    'addRepositories.approvalTool.tooltip':
      'La importación requiere aprobación. Después de que se apruebe la pull/merge request, los repositorios/proyectos se importarán a la página Catálogo.',
    'addRepositories.approvalTool.github': 'GitHub',
    'addRepositories.approvalTool.gitlab': 'GitLab',
    'addRepositories.repositoryType.title': 'Tipo de repositorio',
    'addRepositories.repositoryType.repository': 'Repositorio',
    'addRepositories.repositoryType.organization': 'Organización',
    'addRepositories.repositoryType.project': 'Proyecto',
    'addRepositories.repositoryType.group': 'Grupo',
    'addRepositories.searchPlaceholder': 'Buscar',
    'addRepositories.clearSearch': 'limpiar búsqueda',
    'addRepositories.noRepositoriesFound': 'No se encontraron repositorios',
    'addRepositories.allRepositoriesAdded':
      'Todos los repositorios están agregados',
    'addRepositories.noSelection': 'Ninguno',
    'addRepositories.selectRepositories': 'Seleccionar repositorios',
    'addRepositories.selectedRepositories': 'repositorios',
    'addRepositories.selectedProjects': 'proyectos',
    'addRepositories.selectedLabel': 'Seleccionados',
    'addRepositories.selectedCount': '{{count}} seleccionado(s)',
    'addRepositories.cancel': 'Cancelar',
    'addRepositories.add': 'Agregar',
    'addRepositories.addSelected': 'Agregar seleccionados',
    'addRepositories.generateCatalogInfo': 'Generar catalog-info.yaml',
    'addRepositories.editPullRequest': 'Editar pull request',
    'addRepositories.preview': 'Vista previa',
    'addRepositories.close': 'Cerrar',
    'addRepositories.save': 'Guardar',
    'addRepositories.delete': 'Eliminar',
    'addRepositories.sync': 'Sincronizar',
    'addRepositories.edit': 'Editar',
    'addRepositories.refresh': 'Actualizar',
    'addRepositories.back': 'Atrás',
    'addRepositories.next': 'Siguiente',
    'addRepositories.submit': 'Enviar',
    'addRepositories.loading': 'Cargando...',
    'addRepositories.error': 'Error',
    'addRepositories.success': 'Éxito',
    'addRepositories.warning': 'Advertencia',
    'addRepositories.info': 'Información',

    // Catalog info status
    'catalogInfo.status.generating': 'Generando',
    'catalogInfo.status.notGenerated': 'No generado',
    'catalogInfo.status.added': 'Agregado',
    'catalogInfo.status.pending': 'Pendiente',
    'catalogInfo.status.failed': 'Fallido',
    'catalogInfo.status.prOpened': 'PR abierto',
    'catalogInfo.status.waitingForApproval': 'Esperando aprobación',
    'catalogInfo.status.approved': 'Aprobado',

    // Catalog info actions
    'catalogInfo.actions.edit': 'Editar catalog-info.yaml',
    'catalogInfo.actions.delete': 'Eliminar repositorio',
    'catalogInfo.actions.sync': 'Sincronizar repositorio',
    'catalogInfo.actions.view': 'Ver catalog-info.yaml',
    'catalogInfo.actions.createPr': 'Crear pull request',

    // Preview file

    // Pull request
    'pullRequest.createTitle': 'Crear Pull Request',
    'pullRequest.editTitle': 'Editar Pull Request',
    'pullRequest.descriptionLabel': 'Descripción',
    'pullRequest.branch': 'Rama',
    'pullRequest.targetBranch': 'Rama destino',
    'pullRequest.sourceBranch': 'Rama origen',
    'pullRequest.defaultBranch': 'Rama predeterminada',
    'pullRequest.prTitle': 'Título del pull request',
    'pullRequest.prDescription': 'Descripción del pull request',
    'pullRequest.createPr': 'Crear PR',
    'pullRequest.updatePr': 'Actualizar PR',
    'pullRequest.viewPr': 'Ver PR',
    'pullRequest.waitingForPr': 'Esperando PR',

    // Delete
    'delete.title': '¿Eliminar repositorio?',
    'delete.message':
      '¿Estás seguro de que quieres eliminar este repositorio del catálogo?',
    'delete.repositoryName': 'Repositorio: {{name}}',
    'delete.confirm': 'Eliminar',
    'delete.cancel': 'Cancelar',
    'delete.success': 'Repositorio eliminado exitosamente',
    'delete.error': 'Error al eliminar el repositorio',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.warning': 'Advertencia',
    'common.info': 'Información',
    'common.retry': 'Reintentar',
    'common.refresh': 'Actualizar',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.clear': 'Limpiar',
    'common.apply': 'Aplicar',
    'common.reset': 'Restablecer',
    'common.export': 'Exportar',
    'common.import': 'Importar',
    'common.download': 'Descargar',
    'common.upload': 'Subir',
    'common.create': 'Crear',
    'common.update': 'Actualizar',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.open': 'Abrir',
    'common.view': 'Ver',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.remove': 'Quitar',
    'common.add': 'Agregar',
    'common.select': 'Seleccionar',
    'common.selectAll': 'Seleccionar todo',
    'common.deselectAll': 'Deseleccionar todo',
    'common.none': 'Ninguno',
    'common.all': 'Todos',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.ok': 'OK',
    'common.done': 'Hecho',
    'common.finish': 'Finalizar',
    'common.continue': 'Continuar',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.submit': 'Enviar',
    'common.send': 'Enviar',
    'common.copy': 'Copiar',
    'common.paste': 'Pegar',
    'common.cut': 'Cortar',
    'common.undo': 'Deshacer',
    'common.redo': 'Rehacer',

    // Time
    'time.daysAgo': 'hace {{count}} día(s)',
    'time.hoursAgo': 'hace {{count}} hora(s)',
    'time.minutesAgo': 'hace {{count}} minuto(s)',
    'time.secondsAgo': 'hace {{count}} segundo(s)',

    // Notifications
    'notifications.repositoryAdded': 'Repositorio agregado exitosamente',
    'notifications.repositoryUpdated': 'Repositorio actualizado exitosamente',
    'notifications.repositoryDeleted': 'Repositorio eliminado exitosamente',
    'notifications.catalogInfoUpdated':
      'Información del catálogo actualizada exitosamente',
    'notifications.pullRequestCreated': 'Pull request creado exitosamente',
    'notifications.pullRequestUpdated': 'Pull request actualizado exitosamente',
    'notifications.syncCompleted': 'Sincronización completada exitosamente',
    'notifications.operationFailed': 'Operación fallida',
    'notifications.unexpectedError': 'Ocurrió un error inesperado',
    'notifications.networkError':
      'Error de red. Por favor verifica tu conexión.',
    'notifications.permissionDenied': 'Permiso denegado',
    'notifications.notFound': 'Recurso no encontrado',
    'notifications.timeout':
      'Tiempo de espera agotado. Por favor intenta de nuevo.',

    // Errors
    'errors.errorOccurred': 'Ocurrió un error',
    'errors.failedToCreatePullRequest': 'Error al crear el pull request',

    // Buttons
    'buttons.select': 'Seleccionar',
    'buttons.cancel': 'Cancelar',
    'buttons.create': 'Crear',
    'buttons.edit': 'Editar',
    'buttons.view': 'Ver',
    'buttons.none': 'Ninguno',
    'buttons.import': 'Importar',
    'buttons.save': 'Guardar',
    'buttons.close': 'Cerrar',

    // Preview File
    'previewFile.edit': 'Editar',
    'previewFile.readyToImport': 'Listo para importar',
    'previewFile.previewFile': 'Vista previa del archivo',
    'previewFile.previewFiles': 'Vista previa de archivos',
    'previewFile.failedToCreatePR': 'Error al crear PR',
    'previewFile.prCreationUnsuccessful':
      'La creación de PR no fue exitosa para algunos repositorios. Haga clic en `Editar` para ver la razón.',
    'previewFile.failedToFetchPR':
      'No se pudo obtener la pull request. Se ha generado un nuevo YAML a continuación.',
    'previewFile.invalidEntityYaml':
      'El YAML de entidad en su pull request no es válido (archivo vacío o falta apiVersion, kind o metadata.name). Se ha generado un nuevo YAML a continuación.',
    'previewFile.pullRequestPendingApprovalPrefix': 'La',
    'previewFile.pullRequestPendingApprovalSuffix':
      'está pendiente de aprobación',
    'previewFile.pullRequestText': 'pull request',
    'previewFile.viewRepository': 'Ver repositorio',
    'previewFile.closeDrawer': 'Cerrar cajón',
    'previewFile.keyValuePlaceholder': 'clave1: valor1; clave2: valor2',
    'previewFile.useSemicolonSeparator':
      'Usa punto y coma para separar {{label}}',
    'previewFile.preview': 'Vista previa',
    'previewFile.pullRequest.title': 'Pull request',
    'previewFile.pullRequest.mergeRequest': 'Merge request',
    'previewFile.pullRequest.serviceNowTicket': 'Ticket ServiceNow',
    'previewFile.pullRequest.details': 'Detalles {{tool}}',
    'previewFile.pullRequest.titleLabel': 'Título {{tool}}',
    'previewFile.pullRequest.bodyLabel': 'Cuerpo {{tool}}',
    'previewFile.pullRequest.titlePlaceholder':
      'Agregar archivos descriptores de entidad del catálogo Backstage',
    'previewFile.pullRequest.bodyPlaceholder':
      'Un texto descriptivo con soporte Markdown',
    'previewFile.pullRequest.entityConfiguration': 'Configuración de entidad',
    'previewFile.pullRequest.componentNameLabel':
      'Nombre del componente creado',
    'previewFile.pullRequest.componentNamePlaceholder': 'Nombre del componente',
    'previewFile.pullRequest.entityOwnerLabel': 'Propietario de la entidad',
    'previewFile.pullRequest.entityOwnerPlaceholder': 'grupos y usuarios',
    'previewFile.pullRequest.entityOwnerHelper':
      'Selecciona un propietario de la lista o ingresa una referencia a un grupo o usuario',
    'previewFile.pullRequest.loadingText': 'Cargando grupos y usuarios',
    'previewFile.pullRequest.previewEntities': 'Vista previa de entidades',
    'previewFile.pullRequest.annotations': 'Anotaciones',
    'previewFile.pullRequest.labels': 'Etiquetas',
    'previewFile.pullRequest.spec': 'Especificación',
    'previewFile.pullRequest.useCodeOwnersFile':
      'Usar archivo CODEOWNERS como propietario de entidad',
    'previewFile.pullRequest.codeOwnersWarning':
      'ADVERTENCIA: Esto puede fallar si no se encuentra ningún archivo CODEOWNERS en la ubicación de destino.',

    // Forms
    'forms.footer.createServiceNowTicket': 'Crear ticket ServiceNow',
    'forms.footer.createServiceNowTickets': 'Crear tickets ServiceNow',
    'forms.footer.createPullRequest': 'Crear pull request',
    'forms.footer.createPullRequests': 'Crear pull requests',
    'forms.footer.serviceNowTooltip':
      'Los archivos Catalog-info.yaml deben generarse antes de crear un ticket ServiceNow',
    'forms.footer.importTooltip':
      'Los archivos Catalog-info.yaml deben generarse para la importación.',
    'forms.footer.pullRequestTooltip':
      'Los archivos Catalog-info.yaml deben generarse antes de crear un pull request',
  },
});

export default bulkImportTranslationEs;
