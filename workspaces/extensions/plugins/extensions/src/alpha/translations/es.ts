/*
 * Copyright The Backstage Authors
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
import { extensionsTranslationRef } from './ref';

/**
 * es translation for plugin.extensions.
 * @alpha
 */
const extensionsTranslationEs = createTranslationMessages({
  ref: extensionsTranslationRef,
  messages: {
    'header.title': 'Extensiones',
    'header.extensions': 'Extensiones',
    'header.catalog': 'Catálogo',
    'header.installedPackages': 'Paquetes instalados',
    'header.installedPackagesWithCount': 'Paquetes instalados ({{count}})',
    'header.packagesPage': 'Paquetes',
    'header.collectionsPage': 'Colecciones',
    'button.install': 'Instalar',
    'button.uninstall': 'Desinstalar',
    'button.enable': 'Habilitar',
    'button.disable': 'Deshabilitar',
    'button.update': 'Actualizar',
    'button.save': 'Guardar',
    'button.close': 'Cerrar',
    'button.viewAll': 'Ver todos los complementos',
    'button.viewDocumentation': 'Ver documentación',
    'button.viewInstalledPlugins': 'Ver complementos instalados ({{count}})',
    'status.notInstalled': 'No instalado',
    'status.installed': 'Instalado',
    'status.disabled': 'Deshabilitado',
    'status.partiallyInstalled': 'Parcialmente instalado',
    'status.updateAvailable': 'Actualización disponible',
    'role.backend': 'Back-end',
    'role.backendModule': 'Módulo de back-end',
    'role.frontend': 'Interfaz de usuario',
    'emptyState.noPluginsFound': 'No se encontraron complementos',
    'emptyState.mustEnableBackend':
      'Debe habilitar el complemento de back-end Extensiones',
    'emptyState.noPluginsDescription':
      'Se produjo un error al cargar los complementos. Verifique su configuración o revise la documentación del complemento para resolverlo. También puede explorar otros complementos disponibles.',
    'emptyState.configureBackend':
      "Configure el complemento '@red-hat-developer-hub/backstage-plugin-extensions-backend'.",
    'alert.productionDisabled':
      'La instalación del complemento está deshabilitada en el entorno de producción.',
    'alert.installationDisabled':
      'La instalación del complemento está deshabilitada.',
    'alert.missingDynamicArtifact':
      'No se puede gestionar este paquete. Para habilitar acciones, se debe agregar una entidad de Catálogo con el **spec.dynamicArtifact** requerido.',
    'alert.missingDynamicArtifactForPlugin':
      'No se puede gestionar este complemento. Para habilitar acciones, se debe agregar una entidad de Catálogo con el **spec.dynamicArtifact** requerido a todos los paquetes asociados.',
    'alert.extensionsExample':
      'Para habilitarlo, agregue o modifique la configuración de extensiones en su archivo de configuración de complementos dinámicos.',
    'alert.backendRestartRequired': 'Se requiere reiniciar el back-end',
    'alert.viewPlugins': 'Ver complementos',
    'alert.viewPackages': 'Ver paquetes',
    'search.placeholder': 'Buscar',
    'search.clear': 'Borrar búsqueda',
    'search.filter': 'Filtrar',
    'search.clearFilter': 'Borrar filtro',
    'search.category': 'Categoría',
    'search.author': 'Autor',
    'search.supportType': 'Tipo de soporte',
    'search.noResults':
      'No hay ningún complemento que coincida con los criterios de búsqueda',
    'search.filterBy': 'Filtrar por',
    'search.clearFilters': 'Borrar filtros',
    'search.noResultsFound':
      'No se encontraron resultados. Ajuste los filtros y vuelva a intentarlo.',
    'common.links': 'Enlaces',
    'common.by': ' por ',
    'common.comma': ', ',
    'common.readMore': 'Leer más',
    'common.close': 'Cerrar',
    'common.apply': 'Aplicar',
    'common.couldNotApplyYaml': 'No se pudo aplicar YAML: {{error}}',
    'package.name': 'Nombre del paquete:',
    'package.version': 'Versión:',
    'package.dynamicPluginPath': 'Ruta del complemento dinámico:',
    'package.backstageRole': 'Rol de Backstage:',
    'package.supportedVersions': 'Versiones compatibles:',
    'package.author': 'Autor:',
    'package.support': 'Soporte:',
    'package.lifecycle': 'Ciclo de vida:',
    'package.highlights': 'Aspectos destacados',
    'package.about': 'Acerca de',
    'package.notFound': 'No se encontró el paquete {{namespace}}/{{name}}',
    'package.ensureCatalogEntity':
      'Asegúrese de que exista una entidad de catálogo para este paquete.',
    'table.packageName': 'Nombre del paquete',
    'table.version': 'Versión',
    'table.role': 'Rol',
    'table.supportedVersion': 'Versión compatible',
    'table.status': 'Estado',
    'table.name': 'Nombre',
    'table.action': 'Acción',
    'table.description': 'Descripción',
    'table.versions': 'Versiones',
    'table.plugins': 'Complementos',
    'table.packages': 'Paquetes',
    'table.pluginsCount': 'Complementos ({{count}})',
    'installedPackages.table.title': 'Paquetes instalados ({{count}})',
    'installedPackages.table.columns.name': 'Nombre',
    'installedPackages.table.columns.packageName': 'nombre del paquete npm',
    'installedPackages.table.columns.role': 'Rol',
    'installedPackages.table.columns.version': 'Versión',
    'installedPackages.table.columns.actions': 'Acciones',
    'installedPackages.table.tooltips.packageProductionDisabled':
      'No se puede gestionar el paquete en el entorno de producción.',
    'installedPackages.table.tooltips.installationDisabled':
      'No se puede gestionar el paquete porque la instalación del complemento está deshabilitada. Para habilitarlo, agregue o modifique la configuración de extensiones en su archivo de configuración de complementos dinámicos.',
    'installedPackages.table.tooltips.noDownloadPermissions':
      'No tiene permiso para descargar la configuración. Comuníquese con su administrador para solicitar acceso o asistencia.',
    'installedPackages.table.tooltips.noEditPermissions':
      'No tiene permiso para modificar la configuración. Comuníquese con su administrador para solicitar acceso o asistencia.',
    'installedPackages.table.tooltips.noTogglePermissions':
      'No tiene permiso para habilitar o deshabilitar paquetes. Comuníquese con su administrador para solicitar acceso o asistencia.',
    'installedPackages.table.tooltips.editPackage':
      'Modificar la configuración del paquete',
    'installedPackages.table.tooltips.downloadPackage':
      'Descargar configuración del paquete',
    'installedPackages.table.tooltips.enablePackage': 'Habilitar paquete',
    'installedPackages.table.tooltips.disablePackage': 'Deshabilitar paquete',
    'installedPackages.table.emptyMessages.noResults':
      'No se encontraron resultados. Pruebe con un término de búsqueda diferente.',
    'installedPackages.table.emptyMessages.noRecords':
      'No hay registros para mostrar',
    'actions.install': 'Instalar',
    'actions.view': 'Ver',
    'actions.edit': 'Modificar',
    'actions.enable': 'Habilitar',
    'actions.disable': 'Deshabilitar',
    'actions.actions': 'Acciones',
    'actions.editConfiguration': 'Modificar',
    'actions.pluginConfigurations': 'Configuración de complementos',
    'actions.packageConfiguration': 'Configuración del paquete',
    'actions.pluginCurrentlyEnabled': 'Complemento actualmente habilitado',
    'actions.pluginCurrentlyDisabled':
      'Complemento está actualmente deshabilitado',
    'actions.packageCurrentlyEnabled': 'Paquete actualmente habilitado',
    'actions.packageCurrentlyDisabled': 'Paquete actualmente deshabilitado',
    'actions.installTitle': 'Instalar {{displayName}}',
    'metadata.by': ' por ',
    'metadata.comma': ', ',
    'metadata.ensureCatalogEntityPlugin':
      'Asegúrese de que exista una entidad de catálogo para este complemento.',
    'metadata.highlights': 'Aspectos destacados',
    'metadata.about': 'Acerca de',
    'metadata.publisher': 'Editor',
    'metadata.supportProvider': 'Proveedor de soporte',
    'metadata.entryName': 'Nombre de la entrada',
    'metadata.bySomeone': 'por alguien',
    'metadata.category': 'Categoría',
    'metadata.versions': 'Versiones',
    'metadata.backstageCompatibility': 'Versión de compatibilidad de Backstage',
    'supportTypes.certifiedBy': 'Certificado por {{value}} ({{count}})',
    'install.title': 'Instalar complemento',
    'install.configurationRequired': 'Se requiere configuración',
    'install.optional': 'Opcional',
    'install.required': 'Requerida',
    'install.selectPackages': 'Seleccionar paquetes para instalar',
    'install.allPackages': 'Todos los paquetes',
    'install.customConfiguration': 'Configuración personalizada',
    'install.installProgress': 'Instalando...',
    'install.success': 'El complemento se instaló correctamente',
    'install.error': 'No se pudo instalar el complemento',
    'install.installFrontend': 'Instalar el complemento de front-end',
    'install.installBackend': 'Instalar el complemento de back-end',
    'install.installTemplates': 'Instalar plantillas de software',
    'install.installationInstructions': 'Instrucciones de instalación',
    'install.download': 'Descargar',
    'install.examples': 'Ejemplos',
    'install.cancel': 'Cancelar',
    'install.reset': 'Reiniciar',
    'install.pluginTabs': 'Pestañas de complementos',
    'install.settingUpPlugin': 'Configurando el complemento',
    'install.aboutPlugin': 'Acerca del complemento',
    'install.pluginUpdated': 'Complemento actualizado',
    'install.pluginInstalled': 'Complemento instalado',
    'install.instructions': 'Instrucciones',
    'install.editInstructions': 'Modificar instrucciones',
    'install.back': 'Atrás',
    'install.packageUpdated': 'Paquete actualizado',
    'install.packageEnabled': 'Paquete habilitado',
    'install.packageDisabled': 'Paquete deshabilitado',
    'install.pluginEnabled': 'Complemento habilitado',
    'install.pluginDisabled': 'Complemento deshabilitado',
    'install.errors.missingPluginsList':
      "Contenido del editor no válido: falta la lista de 'complementos'",
    'install.errors.missingPackageItem':
      'Contenido del editor no válido: falta un elemento del paquete',
    'install.errors.missingPackageField':
      "Contenido de editor no válido: falta el campo 'paquete' en el elemento",
    'install.errors.failedToSave': 'No se pudo guardar',
    loading: 'Cargando...',
    error: 'Ocurrió un error',
    retry: 'Reintentar',
    'errors.missingConfigFile': 'Falta el archivo de configuración',
    'errors.missingConfigMessage':
      '{{message}}. Debe agregarlo al archivo app-config.yaml si desea habilitar esta herramienta. Modifique el archivo app-config.yaml como se muestra en el siguiente ejemplo:',
    'errors.invalidConfigFile': 'Archivo de configuración no válido',
    'errors.invalidConfigMessage':
      "No se pudo cargar 'extensions.installation.saveToSingleFile.file'. {{message}}. Proporcione una configuración de instalación válida si desea habilitar esta herramienta. Modifique el archivo dynamic-plugins.yaml como se muestra en el siguiente ejemplo:",
    'errors.fileNotExists':
      'El archivo de configuración es incorrecto, está mal escrito o no existe',
    'errors.fileNotExistsMessage':
      '{{message}}. Vuelva a verificar el nombre de archivo especificado en app-config.yaml si desea habilitar esta herramienta como se indica en el siguiente ejemplo:',
    'errors.unknownError': 'Error al leer el archivo de configuración. ',
    'tooltips.productionDisabled':
      'La instalación del complemento está deshabilitada en el entorno de producción.',
    'tooltips.extensionsDisabled':
      'La instalación del complemento está deshabilitada. Para habilitarlo, agregue o modifique la configuración de extensiones en su archivo de configuración de complementos dinámicos.',
  },
});

export default extensionsTranslationEs;
