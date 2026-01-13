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
 * Spanish translation for Developer Lightspeed.
 * @public
 */
const lightspeedTranslationEs = createTranslationMessages({
  ref: lightspeedTranslationRef,
  messages: {
    // Page titles and headers
    'page.title': 'Lightspeed',
    'page.subtitle': 'Asistente de desarrollo impulsado por IA',

    // Sample prompts - General Development
    'prompts.codeReadability.title':
      'Obtener ayuda sobre legibilidad del código',
    'prompts.codeReadability.message':
      '¿Puedes sugerir técnicas que pueda usar para hacer mi código más legible y mantenible?',
    'prompts.debugging.title': 'Obtener ayuda con depuración',
    'prompts.debugging.message':
      'Mi aplicación está lanzando un error al intentar conectarse a la base de datos. ¿Puedes ayudarme a identificar el problema?',
    'prompts.developmentConcept.title': 'Explicar un concepto de desarrollo',
    'prompts.developmentConcept.message':
      '¿Puedes explicar cómo funciona la arquitectura de microservicios y sus ventajas sobre un diseño monolítico?',
    'prompts.codeOptimization.title': 'Sugerir optimizaciones de código',
    'prompts.codeOptimization.message':
      '¿Puedes sugerir formas comunes de optimizar el código para lograr mejor rendimiento?',
    'prompts.documentation.title': 'Resumen de documentación',
    'prompts.documentation.message':
      '¿Puedes resumir la documentación para implementar autenticación OAuth 2.0 en una aplicación web?',
    'prompts.gitWorkflows.title': 'Flujos de trabajo con Git',
    'prompts.gitWorkflows.message':
      'Quiero hacer cambios en el código en otra rama sin perder mi trabajo existente. ¿Cuál es el procedimiento para hacer esto usando Git?',
    'prompts.testingStrategies.title': 'Sugerir estrategias de prueba',
    'prompts.testingStrategies.message':
      '¿Puedes recomendar algunas estrategias de prueba comunes que harán que mi aplicación sea robusta y libre de errores?',
    'prompts.sortingAlgorithms.title':
      'Desmitificar algoritmos de ordenamiento',
    'prompts.sortingAlgorithms.message':
      '¿Puedes explicar la diferencia entre un algoritmo de ordenamiento rápido y uno de ordenamiento por mezcla, y cuándo usar cada uno?',
    'prompts.eventDriven.title':
      'Entender la arquitectura impulsada por eventos',
    'prompts.eventDriven.message':
      '¿Puedes explicar qué es la arquitectura impulsada por eventos y cuándo es beneficioso usarla en el desarrollo de software?',

    // Sample prompts - RHDH Specific
    'prompts.tekton.title': 'Implementar con Tekton',
    'prompts.tekton.message':
      '¿Puedes ayudarme a automatizar la implementación de mi aplicación usando pipelines de Tekton?',
    'prompts.openshift.title': 'Crear una implementación de OpenShift',
    'prompts.openshift.message':
      '¿Puedes guiarme a través de la creación de una nueva implementación en OpenShift para una aplicación containerizada?',
    'prompts.rhdh.title': 'Comenzar con Red Hat Developer Hub',
    'prompts.rhdh.message':
      '¿Puedes guiarme a través de los primeros pasos para comenzar a usar Developer Hub como desarrollador, como explorar el Catálogo de Software y agregar mi servicio?',

    // Conversation history
    'conversation.delete.confirm.title': '¿Eliminar chat?',
    'conversation.delete.confirm.message':
      'Ya no verás este chat aquí. Esto también eliminará la actividad relacionada como prompts, respuestas y comentarios de tu Actividad de Lightspeed.',
    'conversation.delete.confirm.action': 'Eliminar',
    'conversation.rename.confirm.title': '¿Renombrar chat?',
    'conversation.rename.confirm.action': 'Renombrar',
    'conversation.rename.placeholder': 'Nombre del chat',
    'conversation.action.error': 'Error ocurrido: {{error}}',

    // Permissions
    'permission.required.title': 'Permisos faltantes',
    'permission.required.description':
      'Para ver el plugin de lightspeed, contacta a tu administrador para que te dé los permisos <b>lightspeed.chat.read</b> y <b>lightspeed.chat.create</b>.',

    // Disclaimers
    'disclaimer.withValidation':
      'Esta función utiliza tecnología de IA. No incluyas información personal ni otra información sensible en tu entrada. Las interacciones pueden ser utilizadas para mejorar los productos o servicios de Red Hat.',
    'disclaimer.withoutValidation':
      'Esta función utiliza tecnología de IA. No incluyas información personal ni otra información sensible en tu entrada. Las interacciones pueden ser utilizadas para mejorar los productos o servicios de Red Hat.',

    // Footer and feedback
    'footer.accuracy.label':
      'Siempre revisa el contenido generado por IA antes de usarlo.',
    'footer.accuracy.popover.title': 'Verificar precisión',
    'footer.accuracy.popover.description':
      'Si bien Developer Lightspeed se esfuerza por la precisión, siempre existe la posibilidad de errores. Es una buena práctica verificar información crítica de fuentes confiables, especialmente si es crucial para la toma de decisiones o acciones.',
    'footer.accuracy.popover.image.alt':
      'Imagen de ejemplo para el popover de nota al pie',
    'footer.accuracy.popover.cta.label': 'Entendido',
    'footer.accuracy.popover.link.label': 'Aprende más',

    // Common actions
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.readMore': 'Leer más',
    'common.noSearchResults': 'Ningún resultado coincide con la búsqueda',

    // Menu items
    'menu.newConversation': 'Nuevo Chat',

    // Chat-specific UI elements
    'chatbox.header.title': 'Developer Lightspeed',
    'chatbox.search.placeholder': 'Buscar',
    'chatbox.provider.other': 'Otro',
    'chatbox.emptyState.noPinnedChats': 'No hay chats fijados',
    'chatbox.emptyState.noRecentChats': 'No hay chats recientes',
    'chatbox.emptyState.noResults.title': 'No se encontraron resultados',
    'chatbox.emptyState.noResults.body':
      'Ajusta tu consulta de búsqueda e inténtalo de nuevo. Verifica tu ortografía o prueba un término más general.',
    'chatbox.welcome.greeting': 'Hola, {{userName}}',
    'chatbox.welcome.description': '¿Cómo puedo ayudarte hoy?',
    'chatbox.message.placeholder':
      'Envía un mensaje y opcionalmente sube un archivo JSON, YAML, o TXT...',
    'chatbox.fileUpload.failed': 'La carga del archivo falló',
    'chatbox.fileUpload.infoText':
      'Los tipos de archivo soportados son: .txt, .yaml, y .json. El tamaño máximo del archivo es 25 MB.',

    // Accessibility and ARIA labels
    'aria.chatbotSelector': 'Selector de chatbot',
    'aria.important': 'Importante',
    'aria.chatHistoryMenu': 'Menú de historial de chat',
    'aria.closeDrawerPanel': 'Cerrar panel lateral',
    'aria.search.placeholder': 'Buscar',
    'aria.searchPreviousConversations': 'Buscar chats anteriores',
    'aria.resize': 'Redimensionar',
    'aria.options.label': 'Opciones',
    'aria.scroll.down': 'Volver abajo',
    'aria.scroll.up': 'Volver arriba',
    'aria.settings.label': 'Opciones del chatbot',
    'aria.close': 'Cerrar chatbot',

    // Modal actions
    'modal.edit': 'Editar',
    'modal.save': 'Guardar',
    'modal.close': 'Cerrar',
    'modal.cancel': 'Cancelar',

    // Conversation actions
    'conversation.delete': 'Eliminar',
    'conversation.rename': 'Renombrar',
    'conversation.addToPinnedChats': 'Fijar',
    'conversation.removeFromPinnedChats': 'Desfijar',
    'conversation.announcement.userMessage':
      'Mensaje del Usuario: {{prompt}}. El mensaje del Bot está cargando.',

    // User states
    'user.guest': 'Invitado',
    'user.loading': '...',

    // Button tooltips and labels
    'tooltip.attach': 'Adjuntar',
    'tooltip.send': 'Enviar',
    'tooltip.microphone.active': 'Dejar de escuchar',
    'tooltip.microphone.inactive': 'Usar micrófono',
    'button.newChat': 'Nuevo chat',
    'tooltip.chatHistoryMenu': 'Menú de historial de chat',
    'tooltip.responseRecorded': 'Respuesta registrada',
    'tooltip.backToTop': 'Volver arriba',
    'tooltip.backToBottom': 'Volver abajo',
    'tooltip.settings': 'Opciones del chatbot',
    'tooltip.close': 'Cerrar',

    // Modal titles
    'modal.title.preview': 'Vista previa del adjunto',
    'modal.title.edit': 'Editar adjunto',

    // Alt texts for icons
    'icon.lightspeed.alt': 'icono de lightspeed',
    'icon.permissionRequired.alt': 'icono de permiso requerido',

    // Message utilities
    'message.options.label': 'Opciones',

    // File attachment errors
    'file.upload.error.alreadyExists': 'El archivo ya existe.',
    'file.upload.error.multipleFiles': 'Se subió más de un archivo.',
    'file.upload.error.unsupportedType':
      'Tipo de archivo no soportado. Los tipos soportados son: .txt, .yaml, y .json.',
    'file.upload.error.fileTooLarge':
      'El tamaño de tu archivo es demasiado grande. Por favor asegúrate de que tu archivo sea menor a 25 MB.',
    'file.upload.error.readFailed':
      'Error al leer el archivo: {{errorMessage}}',

    // Developer error messages
    'error.context.fileAttachment':
      'useFileAttachmentContext debe estar dentro de un FileAttachmentContextProvider',

    // Feedback actions
    'feedback.form.title': '¿Por qué elegiste esta calificación?',
    'feedback.form.textAreaPlaceholder':
      'Proporciona comentarios adicionales opcionales',
    'feedback.form.submitWord': 'Enviar',
    'feedback.tooltips.goodResponse': 'Buena Respuesta',
    'feedback.tooltips.badResponse': 'Mala Respuesta',
    'feedback.tooltips.copied': 'Copiado',
    'feedback.tooltips.copy': 'Copiar',
    'feedback.tooltips.listening': 'Escuchando',
    'feedback.tooltips.listen': 'Escuchar',
    'feedback.quickResponses.positive.helpful': 'Información útil',
    'feedback.quickResponses.positive.easyToUnderstand': 'Fácil de entender',
    'feedback.quickResponses.positive.resolvedIssue': 'Resolvió mi problema',
    'feedback.quickResponses.negative.didntAnswer': 'No respondió mi pregunta',
    'feedback.quickResponses.negative.hardToUnderstand': 'Difícil de entender',
    'feedback.quickResponses.negative.notHelpful': 'No fue útil',
    'feedback.completion.title': 'Feedback enviado',
    'feedback.completion.body':
      'Hemos recibido tu respuesta. ¡Gracias por compartir tu feedback!',

    // Conversation categorization
    'conversation.category.pinnedChats': 'Fijados',
    'conversation.category.recent': 'Recientes',

    // lightspeed settings
    'settings.pinned.enable': 'Habilitar chats fijados',
    'settings.pinned.disable': 'Deshabilitar chats fijados',
    'settings.pinned.enabled.description':
      'Los chats fijados están actualmente habilitados',
    'settings.pinned.disabled.description':
      'Los chats fijados están actualmente deshabilitados',

    // Tool calling
    'toolCall.header': 'Respuesta de herramienta: {{toolName}}',
    'toolCall.thinking': 'Pensó durante {{seconds}} segundos',
    'toolCall.executionTime': 'Tiempo de ejecución: ',
    'toolCall.parameters': 'Parámetros',
    'toolCall.response': 'Respuesta',
    'toolCall.showMore': 'mostrar más',
    'toolCall.showLess': 'mostrar menos',
    'toolCall.loading': 'Ejecutando herramienta...',
    'toolCall.executing': 'Ejecutando herramienta...',
    'toolCall.copyResponse': 'Copiar respuesta',
    'toolCall.summary': 'Aquí tienes un resumen de tu respuesta',
    'toolCall.mcpServer': 'Servidor MCP',
    // Display modes
    'settings.displayMode.label': 'Modo de visualización',
    'settings.displayMode.overlay': 'Superposición',
    'settings.displayMode.docked': 'Acoplar a ventana',
    'settings.displayMode.fullscreen': 'Pantalla completa',
    

    // Sort options
    'sort.label': 'Ordenar conversaciones',
    'sort.newest': 'Fecha (más reciente primero)',
    'sort.oldest': 'Fecha (más antiguo primero)',
    'sort.alphabeticalAsc': 'Nombre (A-Z)',
    'sort.alphabeticalDesc': 'Nombre (Z-A)',
  },
});

export default lightspeedTranslationEs;
