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

import { lightspeedTranslationRef } from './translationRef';

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
    'conversation.history.confirm.title': '¿Eliminar chat?',
    'conversation.history.confirm.message':
      'Ya no verás este chat aquí. Esto también eliminará la actividad relacionada como prompts, respuestas y comentarios de tu Actividad de Lightspeed.',
    'conversation.history.confirm.delete': 'Eliminar',

    // Permissions
    'permission.required.title': 'Permisos faltantes',
    'permission.required.description':
      'Para ver el plugin de lightspeed, contacta a tu administrador para que te dé los permisos <b>lightspeed.chat.read</b> y <b>lightspeed.chat.create</b>.',

    // Disclaimers
    'disclaimer.withValidation':
      'Developer Lightspeed puede responder preguntas sobre muchos temas usando tus modelos configurados. Las respuestas de Developer Lightspeed están influenciadas por la documentación de Red Hat Developer Hub, pero Developer Lightspeed no tiene acceso a tu Catálogo de Software, TechDocs o Plantillas, etc. Developer Lightspeed usa validación de preguntas (prompts) para asegurar que las conversaciones permanezcan enfocadas en temas técnicos relevantes para Red Hat Developer Hub, como Backstage, Kubernetes y OpenShift. No incluyas información personal o sensible en tu entrada. Las interacciones con Developer Lightspeed pueden ser revisadas y usadas para mejorar productos o servicios.',
    'disclaimer.withoutValidation':
      'Developer Lightspeed puede responder preguntas sobre muchos temas usando tus modelos configurados. Las respuestas de Developer Lightspeed están influenciadas por la documentación de Red Hat Developer Hub, pero Developer Lightspeed no tiene acceso a tu Catálogo de Software, TechDocs o Plantillas, etc. No incluyas información personal o sensible en tu entrada. Las interacciones con Developer Lightspeed pueden ser revisadas y usadas para mejorar productos o servicios.',

    // Footer and feedback
    'footer.accuracy.label':
      'Siempre verifica la precisión de las respuestas generadas por IA/LLM antes de usarlas.',
    'footer.accuracy.popover.title': 'Verificar precisión',
    'footer.accuracy.popover.description':
      'Si bien Developer Lightspeed se esfuerza por la precisión, siempre existe la posibilidad de errores. Es una buena práctica verificar información crítica de fuentes confiables, especialmente si es crucial para la toma de decisiones o acciones.',
    'footer.accuracy.popover.image.alt':
      'Imagen de ejemplo para el popover de nota al pie',
    'footer.accuracy.popover.cta.label': 'Entendido',
    'footer.accuracy.popover.link.label': 'Aprende más',

    // Common actions
    'common.cancel': 'Cancelar',

    // Menu items
    'menu.newConversation': 'Nuevo Chat',

    // Chat-specific UI elements
    'chatbox.header.title': 'Developer Lightspeed',
    'chatbox.search.placeholder': 'Buscar chats anteriores...',
    'chatbox.welcome.greeting': 'Hola, {{userName}}',
    'chatbox.welcome.description': '¿Cómo puedo ayudarte hoy?',
    'chatbox.message.placeholder':
      'Envía un mensaje y opcionalmente sube un archivo JSON, YAML, TXT o XML...',
    'chatbox.fileUpload.failed': 'La carga del archivo falló',
    'chatbox.fileUpload.infoText':
      'Los tipos de archivo soportados son: .txt, .yaml, .json y .xml. El tamaño máximo del archivo es 25 MB.',

    // Accessibility and ARIA labels
    'aria.chatbotSelector': 'Selector de chatbot',
    'aria.important': 'Importante',

    // Modal actions
    'modal.edit': 'Editar',
    'modal.save': 'Guardar',
    'modal.close': 'Cerrar',
    'modal.cancel': 'Cancelar',

    // Conversation actions
    'conversation.delete': 'Eliminar',
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
      'Tipo de archivo no soportado. Los tipos soportados son: .txt, .yaml, .json y .xml.',
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
    'conversation.category.today': 'Hoy',
    'conversation.category.yesterday': 'Ayer',
    'conversation.category.previous7Days': 'Últimos 7 días',
    'conversation.category.previous30Days': 'Últimos 30 días',
  },
});

export default lightspeedTranslationEs;
