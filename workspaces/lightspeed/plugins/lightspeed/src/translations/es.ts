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

import { lightspeedTranslationRef } from './ref';

/**
 * es translation for plugin.lightspeed.
 * @public
 */
const lightspeedTranslationEs = createTranslationMessages({
  ref: lightspeedTranslationRef,
  messages: {
    'page.title': 'Lightspeed',
    'page.subtitle': 'Asistente de desarrollo con tecnología de IA',
    'tabs.ariaLabel': 'Vistas de Lightspeed',
    'tabs.chat': 'Chat',
    'tabs.notebooks': 'Cuadernos',
    'tabs.notebooks.empty': 'El contenido de los cuadernos va aquí.',
    'notebooks.title': 'Mis cuadernos',
    'notebooks.empty.title': 'No hay cuadernos creados',
    'notebooks.empty.description':
      'Crea un nuevo cuaderno para organizar tus fuentes y generar información con IA.',
    'notebooks.empty.action': 'Crear un cuaderno nuevo',
    'notebooks.documents': 'Documentos',
    'notebooks.actions.rename': 'Renombrar',
    'notebooks.actions.delete': 'Eliminar',
    'notebooks.rename.title': '¿Renombrar {{name}}?',
    'notebooks.rename.description':
      'Introduce el nuevo nombre para este cuaderno y haz clic en Enviar para continuar.',
    'notebooks.rename.label': 'Nuevo nombre',
    'notebooks.rename.placeholder': 'Nuevo nombre',
    'notebooks.rename.action': 'Enviar',
    'notebooks.delete.title': '¿Eliminar {{name}}?',
    'notebooks.delete.message':
      'Ya no verás este cuaderno aquí. Esto también eliminará actividad relacionada como solicitudes, respuestas y comentarios de tu actividad de Lightspeed.',
    'notebooks.delete.action': 'Eliminar',
    'notebooks.delete.toast': '¡Cuaderno eliminado!',
    'notebooks.updated.today': 'Actualizado hoy',
    'notebooks.updated.yesterday': 'Actualizado hace 1 día',
    'notebooks.updated.days': 'Actualizado hace {{days}} días',
    'notebooks.updated.on': 'Actualizado el',

    // Notebook view
    'notebook.view.title': 'Cuaderno sin título',
    'notebook.view.close': 'Cerrar cuaderno',
    'notebook.view.documents.count': '{{count}} Documentos',
    'notebook.view.documents.add': 'Agregar',
    'notebook.view.upload.heading': 'Sube un recurso para empezar',
    'notebook.view.upload.action': 'Subir un recurso',
    'notebook.view.input.placeholder': 'Pregunta sobre tus documentos...',
    'notebook.view.sidebar.collapse': 'Contraer barra lateral',
    'notebook.view.sidebar.expand': 'Expandir barra lateral',
    'notebook.view.sidebar.resize': 'Redimensionar barra lateral',
    'notebook.view.documents.uploading': 'Subiendo documento',
    'notebook.upload.success': '{{fileName}} subido correctamente.',
    'notebook.upload.failed': 'Error al subir {{fileName}}.',

    // Notebook upload modal
    'notebook.upload.modal.title': 'Agregar un documento al cuaderno',
    'notebook.upload.modal.dragDropTitle':
      'Arrastra y suelta los archivos aquí',
    'notebook.upload.modal.browseButton': 'Subir',
    'notebook.upload.modal.infoText':
      'Tipos de archivo aceptados: .md, .txt, .pdf, .json, .yaml, .log',
    'notebook.upload.error.unsupportedType':
      'Error de carga: se encontraron tipos de archivo no compatibles. Suba solo tipos de archivo compatibles.',
    'notebook.upload.error.fileTooLarge':
      'Error de carga: el tamaño del archivo supera el límite de 25 MB.',
    'notebook.upload.error.tooManyFiles':
      'Error de carga: se permiten un máximo de {{max}} archivos.',

    // Notebook overwrite modal
    'notebook.overwrite.modal.title': '¿Sobrescribir archivos?',
    'notebook.overwrite.modal.description':
      'Los siguientes archivos ya existen en este cuaderno. ¿Desea sobrescribirlos con las nuevas versiones?',
    'notebook.overwrite.modal.action': 'Sobrescribir',

    'prompts.codeReadability.title':
      'Obtener ayuda sobre la legibilidad del código',
    'prompts.codeReadability.message':
      '¿Puedes sugerir técnicas que pueda utilizar para hacer que mi código sea más fácil de leer y mantener?',
    'prompts.debugging.title': 'Obtener ayuda con la depuración',
    'prompts.debugging.message':
      'Mi aplicación genera un error al intentar conectarse a la base de datos. ¿Puedes ayudarme a identificar el problema?',
    'prompts.developmentConcept.title': 'Explicar un concepto de desarrollo',
    'prompts.developmentConcept.message':
      '¿Puedes explicar cómo funciona la arquitectura de microservicios y sus ventajas frente a un diseño monolítico?',
    'prompts.codeOptimization.title': 'Sugerir optimizaciones de código',
    'prompts.codeOptimization.message':
      '¿Puedes sugerir formas comunes de optimizar el código para lograr un mejor rendimiento?',
    'prompts.documentation.title': 'Resumir la documentación',
    'prompts.documentation.message':
      '¿Puedes resumir la documentación para implementar la autenticación OAuth 2.0 en una aplicación web?',
    'prompts.gitWorkflows.title': 'Flujos de trabajo con Git',
    'prompts.gitWorkflows.message':
      'Quiero realizar cambios en el código en otra rama sin perder mi trabajo existente. ¿Cuál es el procedimiento para hacerlo con Git?',
    'prompts.testingStrategies.title': 'Sugerir estrategias de prueba',
    'prompts.testingStrategies.message':
      '¿Puedes recomendarme algunas estrategias de prueba comunes para lograr una aplicación sólida y libre de errores?',
    'prompts.sortingAlgorithms.title':
      'Desmitificar los algoritmos de clasificación',
    'prompts.sortingAlgorithms.message':
      '¿Puedes explicar la diferencia entre un algoritmo de clasificación rápido y un algoritmo de clasificación por combinación, y cuándo utilizar cada uno?',
    'prompts.eventDriven.title': 'Comprender la arquitectura basada en eventos',
    'prompts.eventDriven.message':
      '¿Puedes explicar qué es la arquitectura basada en eventos y cuándo es beneficioso usarla en el desarrollo de software?',
    'prompts.tekton.title': 'Implementar con Tekton',
    'prompts.tekton.message':
      '¿Puedes ayudarme a automatizar la implementación de mi aplicación con pipelines de Tekton?',
    'prompts.openshift.title': 'Crear una implementación de OpenShift',
    'prompts.openshift.message':
      '¿Puedes guiarme en la creación de una nueva implementación en OpenShift para una aplicación contenerizada?',
    'prompts.rhdh.title': 'Empezar a usar Red Hat Developer Hub',
    'prompts.rhdh.message':
      '¿Puedes explicarme los primeros pasos para usar Developer Hub como desarrollador, por ejemplo, cómo explorar el catálogo de software y agregar mi servicio?',
    'conversation.delete.confirm.title': '¿Eliminar chat?',
    'conversation.delete.confirm.message':
      'Ya no verás este chat aquí. Esto también eliminará la actividad relacionada, como indicaciones, respuestas y comentarios de la actividad de Lightspeed.',
    'conversation.delete.confirm.action': 'Eliminar',
    'conversation.rename.confirm.title': '¿Cambiar el nombre del chat?',
    'conversation.rename.confirm.action': 'Cambiar el nombre',
    'conversation.rename.placeholder': 'Nombre del chat',
    'permission.required.title': 'Permisos faltantes',
    'permission.required.description':
      'Para ver <subject/>, contacta a tu administrador para que te otorgue el permiso <permissions/>.',
    'permission.subject.plugin': 'el plugin de Lightspeed',
    'permission.subject.notebooks': 'los cuadernos de Lightspeed',
    'permission.notebooks.goBack': 'Volver',
    'disclaimer.withValidation':
      'Esta funcionalidad utiliza tecnología de IA. No incluya información personal ni otros datos confidenciales en la entrada. Las interacciones pueden utilizarse para mejorar los productos o servicios de Red Hat.',
    'disclaimer.withoutValidation':
      'Esta funcionalidad utiliza tecnología de IA. No incluya información personal ni otros datos confidenciales en la entrada. Las interacciones pueden utilizarse para mejorar los productos o servicios de Red Hat.',
    'footer.accuracy.label':
      'Revise siempre el contenido generado con IA antes de usarlo.',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.readMore': 'Leer más',
    'common.noSearchResults': 'Ningún resultado coincide con la búsqueda',
    'menu.newConversation': 'Nuevo chat',
    'chatbox.header.title': 'Developer Lightspeed',
    'chatbox.search.placeholder': 'Buscar',
    'chatbox.provider.other': 'Otro',
    'chatbox.emptyState.noPinnedChats': 'No hay chats fijados',
    'chatbox.emptyState.noRecentChats': 'No hay chats recientes',
    'chatbox.emptyState.noResults.title': 'No se encontraron resultados',
    'chatbox.emptyState.noResults.body':
      'Ajuste su solicitud de búsqueda y vuelva a intentarlo. Revise la ortografía o pruebe con un término más general.',
    'chatbox.welcome.greeting': 'Hola, {{userName}}',
    'chatbox.welcome.description': '¿Cómo puedo ayudarte hoy?',
    'chatbox.message.placeholder':
      'Envíe un mensaje y, de forma opcional, cargue un archivo JSON, YAML o TXT...',
    'chatbox.fileUpload.failed': 'Error al cargar el archivo',
    'chatbox.fileUpload.infoText':
      'Los tipos de archivo admitidos son .txt, .yaml y .json. El tamaño máximo del archivo es de 25 MB.',
    'aria.chatbotSelector': 'Selector de chatbot',
    'aria.important': 'Importante',
    'aria.chatHistoryMenu': 'Menú del historial de chat',
    'aria.closeDrawerPanel': 'Cerrar el panel lateral',
    'aria.search.placeholder': 'Buscar',
    'aria.searchPreviousConversations': 'Buscar conversaciones anteriores',
    'aria.resize': 'Redimensionar',
    'aria.options.label': 'Opciones',
    'aria.scroll.down': 'Volver al final',
    'aria.scroll.up': 'Volver arriba',
    'aria.settings.label': 'Opciones de chatbot',
    'aria.close': 'Cerrar chatbot',
    'modal.edit': 'Modificar',
    'modal.save': 'Guardar',
    'modal.close': 'Cerrar',
    'modal.cancel': 'Cancelar',
    'conversation.delete': 'Eliminar',
    'conversation.rename': 'Cambiar el nombre',
    'conversation.addToPinnedChats': 'Fijar',
    'conversation.removeFromPinnedChats': 'Quitar fijación',
    'conversation.announcement.userMessage':
      'Mensaje del usuario: {{prompt}}. El mensaje del bot se está cargando.',
    'user.guest': 'Invitado',
    'conversation.announcement.responseStopped': 'Respuesta detenida.',
    'user.loading': '...',
    'tooltip.attach': 'Adjuntar',
    'tooltip.send': 'Enviar',
    'tooltip.microphone.active': 'Dejar de escuchar',
    'tooltip.microphone.inactive': 'Usar micrófono',
    'button.newChat': 'Nuevo chat',
    'tooltip.chatHistoryMenu': 'Menú del historial de chat',
    'tooltip.responseRecorded': 'Respuesta grabada',
    'tooltip.backToTop': 'Volver arriba',
    'tooltip.backToBottom': 'Volver al final',
    'tooltip.settings': 'Opciones de chatbot',
    'tooltip.close': 'Cerrar',
    'modal.title.preview': 'Previsualizar archivo adjunto',
    'modal.title.edit': 'Modificar archivo adjunto',
    'icon.lightspeed.alt': 'icono de Lightspeed',
    'icon.permissionRequired.alt': 'icono de permiso requerido',
    'message.options.label': 'Opciones',
    'file.upload.error.alreadyExists': 'El archivo ya existe.',
    'file.upload.error.multipleFiles': 'Subió más de un archivo.',
    'file.upload.error.unsupportedType':
      'Tipo de archivo no compatible. Los tipos de archivo admitidos son .txt, .yaml y .json.',
    'file.upload.error.fileTooLarge':
      'El tamaño del archivo es demasiado grande. Asegúrate de que el archivo sea menor de 25 MB.',
    'file.upload.error.readFailed':
      'No se pudo leer el archivo: {{errorMessage}}',
    'error.context.fileAttachment':
      'useFileAttachmentContext debe estar dentro de un FileAttachmentContextProvider',
    'feedback.form.title': '¿Por qué eligió esta calificación?',
    'feedback.form.textAreaPlaceholder':
      'Proporcionar comentarios adicionales opcionales',
    'feedback.form.submitWord': 'Enviar',
    'feedback.tooltips.goodResponse': 'Buena respuesta',
    'feedback.tooltips.badResponse': 'Mala respuesta',
    'feedback.tooltips.copied': 'Copiado',
    'feedback.tooltips.copy': 'Copiar',
    'feedback.tooltips.listening': 'Escuchando',
    'feedback.tooltips.listen': 'Escuchar',
    'feedback.quickResponses.positive.helpful': 'Información útil',
    'feedback.quickResponses.positive.easyToUnderstand': 'Fácil de entender',
    'feedback.quickResponses.positive.resolvedIssue': 'Resolvió mi problema',
    'feedback.quickResponses.negative.didntAnswer': 'No respondió mi pregunta',
    'feedback.quickResponses.negative.hardToUnderstand': 'Difícil de entender',
    'feedback.quickResponses.negative.notHelpful': 'No es útil',
    'feedback.completion.title': 'Comentarios enviados',
    'feedback.completion.body':
      'Recibimos su respuesta. ¡Gracias por compartir sus comentarios!',
    'conversation.category.pinnedChats': 'Fijado',
    'conversation.category.recent': 'Reciente',
    'settings.pinned.enable': 'Habilitar chats fijados',
    'settings.pinned.disable': 'Deshabilitar chats fijados',
    'settings.pinned.enabled.description':
      'Los chats fijados están habilitados actualmente',
    'settings.pinned.disabled.description':
      'Los chats fijados están deshabilitados actualmente',
    'settings.mcp.label': 'Configuración de MCP',
    'mcp.settings.title': 'Servidores MCP',
    'mcp.settings.selectedCount':
      '{{selectedCount}} de {{totalCount}} seleccionados',
    'mcp.settings.closeAriaLabel': 'Cerrar configuración de MCP',
    'mcp.settings.readOnlyAccess':
      'Tienes acceso de solo lectura a los servidores MCP.',
    'mcp.settings.tableAriaLabel': 'Tabla de servidores MCP',
    'mcp.settings.enabled': 'Habilitado',
    'mcp.settings.name': 'Nombre',
    'mcp.settings.status': 'Estado',
    'mcp.settings.edit': 'Editar',
    'mcp.settings.loading': 'Cargando servidores MCP...',
    'mcp.settings.noneAvailable': 'No hay servidores MCP disponibles.',
    'mcp.settings.status.disabled': 'Deshabilitado',
    'mcp.settings.status.tokenRequired': 'Se requiere token',
    'mcp.settings.status.failed': 'Falló',
    'mcp.settings.status.oneTool': '{{count}} herramienta',
    'mcp.settings.status.manyTools': '{{count}} herramientas',
    'mcp.settings.status.unknown': 'Desconocido',
    'mcp.settings.toggleServerAriaLabel': 'Alternar {{serverName}}',
    'mcp.settings.editServerAriaLabel': 'Editar {{serverName}}',
    'mcp.settings.configureServerTitle': 'Configurar servidor {{serverName}}',
    'mcp.settings.closeConfigureModalAriaLabel':
      'Cerrar modal de configuración',
    'mcp.settings.modalDescription':
      'Las credenciales se almacenan cifradas y se limitan a tu perfil. Lightspeed funcionará con exactamente tus permisos.',
    'mcp.settings.savedToken': 'Token guardado',
    'mcp.settings.personalAccessToken': 'Token de acceso personal',
    'mcp.settings.usingAdminCredential':
      'Se están usando credenciales proporcionadas por el administrador. Introduce un token personal para reemplazarlas en tu cuenta.',
    'mcp.settings.enterToken': 'Introduce tu token',
    'mcp.settings.removePersonalToken': 'Eliminar token personal',
    'mcp.settings.token.clearAriaLabel': 'Borrar entrada de token',
    'mcp.settings.token.validating': 'Validando token...',
    'mcp.settings.token.savingAndValidating': 'Guardando y validando token...',
    'mcp.settings.token.urlUnavailableForValidation':
      'No se puede validar el token porque la URL del servidor no está disponible.',
    'mcp.settings.token.invalidCredentials':
      'Credenciales no válidas. Revisa la URL del servidor y el token.',
    'mcp.settings.token.validationFailed':
      'La validación falló. Revisa la URL del servidor y el token.',
    'mcp.settings.token.connectionSuccessful': 'Conexión correcta',
    'toolCall.header': 'Respuesta de la herramienta: {{toolName}}',
    'toolCall.thinking': 'Pensó durante {{seconds}} segundos',
    'toolCall.executionTime': 'Tiempo de ejecución: ',
    'toolCall.parameters': 'Parámetros',
    'toolCall.response': 'Respuesta',
    'toolCall.showMore': 'mostrar más',
    'toolCall.showLess': 'mostrar menos',
    'toolCall.loading': 'Herramienta en ejecución...',
    'toolCall.executing': 'Herramienta en ejecución...',
    'toolCall.copyResponse': 'Copiar respuesta',
    'toolCall.summary': 'Este es un resumen de su respuesta',
    'toolCall.mcpServer': 'Servidor MCP',
    'settings.displayMode.label': 'Modo de visualización',
    'settings.displayMode.overlay': 'Superposición',
    'settings.displayMode.docked': 'Anclar a la ventana',
    'settings.displayMode.fullscreen': 'Pantalla completa',
    'sort.label': 'Ordenar conversaciones',
    'sort.newest': 'Fecha (la más reciente primero)',
    'sort.oldest': 'Fecha (la más antigua primero)',
    'sort.alphabeticalAsc': 'Nombre (A-Z)',
    'sort.alphabeticalDesc': 'Nombre (Z-A)',
    'reasoning.thinking': 'Mostrar pensamiento',
  },
});

export default lightspeedTranslationEs;
