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
  full: true,
  messages: {
    // Page titles and subtitles
    'page.title': 'Bulk import',
    'page.subtitle': 'Importar entidades a Red Hat Developer Hub',
    'page.addRepositoriesTitle': 'Agregar repositorios',
    'page.importEntitiesTitle': 'Importar entidades',
    'page.addRepositoriesSubtitle':
      'Agregar repositorios a Red Hat Developer Hub en 4 pasos',
    'page.importEntitiesSubtitle': 'Importar a Red Hat Developer Hub',
    'page.typeLink': 'Bulk import',

    // Sidebar
    'sidebar.bulkImport': 'Bulk import',

    // Permissions
    'permissions.title': 'Autorización requerida',
    'permissions.addRepositoriesMessage':
      'Para agregar repositorios, contacta a tu administrador para que te otorgue el permiso `bulk.import`.',
    'permissions.viewRepositoriesMessage':
      'Para ver los repositorios agregados, contacta a tu administrador para que te otorgue el permiso `bulk.import`.',

    // Repositories
    'repositories.addedRepositories': 'Repositorios agregados',
    'repositories.importedEntities': 'Entidades importadas',
    'repositories.addedRepositoriesCount': 'Repositorios agregados ({{count}})',
    'repositories.importedEntitiesCount': 'Entidades importadas ({{count}})',
    'repositories.noRecordsFound': 'No se encontraron registros',
    'repositories.refresh': 'Actualizar',
    'repositories.import': 'Importar',
    'repositories.removing': 'Eliminando...',
    'repositories.deleteRepository': 'Eliminar Repositorio',
    'repositories.removeRepositoryQuestion':
      '¿Eliminar {{repoName}} {{repositoryText}}?',
    'repositories.repositoryText': 'repositorio',
    'repositories.removeRepositoryWarning':
      'Eliminar un repositorio borra toda la información asociada de la página del Catálogo.',
    'repositories.removeRepositoryWarningGitlab':
      'Eliminar esto borra toda la información asociada de la página del Catálogo.',
    'repositories.cannotRemoveRepositoryUrl':
      'No se puede eliminar el repositorio ya que falta la URL del repositorio.',
    'repositories.unableToRemoveRepository':
      'No se puede eliminar el repositorio. {{error}}',
    'repositories.removeTooltipDisabled':
      'Este repositorio se agregó al archivo app-config. Para eliminarlo, modifique el archivo directamente.',
    'repositories.errorOccuredWhileFetching':
      'Error al obtener la pull request',
    'repositories.failedToCreatePullRequest': 'Error al crear la pull request',
    'repositories.errorOccured': 'Error ocurrido',
    'repositories.editCatalogInfoTooltip':
      'Editar pull request catalog-info.yaml',
    'repositories.viewCatalogInfoTooltip': 'Ver archivo catalog-info.yaml',
    'repositories.pr': 'PR',

    // Status
    'status.alreadyImported': 'Ya importado',
    'status.added': 'Añadido',
    'status.waitingForApproval': 'Esperando aprobación',
    'status.imported': 'Importado',

    // Validation
    'validation.componentNameInvalid':
      '"{{value}}" no es válido; se espera una cadena que son secuencias de [a-zA-Z0-9] separadas por [-_.], máximo 63 caracteres en total. Para obtener más información sobre el formato de archivo de catálogo, visite: https://github.com/backstage/backstage/blob/master/docs/architecture-decisions/adr002-default-catalog-file-format.md',
    'validation.componentNameRequired': 'El nombre del componente es requerido',
    'validation.entityOwnerRequired':
      'El propietario de la entidad es requerido',
    'validation.titleRequired': 'El título {{approvalTool}} es requerido',
    'validation.descriptionRequired':
      'La descripción {{approvalTool}} es requerida',
    'validation.keyValuePairFormat':
      'Cada entrada debe tener una clave y un valor separados por dos puntos.',

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
    'addRepositories.addSelected': 'Agregar seleccionados',
    'addRepositories.generateCatalogInfo': 'Generar catalog-info.yaml',
    'addRepositories.editPullRequest': 'Editar pull request',
    'addRepositories.preview': 'Vista previa',

    // Catalog info status
    'catalogInfo.status.generating': 'Generando',
    'catalogInfo.status.notGenerated': 'No generado',

    // Preview file

    // Common
    'common.add': 'Agregar',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.filter': 'Filtrar',
    'common.import': 'Importar',
    'common.remove': 'Quitar',
    'common.save': 'Guardar',
    'common.select': 'Seleccionar',
    'common.update': 'Actualizar',
    'common.view': 'Ver',

    // Time
    'time.daysAgo': 'hace {{count}} día(s)',
    'time.hoursAgo': 'hace {{count}} hora(s)',
    'time.minutesAgo': 'hace {{count}} minuto(s)',
    'time.secondsAgo': 'hace {{count}} segundo(s)',

    // Errors
    'errors.errorOccurred': 'Ocurrió un error',
    'errors.failedToCreatePullRequest': 'Error al crear el pull request',
    'errors.prErrorPermissions':
      'No tienes permisos para crear un pull request',
    'errors.catalogInfoExists': 'catalog-info.yaml ya existe',
    'errors.catalogEntityConflict': 'Conflicto de entidad del catálogo',
    'errors.repoEmpty': 'El repositorio está vacío',
    'errors.codeOwnersNotFound':
      'El archivo CODEOWNERS falta en el repositorio. Agregue un archivo CODEOWNERS para crear un nuevo PR.',

    // Preview File
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
    'previewFile.pullRequestPendingApproval':
      'La [{{pullRequestText}}]({{pullRequestUrl}}) está pendiente de aprobación',
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
      'Usar archivo *CODEOWNERS* como propietario de entidad',
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

    // Table pagination (keeping for compatibility)
    'table.pagination.rows5': '5 filas',
    'table.pagination.rows10': '10 filas',
    'table.pagination.rows20': '20 filas',
    'table.pagination.rows50': '50 filas',
    'table.pagination.rows100': '100 filas',
  },
});

export default bulkImportTranslationEs;
