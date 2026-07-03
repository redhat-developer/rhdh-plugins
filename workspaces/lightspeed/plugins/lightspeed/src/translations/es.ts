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
    'aria.chatHistoryMenu': 'Menú del historial de chat',
    'aria.chatbotSelector': 'Selector de chatbot',
    'aria.close': 'Cerrar chatbot',
    'aria.closeDrawerPanel': 'Cerrar el panel lateral',
    'aria.important': 'Importante',
    'aria.options.label': 'Opciones',
    'aria.resize': 'Redimensionar',
    'aria.scroll.down': 'Volver al final',
    'aria.scroll.up': 'Volver arriba',
    'aria.search.placeholder': 'Buscar',
    'aria.searchPreviousConversations': 'Buscar conversaciones anteriores',
    'attach.menu.description': 'Adjuntar un archivo JSON, YAML o TXT',
    'attach.menu.title': 'Adjuntar',
    'button.newChat': 'Nuevo chat',
    'chatbox.emptyState.noPinnedChats': 'Fija chats para mantenerlos arriba',
    'chatbox.emptyState.noRecentChats': 'No hay chats recientes',
    'chatbox.emptyState.noResults.body':
      'Ajuste su solicitud de búsqueda y vuelva a intentarlo. Revise la ortografía o pruebe con un término más general.',
    'chatbox.emptyState.noResults.title': 'No se encontraron resultados',
    'chatbox.fileUpload.failed': 'Error al cargar el archivo',
    'chatbox.fileUpload.infoText':
      'Los tipos de archivo admitidos son .txt, .yaml y .json. El tamaño máximo del archivo es de 25 MB.',
    'chatbox.header.title': 'Developer Hub Asistente Inteligente',
    'chatbox.message.placeholder':
      'Envíe un mensaje y, de forma opcional, cargue un archivo JSON, YAML o TXT...',
    'chatbox.provider.other': 'Otro',
    'chatbox.search.placeholder': 'Buscar',
    'chatbox.welcome.description': '¿Cómo puedo ayudarte hoy?',
    'chatbox.welcome.greeting': 'Hola, {{userName}}',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.loading': 'Cargando',
    'common.noSearchResults': 'Ningún resultado coincide con la búsqueda',
    'common.readMore': 'Leer más',
    'common.retry': 'Volver a intentar',
    'conversation.addToPinnedChats': 'Fijar',
    'conversation.announcement.responseStopped': 'Respuesta detenida.',
    'conversation.announcement.userMessage':
      'Mensaje del usuario: {{prompt}}. El mensaje del bot se está cargando.',
    'conversation.category.pinnedChats': 'Chats fijados',
    'conversation.category.recent': 'Chats',
    'conversation.delete': 'Eliminar',
    'conversation.delete.confirm.action': 'Eliminar',
    'conversation.delete.confirm.message':
      'Ya no verás este chat aquí. Esto también eliminará la actividad relacionada, como indicaciones, respuestas y comentarios de tu actividad.',
    'conversation.delete.confirm.title': '¿Eliminar "{{chatName}}"?',
    'conversation.removeFromPinnedChats': 'Quitar fijación',
    'conversation.rename': 'Cambiar el nombre',
    'conversation.rename.confirm.action': 'Cambiar el nombre',
    'conversation.rename.confirm.title': '¿Cambiar el nombre del chat?',
    'conversation.rename.placeholder': 'Nombre del chat',
    'disclaimer.withValidation':
      'Esta funcionalidad utiliza tecnología de IA. No incluya información personal ni otros datos confidenciales en la entrada. Las interacciones pueden utilizarse para mejorar los productos o servicios de Red Hat.',
    'disclaimer.withoutValidation':
      'Esta funcionalidad utiliza tecnología de IA. No incluya información personal ni otros datos confidenciales en la entrada. Las interacciones pueden utilizarse para mejorar los productos o servicios de Red Hat.',
    'error.context.fileAttachment':
      'useFileAttachmentContext debe estar dentro de un FileAttachmentContextProvider',
    'feedback.completion.body':
      'Recibimos su respuesta. ¡Gracias por compartir sus comentarios!',
    'feedback.completion.title': 'Comentarios enviados',
    'feedback.form.submitWord': 'Enviar',
    'feedback.form.textAreaPlaceholder':
      'Proporcionar comentarios adicionales opcionales',
    'feedback.form.title': '¿Por qué eligió esta calificación?',
    'feedback.quickResponses.negative.didntAnswer': 'No respondió mi pregunta',
    'feedback.quickResponses.negative.hardToUnderstand': 'Difícil de entender',
    'feedback.quickResponses.negative.notHelpful': 'No es útil',
    'feedback.quickResponses.positive.easyToUnderstand': 'Fácil de entender',
    'feedback.quickResponses.positive.helpful': 'Información útil',
    'feedback.quickResponses.positive.resolvedIssue': 'Resolvió mi problema',
    'feedback.tooltips.badResponse': 'Mala respuesta',
    'feedback.tooltips.copied': 'Copiado',
    'feedback.tooltips.copy': 'Copiar',
    'feedback.tooltips.goodResponse': 'Buena respuesta',
    'feedback.tooltips.listen': 'Escuchar',
    'feedback.tooltips.listening': 'Escuchando',
    'file.upload.error.alreadyExists': 'El archivo ya existe.',
    'file.upload.error.fileTooLarge':
      'El tamaño del archivo es demasiado grande. Asegúrate de que el archivo sea menor de 25 MB.',
    'file.upload.error.multipleFiles': 'Subió más de un archivo.',
    'file.upload.error.readFailed':
      'No se pudo leer el archivo: {{errorMessage}}',
    'file.upload.error.unsupportedType':
      'Tipo de archivo no compatible. Los tipos de archivo admitidos son .txt, .yaml y .json.',
    'footer.accuracy.label':
      'Revise siempre el contenido generado con IA antes de usarlo.',
    'icon.lightspeed.alt': 'icono del asistente inteligente',
    'icon.permissionRequired.alt': 'icono de permiso requerido',
    'lcore.loadError.description':
      'El backend del asistente inteligente no devolvió una lista de modelos. Compruebe que el servicio está en ejecución y es accesible, e inténtelo de nuevo.',
    'lcore.loadError.title': 'No se pudieron cargar los modelos',
    'lcore.notConfigured.backendDocs':
      'Configuración del backend del asistente inteligente',
    'lcore.notConfigured.description':
      'El asistente inteligente requiere un LLM registrado. Póngase en contacto con el administrador de la plataforma de su organización para completar la configuración.',
    'lcore.notConfigured.developerLightspeedDocs':
      'Configurando Developer Hub Intelligent Assistant',
    'lcore.notConfigured.title': 'Conecte un LLM para empezar',
    'mcp.settings.closeAriaLabel': 'Cerrar configuración de MCP',
    'mcp.settings.closeConfigureModalAriaLabel':
      'Cerrar modal de configuración',
    'mcp.settings.configureServerTitle': 'Configurar servidor {{serverName}}',
    'mcp.settings.edit': 'Editar',
    'mcp.settings.editServerAriaLabel': 'Editar {{serverName}}',
    'mcp.settings.enabled': 'Habilitado',
    'mcp.settings.enterToken': 'Introduce tu token',
    'mcp.settings.loading': 'Cargando servidores MCP...',
    'mcp.settings.modalDescription':
      'Las credenciales se almacenan cifradas y se limitan a tu perfil. El asistente inteligente funcionará con exactamente tus permisos.',
    'mcp.settings.name': 'Nombre',
    'mcp.settings.noneAvailable': 'No hay servidores MCP disponibles.',
    'mcp.settings.personalAccessToken': 'Token de acceso personal',
    'mcp.settings.readOnlyAccess':
      'Tienes acceso de solo lectura a los servidores MCP.',
    'mcp.settings.removePersonalToken': 'Eliminar token personal',
    'mcp.settings.savedToken': 'Token guardado',
    'mcp.settings.selectedCount':
      '{{selectedCount}} de {{totalCount}} seleccionados',
    'mcp.settings.status': 'Estado',
    'mcp.settings.status.disabled': 'Deshabilitado',
    'mcp.settings.status.failed': 'Falló',
    'mcp.settings.status.manyTools': '{{count}} herramientas',
    'mcp.settings.status.oneTool': '{{count}} herramienta',
    'mcp.settings.status.tokenRequired': 'Se requiere token',
    'mcp.settings.status.unknown': 'Desconocido',
    'mcp.settings.tableAriaLabel': 'Tabla de servidores MCP',
    'mcp.settings.title': 'Servidores MCP',
    'mcp.settings.toggleServerAriaLabel': 'Alternar {{serverName}}',
    'mcp.settings.token.clearAriaLabel': 'Borrar entrada de token',
    'mcp.settings.token.connectionSuccessful': 'Conexión correcta',
    'mcp.settings.token.invalidCredentials':
      'Credenciales no válidas. Revisa la URL del servidor y el token.',
    'mcp.settings.token.savingAndValidating': 'Guardando y validando token...',
    'mcp.settings.token.urlUnavailableForValidation':
      'No se puede validar el token porque la URL del servidor no está disponible.',
    'mcp.settings.token.validating': 'Validando token...',
    'mcp.settings.token.validationFailed':
      'La validación falló. Revisa la URL del servidor y el token.',
    'mcp.settings.usingAdminCredential':
      'Se están usando credenciales proporcionadas por el administrador. Introduce un token personal para reemplazarlas en tu cuenta.',
    'menu.newConversation': 'Nuevo chat',
    'message.options.label': 'Opciones',
    'modal.cancel': 'Cancelar',
    'modal.close': 'Cerrar',
    'modal.edit': 'Modificar',
    'modal.save': 'Guardar',
    'modal.title.edit': 'Modificar archivo adjunto',
    'modal.title.preview': 'Previsualizar archivo adjunto',
    'notebook.document.delete': 'Eliminar',
    'notebook.document.delete.action': 'Eliminar',
    'notebook.document.delete.description':
      '¿Está seguro de que desea eliminar <documentName/> de este cuaderno? Esta acción no se puede deshacer.',
    'notebook.document.delete.success':
      '«{{documentName}}» se eliminó correctamente.',
    'notebook.document.delete.title': '¿Eliminar recurso?',
    'notebook.overwrite.modal.action': 'Sobrescribir',
    'notebook.overwrite.modal.description':
      'Los siguientes archivos ya existen en este cuaderno. ¿Desea sobrescribirlos con las nuevas versiones?',
    'notebook.overwrite.modal.title': '¿Sobrescribir archivos?',
    'notebook.upload.error.fileTooLarge':
      'Error de carga: el tamaño del archivo supera el límite de 25 MB.',
    'notebook.upload.error.tooManyFiles':
      'Error de carga: se permiten un máximo de {{max}} archivos.',
    'notebook.upload.error.unsupportedType':
      'Error de carga: se encontraron tipos de archivo no compatibles. Suba solo tipos de archivo compatibles.',
    'notebook.upload.failed': 'Error al subir "{{fileName}}".',
    'notebook.upload.modal.addButton': 'Agregar ({{count}})',
    'notebook.upload.modal.browseButton': 'Subir',
    'notebook.upload.modal.dragDropTitle':
      'Arrastra y suelta los archivos aquí',
    'notebook.upload.modal.infoText':
      'Tipos de archivo aceptados: .md, .txt, .pdf, .json, .yaml, .log',
    'notebook.upload.modal.removeFile': 'Eliminar {{fileName}}',
    'notebook.upload.modal.selectedFiles':
      '{{count}} de {{max}} archivos seleccionados',
    'notebook.upload.modal.separator': 'o',
    'notebook.upload.modal.title': 'Agregar un documento al cuaderno',
    'notebook.view.close': 'Cerrar cuaderno',
    'notebook.view.documents.add': 'Agregar',
    'notebook.view.documents.count': '{{count}} Documentos',
    'notebook.view.documents.maxReached':
      'Se permiten un máximo de 10 documentos. Elimina un documento para subir uno nuevo.',
    'notebook.view.documents.uploading': 'Subiendo documento',
    'notebook.view.input.disabledTooltip':
      'Selecciona al menos un recurso cargado para comenzar a chatear',
    'notebook.view.input.placeholder': 'Pregunta sobre tus documentos...',
    'notebook.view.sidebar.collapse': 'Contraer barra lateral',
    'notebook.view.sidebar.expand': 'Expandir barra lateral',
    'notebook.view.sidebar.resize': 'Redimensionar barra lateral',
    'notebook.view.title': 'Cuaderno sin título',
    'notebook.view.upload.action': 'Subir un recurso',
    'notebook.view.processing.description':
      'Sus archivos están siendo indexados. Puede comenzar a hacer preguntas una vez que se complete el procesamiento.',
    'notebook.view.processing.heading': 'Procesando recursos...',
    'notebook.view.upload.heading': 'Sube un recurso para empezar',
    'notebooks.actions.delete': 'Eliminar',
    'notebooks.actions.rename': 'Renombrar',
    'notebooks.card.openAria': 'Abrir el cuaderno {{name}}',
    'notebooks.delete.action': 'Eliminar',
    'notebooks.delete.message':
      'Ya no verás este cuaderno aquí. Esto también eliminará actividad relacionada como solicitudes, respuestas y comentarios de tu actividad.',
    'notebooks.delete.title': '¿Eliminar {{name}}?',
    'notebooks.delete.toast': '¡Cuaderno eliminado!',
    'notebooks.documents': 'Documentos',
    'notebooks.empty.action': 'Crear un cuaderno nuevo',
    'notebooks.empty.description':
      'Crea un nuevo cuaderno para organizar tus fuentes y generar información con IA.',
    'notebooks.empty.title': 'No hay cuadernos creados',
    'notebooks.prompts.accessIssue.title': 'Ayúdame con un problema de acceso',
    'notebooks.prompts.coreConcepts.title': '¿Cuáles son los conceptos clave?',
    'notebooks.prompts.vulnerabilities.title':
      'Mostrar mis vulnerabilidades críticas',
    'notebooks.rename.action': 'Enviar',
    'notebooks.rename.description':
      'Introduce el nuevo nombre para este cuaderno y haz clic en Enviar para continuar.',
    'notebooks.rename.label': 'Nuevo nombre',
    'notebooks.rename.placeholder': 'Nuevo nombre',
    'notebooks.rename.title': '¿Renombrar {{name}}?',
    'notebooks.title': 'Mis cuadernos',
    'notebooks.updated.days': 'Actualizado hace {{days}} días',
    'notebooks.updated.on': 'Actualizado el',
    'notebooks.updated.today': 'Actualizado hoy',
    'notebooks.updated.yesterday': 'Actualizado hace 1 día',
    'page.subtitle': 'Asistente de desarrollo con tecnología de IA',
    'page.title': 'Asistente inteligente',
    'permission.notebooks.goBack': 'Volver',
    'permission.required.description':
      'Para ver <subject/>, contacta a tu administrador para que te otorgue el permiso <permissions/>.',
    'permission.required.title': 'Permisos faltantes',
    'permission.subject.notebooks': 'los cuadernos del asistente inteligente',
    'permission.subject.plugin': 'el plugin del asistente inteligente',
    'prompts.codeOptimization.message':
      '¿Puedes sugerir formas comunes de optimizar el código para lograr un mejor rendimiento?',
    'prompts.codeOptimization.title': 'Sugerir optimizaciones de código',
    'prompts.codeReadability.message':
      '¿Puedes sugerir técnicas que pueda utilizar para hacer que mi código sea más fácil de leer y mantener?',
    'prompts.codeReadability.title':
      'Obtener ayuda sobre la legibilidad del código',
    'prompts.debugging.message':
      'Mi aplicación genera un error al intentar conectarse a la base de datos. ¿Puedes ayudarme a identificar el problema?',
    'prompts.debugging.title': 'Obtener ayuda con la depuración',
    'prompts.developmentConcept.message':
      '¿Puedes explicar cómo funciona la arquitectura de microservicios y sus ventajas frente a un diseño monolítico?',
    'prompts.developmentConcept.title': 'Explicar un concepto de desarrollo',
    'prompts.documentation.message':
      '¿Puedes resumir la documentación para implementar la autenticación OAuth 2.0 en una aplicación web?',
    'prompts.documentation.title': 'Resumir la documentación',
    'prompts.eventDriven.message':
      '¿Puedes explicar qué es la arquitectura basada en eventos y cuándo es beneficioso usarla en el desarrollo de software?',
    'prompts.eventDriven.title': 'Comprender la arquitectura basada en eventos',
    'prompts.gitWorkflows.message':
      'Quiero realizar cambios en el código en otra rama sin perder mi trabajo existente. ¿Cuál es el procedimiento para hacerlo con Git?',
    'prompts.gitWorkflows.title': 'Flujos de trabajo con Git',
    'prompts.openshift.message':
      '¿Puedes guiarme en la creación de una nueva implementación en OpenShift para una aplicación contenerizada?',
    'prompts.openshift.title': 'Crear una implementación de OpenShift',
    'prompts.rhdh.message':
      '¿Puedes explicarme los primeros pasos para usar Developer Hub como desarrollador, por ejemplo, cómo explorar el catálogo de software y agregar mi servicio?',
    'prompts.rhdh.title': 'Empezar a usar Red Hat Developer Hub',
    'prompts.sortingAlgorithms.message':
      '¿Puedes explicar la diferencia entre un algoritmo de clasificación rápido y un algoritmo de clasificación por combinación, y cuándo utilizar cada uno?',
    'prompts.sortingAlgorithms.title':
      'Desmitificar los algoritmos de clasificación',
    'prompts.tekton.message':
      '¿Puedes ayudarme a automatizar la implementación de mi aplicación con pipelines de Tekton?',
    'prompts.tekton.title': 'Implementar con Tekton',
    'prompts.testingStrategies.message':
      '¿Puedes recomendarme algunas estrategias de prueba comunes para lograr una aplicación sólida y libre de errores?',
    'prompts.testingStrategies.title': 'Sugerir estrategias de prueba',
    'reasoning.thinking': 'Mostrar pensamiento',
    'settings.displayMode.docked': 'Anclar a la ventana',
    'settings.displayMode.fullscreen': 'Pantalla completa',
    'settings.displayMode.label': 'Modo de visualización',
    'settings.displayMode.overlay': 'Superposición',
    'settings.mcp.badge': 'Nuevo',
    'settings.mcp.label': 'Configuración de MCP',
    'settings.pinned.disable': 'Deshabilitar chats fijados',
    'settings.pinned.disabled.description':
      'Los chats fijados están deshabilitados actualmente',
    'settings.pinned.enable': 'Habilitar chats fijados',
    'settings.pinned.enabled.description':
      'Los chats fijados están habilitados actualmente',
    'sort.alphabeticalAsc': 'Nombre (A-Z)',
    'sort.alphabeticalDesc': 'Nombre (Z-A)',
    'sort.label': 'Ordenar conversaciones',
    'sort.newest': 'Fecha (la más reciente primero)',
    'sort.oldest': 'Fecha (la más antigua primero)',
    'sources.chip.label_one': '{{count}} Fuente',
    'sources.chip.label_other': '{{count}} Fuentes',
    'sources.modal.description':
      'Las siguientes fuentes se utilizaron para generar esta respuesta de IA y proporcionar información complementaria:',
    'sources.modal.title': 'Fuentes',
    'sources.popover.closeAriaLabel': 'Cerrar fuentes',
    'tabs.ariaLabel': 'Vistas del asistente inteligente',
    'tabs.chat': 'Chat',
    'tabs.notebooks': 'Cuadernos',
    'tabs.notebooks.devPreview': 'Vista previa para desarrolladores',
    'tabs.notebooks.empty': 'El contenido de los cuadernos va aquí.',
    'toolCall.copyResponse': 'Copiar respuesta',
    'toolCall.executing': 'Herramienta en ejecución...',
    'toolCall.executionTime': 'Tiempo de ejecución: ',
    'toolCall.header': 'Respuesta de la herramienta: {{toolName}}',
    'toolCall.loading': 'Herramienta en ejecución...',
    'toolCall.mcpServer': 'Servidor MCP',
    'toolCall.parameters': 'Parámetros',
    'toolCall.response': 'Respuesta',
    'toolCall.showLess': 'mostrar menos',
    'toolCall.showMore': 'mostrar más',
    'toolCall.summary': 'Este es un resumen de su respuesta',
    'toolCall.thinking': 'Pensó durante {{seconds}} segundos',
    'tooltip.attach': 'Adjuntar',
    'tooltip.backToBottom': 'Volver al final',
    'tooltip.backToTop': 'Volver arriba',
    'tooltip.chatHistoryMenu': 'Menú del historial de chat',
    'tooltip.close': 'Cerrar',
    'tooltip.collapseHistoryPanel': 'Colapsar historial de chat',
    'tooltip.expandHistoryPanel': 'Expandir historial de chat',
    'tooltip.fab.close': 'Cerrar asistente inteligente',
    'tooltip.fab.open': 'Abrir asistente inteligente',
    'tooltip.microphone.active': 'Dejar de escuchar',
    'tooltip.microphone.inactive': 'Usar micrófono',
    'tooltip.quickNewChat': 'Nuevo chat',
    'tooltip.responseRecorded': 'Respuesta grabada',
    'tooltip.send': 'Enviar',
    'user.guest': 'Invitado',
    'user.loading': '...',
  },
});

export default lightspeedTranslationEs;
