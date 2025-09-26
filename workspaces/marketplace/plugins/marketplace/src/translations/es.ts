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
  messages: {
    // Page headers and titles
    'header.title': 'Extensiones',
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
      "Configure el plugin '@red-hat-developer-hub/backstage-plugin-marketplace-backend'.",

    // Alerts and warnings
    'alert.productionDisabled':
      'La instalación de plugins está deshabilitada en el entorno de producción.',
    'alert.installationDisabled':
      'La instalación de plugins está deshabilitada.',
    'alert.extensionsExample':
      'Ejemplo de cómo habilitar la instalación de plugins de extensiones',
    'alert.singlePluginRestart':
      'El plugin <b>{{pluginName}}</b> requiere un reinicio del sistema backend para terminar de instalar, actualizar, habilitar o deshabilitar.',
    'alert.multiplePluginRestart':
      'Tiene {{count}} plugins que requieren un reinicio de su sistema backend para terminar de instalar, actualizar, habilitar o deshabilitar.',
    'alert.restartRequired': '{{count}} plugins instalados',
    'alert.backendRestartRequired': 'Reinicio del backend requerido',
    'alert.viewPlugins': 'Ver plugins',

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
    'dialog.restartMessage':
      'Para finalizar las modificaciones del plugin, reinicia tu sistema backend.',

    // Plugin details
    'plugin.description': 'Descripción',
    'plugin.documentation': 'Documentación',
    'plugin.repository': 'Repositorio',
    'plugin.license': 'Licencia',
    'plugin.version': 'Versión',
    'plugin.author': 'Autor',
    'plugin.tags': 'Etiquetas',
    'plugin.dependencies': 'Dependencias',
    'plugin.configuration': 'Configuración',
    'plugin.installation': 'Instalación',
    'plugin.entryName': 'Nombre de entrada',
    'plugin.bySomeone': 'por alguien',
    'plugin.category': 'Categoría',

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
    'package.entryName': 'Nombre de entrada',
    'package.bySomeone': 'por alguien',
    'package.category': 'Categoría',

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

    // Plugin actions and states
    'actions.install': 'Instalar',
    'actions.view': 'Ver',
    'actions.edit': 'Editar',
    'actions.enable': 'Habilitar',
    'actions.disable': 'Deshabilitar',
    'actions.actions': 'Acciones',
    'actions.editConfiguration': 'Editar',
    'actions.pluginConfigurations': 'Configuraciones del plugin',
    'actions.pluginCurrentlyEnabled': 'Plugin actualmente habilitado',
    'actions.pluginCurrentlyDisabled': 'Plugin actualmente deshabilitado',
    'actions.installTitle': 'Instalar {{displayName}}',
    'actions.editTitle': 'Editar configuraciones de {{displayName}}',

    // Plugin metadata
    'metadata.by': ' por ',
    'metadata.pluginNotFound': '¡Plugin {{name}} no encontrado!',
    'metadata.highlights': 'Aspectos destacados',
    'metadata.about': 'Acerca de',

    // Support type filters
    'supportTypes.certifiedBy': 'Certificado por {{value}} ({{count}})',
    'supportTypes.verifiedBy': 'Verificado por {{value}} ({{count}})',
    'supportTypes.customPlugins': 'Plugins personalizados ({{count}})',

    // Collections
    'collection.featured': 'Destacados',
    'collection.kubernetes': 'Kubernetes',
    'collection.monitoring': 'Monitoreo',
    'collection.security': 'Seguridad',
    'collection.viewMore': 'Ver más',
    'collection.featuredTitle': 'Plugins destacados',
    'collection.featuredDescription':
      'Una colección curada de plugins recomendados para la mayoría de usuarios',
    'collection.pluginCount': '{{count}} plugins',

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
      'La instalación de plugins está deshabilitada. Para habilitarla, actualiza tu configuración de extensiones en tu archivo app-config.yaml.',
    'tooltips.noPermissions':
      'No tienes permisos para instalar plugins o ver sus configuraciones. Contacta a tu administrador para solicitar acceso o asistencia.',

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
  },
});

export default marketplaceTranslationEs;
