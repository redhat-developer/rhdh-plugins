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
import { marketplaceTranslationRef } from './ref';

const marketplaceTranslationEs = createTranslationMessages({
  ref: marketplaceTranslationRef,
  full: true,
  messages: {
    // Page headers and titles
    'header.title': 'Extensiones',
    'header.extensions': 'Extensiones',
    'header.catalog': 'Catálogo',
    'header.installedPackages': 'Paquetes instalados',
    'header.installedPackagesWithCount': 'Paquetes instalados ({{count}})',
    'header.pluginsPage': 'Plugins',
    'header.packagesPage': 'Paquetes',
    'header.collectionsPage': 'Colecciones',

    // Navigation and buttons
    'button.install': 'Instalar',
    'button.uninstall': 'Desinstalar',
    'button.enable': 'Habilitar',
    'button.disable': 'Deshabilitar',
    'button.update': 'Actualizar',
    'button.save': 'Guardar',
    'button.close': 'Cerrar',
    'button.viewAll': 'Ver todos los plugins',
    'button.viewDocumentation': 'Ver documentación',
    'button.viewInstalledPlugins': 'Ver plugins instalados ({{count}})',
    'button.restart': 'Reinicio requerido',

    // Status labels
    'status.notInstalled': 'No instalado',
    'status.installed': 'Instalado',
    'status.disabled': 'Deshabilitado',
    'status.partiallyInstalled': 'Parcialmente instalado',
    'status.updateAvailable': 'Actualización disponible',

    // Role labels
    'role.backend': 'Backend',
    'role.backendModule': 'Módulo backend',
    'role.frontend': 'Frontend',

    // Empty states and errors
    'emptyState.noPluginsFound': 'No se encontraron plugins',
    'emptyState.mustEnableBackend':
      'Debe habilitar el plugin backend de Extensions',
    'emptyState.noPluginsDescription':
      'Hubo un error al cargar los plugins. Verifique su configuración o revise la documentación del plugin para resolver. También puede explorar otros plugins disponibles.',
    'emptyState.configureBackend':
      "Configure el plugin '@red-hat-developer-hub/backstage-plugin-extensions-backend'.",

    // Alerts and warnings
    'alert.productionDisabled':
      'La instalación de plugins está deshabilitada en el entorno de producción.',
    'alert.installationDisabled':
      'La instalación de plugins está deshabilitada.',
    'alert.missingDynamicArtifact':
      'No se puede gestionar este paquete. Para habilitar acciones, se debe agregar una entidad de catálogo con el **spec.dynamicArtifact** requerido.',
    'alert.missingDynamicArtifactTitle': 'El paquete no se puede modificar',
    'alert.missingDynamicArtifactForPlugin':
      'No se puede gestionar este plugin. Para habilitar acciones, se debe agregar una entidad de catálogo con el **spec.dynamicArtifact** requerido a todos los paquetes asociados.',
    'alert.missingDynamicArtifactTitlePlugin':
      'El plugin no se puede modificar',
    'alert.extensionsExample':
      'Para habilitarlo, agregue o modifique la configuración de extensiones en su archivo de configuración de plugins dinámicos.',
    'alert.singlePluginRestart':
      'El plugin **{{pluginName}}** requiere un reinicio del sistema backend para terminar de instalar, actualizar, habilitar o deshabilitar.',
    'alert.multiplePluginRestart':
      'Tiene **{{count}}** plugins que requieren un reinicio de su sistema backend para terminar de instalar, actualizar, habilitar o deshabilitar.',
    'alert.singlePackageRestart':
      'El paquete **{{packageName}}** requiere un reinicio del sistema backend para terminar de instalar, actualizar, habilitar o deshabilitar.',
    'alert.multiplePackageRestart':
      'Tiene **{{count}}** paquetes que requieren un reinicio de su sistema backend para terminar de instalar, actualizar, habilitar o deshabilitar.',
    'alert.restartRequired': '{{count}} plugins instalados',
    'alert.backendRestartRequired': 'Reinicio del backend requerido',
    'alert.viewPlugins': 'Ver plugins',
    'alert.viewPackages': 'Ver paquetes',

    // Search and filtering
    'search.placeholder': 'Buscar plugins...',
    'search.clear': 'Limpiar búsqueda',
    'search.filter': 'Filtrar',
    'search.clearFilter': 'Limpiar filtro',
    'search.noResults': 'Ningún plugin coincide con sus criterios de búsqueda',
    'search.filterBy': 'Filtrar por',
    'search.clearFilters': 'Limpiar filtros',
    'search.noResultsFound':
      'No se encontraron resultados. Ajusta tus filtros e inténtalo de nuevo.',
    'search.category': 'Categoría',
    'search.author': 'Autor',
    'search.supportType': 'Tipo de soporte',

    // General UI text
    'common.links': 'Enlaces',
    'common.by': ' por ',
    'common.comma': ', ',
    'common.noDescriptionAvailable': 'sin descripción disponible',
    'common.readMore': 'Leer más',
    'common.close': 'Cerrar',
    'common.apply': 'Aplicar',
    'common.couldNotApplyYaml': 'No se pudo aplicar YAML: {{error}}',

    // Dialogs
    'dialog.backendRestartRequired': 'Requiere reinicio del backend',
    'dialog.packageRestartMessage':
      'Para finalizar las modificaciones del paquete, reinicia tu sistema backend.',
    'dialog.pluginRestartMessage':
      'Para finalizar las modificaciones del plugin, reinicia tu sistema backend.',

    // Plugin details
    'plugin.description': 'Descripción',
    'plugin.documentation': 'Documentación',
    'plugin.repository': 'Repositorio',
    'plugin.license': 'Licencia',
    'plugin.version': 'Versión',
    'plugin.author': 'Autor',
    'plugin.authors': 'Autores',
    'plugin.tags': 'Etiquetas',
    'plugin.dependencies': 'Dependencias',
    'plugin.configuration': 'Configuración',
    'plugin.installation': 'Instalación',

    // Package details
    'package.name': 'Nombre del paquete:',
    'package.version': 'Versión:',
    'package.dynamicPluginPath': 'Ruta del plugin dinámico:',
    'package.backstageRole': 'Rol de Backstage:',
    'package.supportedVersions': 'Versiones soportadas:',
    'package.author': 'Autor:',
    'package.support': 'Soporte:',
    'package.lifecycle': 'Ciclo de vida:',
    'package.highlights': 'Aspectos destacados',
    'package.about': 'Acerca de',
    'package.notFound': '¡Paquete {{namespace}}/{{name}} no encontrado!',
    'package.notAvailable': 'El paquete {{name}} no está disponible',
    'package.ensureCatalogEntity':
      'Asegúrese de que existe una entidad de catálogo para este paquete.',

    // Tables and lists
    'table.packageName': 'Nombre del paquete',
    'table.version': 'Versión',
    'table.role': 'Rol',
    'table.supportedVersion': 'Versión soportada',
    'table.status': 'Estado',
    'table.name': 'Nombre',
    'table.action': 'Acción',
    'table.description': 'Descripción',
    'table.versions': 'Versiones',
    'table.plugins': 'Plugins',
    'table.packages': 'Paquetes',
    'table.pluginsCount': 'Plugins ({{count}})',
    'table.packagesCount': 'Paquetes ({{count}})',
    'table.pluginsTable': 'Tabla de plugins',

    // Installed packages table
    'installedPackages.table.title': 'Paquetes instalados ({{count}})',
    'installedPackages.table.searchPlaceholder': 'Buscar',
    'installedPackages.table.columns.name': 'Nombre',
    'installedPackages.table.columns.packageName': 'Nombre del paquete npm',
    'installedPackages.table.columns.role': 'Rol',
    'installedPackages.table.columns.version': 'Versión',
    'installedPackages.table.columns.actions': 'Acciones',
    'installedPackages.table.tooltips.packageProductionDisabled':
      'El paquete no puede ser gestionado en el entorno de producción.',
    'installedPackages.table.tooltips.installationDisabled':
      'El paquete no puede ser gestionado porque la instalación de plugins está deshabilitada. Para habilitarlo, agregue o modifique la configuración de extensiones en su archivo de configuración de plugins dinámicos.',
    'installedPackages.table.tooltips.enableActions':
      'Para habilitar acciones, agregue una entidad de catálogo para este paquete',
    'installedPackages.table.tooltips.noDownloadPermissions':
      'No tienes permiso para descargar la configuración. Contacta a tu administrador para solicitar acceso o asistencia.',
    'installedPackages.table.tooltips.noEditPermissions':
      'No tienes permiso para editar la configuración. Contacta a tu administrador para solicitar acceso o asistencia.',
    'installedPackages.table.tooltips.noTogglePermissions':
      'No tienes permiso para habilitar o deshabilitar paquetes. Contacta a tu administrador para solicitar acceso o asistencia.',
    'installedPackages.table.tooltips.editPackage':
      'Editar configuración del paquete',
    'installedPackages.table.tooltips.downloadPackage':
      'Descargar configuración del paquete',
    'installedPackages.table.tooltips.enablePackage': 'Habilitar paquete',
    'installedPackages.table.tooltips.disablePackage': 'Deshabilitar paquete',
    'installedPackages.table.emptyMessages.noResults':
      'No se encontraron resultados. Intente con un término de búsqueda diferente.',
    'installedPackages.table.emptyMessages.noRecords':
      'No hay registros para mostrar',

    // Plugin actions and states
    'actions.install': 'Instalar',
    'actions.view': 'Ver',
    'actions.edit': 'Editar',
    'actions.enable': 'Habilitar',
    'actions.disable': 'Deshabilitar',
    'actions.actions': 'Acciones',
    'actions.editConfiguration': 'Editar',
    'actions.pluginConfigurations': 'Configuraciones del plugin',
    'actions.packageConfiguration': 'Configuración del paquete',
    'actions.pluginCurrentlyEnabled': 'Plugin actualmente habilitado',
    'actions.pluginCurrentlyDisabled': 'Plugin actualmente deshabilitado',
    'actions.packageCurrentlyEnabled': 'Paquete actualmente habilitado',
    'actions.packageCurrentlyDisabled': 'Paquete actualmente deshabilitado',
    'actions.installTitle': 'Instalar {{displayName}}',
    'actions.editTitle': 'Editar configuraciones de {{displayName}}',

    // Plugin metadata
    'metadata.by': ' por ',
    'metadata.comma': ', ',
    'metadata.pluginNotFound': '¡Plugin {{name}} no encontrado!',
    'metadata.pluginNotAvailable': 'El plugin {{name}} no está disponible',
    'metadata.ensureCatalogEntityPlugin':
      'Asegúrese de que existe una entidad de catálogo para este plugin.',
    'metadata.highlights': 'Aspectos destacados',
    'metadata.about': 'Acerca de',
    'metadata.publisher': 'Editor',
    'metadata.supportProvider': 'Proveedor de soporte',
    'metadata.entryName': 'Nombre de entrada',
    'metadata.bySomeone': 'por alguien',
    'metadata.category': 'Categoría',
    'metadata.versions': 'Versiones',
    'metadata.backstageCompatibility': 'Versión de compatibilidad de Backstage',

    // Support type filters
    'supportTypes.certifiedBy': 'Certificado por {{value}} ({{count}})',
    'supportTypes.verifiedBy': 'Verificado por {{value}} ({{count}})',
    'supportTypes.customPlugins': 'Plugins personalizados ({{count}})',

    // Collections
    'collection.kubernetes': 'Kubernetes',
    'collection.monitoring': 'Monitoreo',
    'collection.security': 'Seguridad',
    'collection.viewMore': 'Ver más',
    'collection.pluginCount': '{{count}} plugins',
    'collection.featured.title': 'Plugins destacados',
    'collection.featured.description':
      'Una colección curada de plugins recomendados para la mayoría de usuarios',

    // Installation and configuration
    'install.title': 'Instalar Plugin',
    'install.configurationRequired': 'Configuración requerida',
    'install.optional': 'Opcional',
    'install.required': 'Requerido',
    'install.selectPackages': 'Seleccionar paquetes para instalar',
    'install.allPackages': 'Todos los paquetes',
    'install.customConfiguration': 'Configuración personalizada',
    'install.installProgress': 'Instalando...',
    'install.success': 'Plugin instalado exitosamente',
    'install.error': 'Falló la instalación del plugin',
    'install.installFrontend': 'Instalar plugin frontend',
    'install.installBackend': 'Instalar plugin backend',
    'install.installTemplates': 'Instalar plantillas de software',
    'install.installationInstructions': 'Instrucciones de instalación',
    'install.download': 'Descargar',
    'install.examples': 'Ejemplos',
    'install.cancel': 'Cancelar',
    'install.reset': 'Restablecer',
    'install.pluginTabs': 'Pestañas de plugin',
    'install.settingUpPlugin': 'Configurando el plugin',
    'install.aboutPlugin': 'Acerca del plugin',
    'install.pluginUpdated': 'Plugin actualizado',
    'install.pluginInstalled': 'Plugin instalado',
    'install.instructions': 'Instrucciones',
    'install.editInstructions': 'Editar instrucciones',
    'install.back': 'Atrás',
    'install.packageUpdated': 'Paquete actualizado',
    'install.packageEnabled': 'Paquete habilitado',
    'install.packageDisabled': 'Paquete deshabilitado',
    'install.pluginEnabled': 'Plugin habilitado',
    'install.pluginDisabled': 'Plugin deshabilitado',
    'install.errors.missingPluginsList':
      "Contenido del editor inválido: falta la lista 'plugins'",
    'install.errors.missingPackageItem':
      'Contenido del editor inválido: falta el elemento del paquete',
    'install.errors.missingPackageField':
      "Contenido del editor inválido: falta el campo 'package' en el elemento",
    'install.errors.failedToSave': 'Error al guardar',

    // Loading and error states
    loading: 'Cargando...',
    error: 'Ocurrió un error',
    retry: 'Reintentar',

    // Error messages
    'errors.missingConfigFile': 'Archivo de configuración faltante',
    'errors.missingConfigMessage':
      '{{message}}. Necesitas agregarlo a tu app-config.yaml si quieres habilitar esta herramienta. Edita el archivo app-config.yaml como se muestra en el ejemplo a continuación:',
    'errors.invalidConfigFile': 'Archivo de configuración inválido',
    'errors.invalidConfigMessage':
      "Error al cargar 'extensions.installation.saveToSingleFile.file'. {{message}}. Proporciona una configuración de instalación válida si quieres habilitar esta herramienta. Edita tu archivo dynamic-plugins.yaml como se muestra en el ejemplo a continuación:",
    'errors.fileNotExists':
      'El archivo de configuración es incorrecto, está mal escrito o no existe',
    'errors.fileNotExistsMessage':
      '{{message}}. Por favor verifica el nombre de archivo especificado en tu app-config.yaml si quieres habilitar esta herramienta como se resalta en el ejemplo a continuación:',
    'errors.unknownError': 'Error leyendo el archivo de configuración. ',

    // Tooltip messages
    'tooltips.productionDisabled':
      'La instalación de plugins está deshabilitada en el entorno de producción.',
    'tooltips.extensionsDisabled':
      'La instalación de plugins está deshabilitada. Para habilitarla, agregue o modifique la configuración de extensiones en su archivo de configuración de plugins dinámicos.',
    'tooltips.noPermissions':
      'No tienes permisos para instalar plugins o ver sus configuraciones. Contacta a tu administrador para solicitar acceso o asistencia.',
    'tooltips.missingDynamicArtifact':
      'No se puede gestionar este {{type}}. Para habilitar acciones, se debe agregar una entidad de catálogo con el spec.dynamicArtifact requerido.',

    // Accessibility
    'aria.openPlugin': 'Abrir plugin {{name}}',
    'aria.closeDialog': 'Cerrar diálogo',
    'aria.expandSection': 'Expandir sección',
    'aria.collapseSection': 'Contraer sección',
    'aria.sortBy': 'Ordenar por {{field}}',
    'aria.filterBy': 'Filtrar por {{field}}',
    'badges.certified': 'Certificado',
    'badges.certifiedBy': 'Certificado por {{provider}}',
    'badges.verified': 'Verificado',
    'badges.verifiedBy': 'Verificado por {{provider}}',
    'badges.customPlugin': 'Plugin personalizado',
    'badges.stableAndSecured': 'Estable y asegurado por {{provider}}',
    'badges.generallyAvailable': 'Generalmente disponible (GA)',
    'badges.gaAndSupportedBy':
      'Generalmente disponible (GA) y soportado por {{provider}}',
    'badges.gaAndSupported': 'Generalmente disponible (GA) y soportado',
    'badges.productionReadyBy':
      'Listo para producción y soportado por {{provider}}',
    'badges.productionReady': 'Listo para producción y soportado',
    'badges.communityPlugin': 'Plugin comunitario',
    'badges.openSourceNoSupport':
      'Plugins de código abierto, sin soporte oficial',
    'badges.techPreview': 'Vista previa técnica (TP)',
    'badges.pluginInDevelopment': 'Plugin aún en desarrollo',
    'badges.devPreview': 'Vista previa de desarrollador (DP)',
    'badges.earlyStageExperimental': 'Un plugin experimental en etapa temprana',
    'badges.addedByAdmin': 'Plugins agregados por el administrador',
  },
});

export default marketplaceTranslationEs;
