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
import { globalHeaderTranslationRef } from './ref';

/**
 * es translation for plugin.global-header.
 * @public
 */
const globalHeaderTranslationEs = createTranslationMessages({
  ref: globalHeaderTranslationRef,
  messages: {
    'help.tooltip': 'Ayuda',
    'help.noSupportLinks': 'No hay enlaces de soporte',
    'help.noSupportLinksSubtitle':
      'Su administrador debe configurar enlaces de soporte.',
    'help.quickStart': 'Inicio rápido',
    'help.supportTitle': 'Soporte',
    'profile.picture': 'Foto de perfil',
    'profile.settings': 'Configuración',
    'profile.myProfile': 'Mi perfil',
    'profile.signOut': 'Cerrar sesión',
    'search.placeholder': 'Buscar...',
    'search.noResults': 'No se encontraron resultados',
    'search.errorFetching': 'Error al extraer los resultados',
    'search.allResults': 'Todos los resultados',
    'search.clear': 'Limpiar',
    'applicationLauncher.tooltip': 'Iniciador de aplicaciones',
    'applicationLauncher.noLinksTitle':
      'No hay enlaces de aplicación configurados',
    'applicationLauncher.noLinksSubtitle':
      'Configure los enlaces de aplicación en la configuración del complemento dinámico para obtener acceso rápido desde aquí.',
    'applicationLauncher.developerHub': 'Developer Hub',
    'applicationLauncher.rhdhLocal': 'RHDH Local',
    'applicationLauncher.sections.documentation': 'Documentación',
    'applicationLauncher.sections.developerTools':
      'Herramientas para desarrolladores',
    'starred.title': 'Sus artículos destacados',
    'starred.removeTooltip': 'Eliminar de la lista',
    'starred.noItemsTitle': 'Aún no hay elementos destacados',
    'starred.noItemsSubtitle':
      'Haga clic en el icono de la estrella junto al nombre de una entidad para guardarla aquí y acceder a ella rápidamente.',
    'notifications.title': 'Notificaciones',
    'notifications.unsupportedDismissOption':
      'Opción para desestimar "{{option}}" no admitida. Opciones admitidas actualmente: "none", "session" o "localstorage".',
    'create.title': 'Autoservicio',
    'create.registerComponent.title': 'Registrar un componente',
    'create.registerComponent.subtitle': 'Importarlo a la página de catálogo',
    'create.templates.sectionTitle': 'Usar una plantilla',
    'create.templates.allTemplates': 'Todas las plantillas',
    'create.templates.errorFetching': 'Error al obtener plantillas',
    'create.templates.noTemplatesAvailable': 'No hay plantillas disponibles',
  },
});

export default globalHeaderTranslationEs;
