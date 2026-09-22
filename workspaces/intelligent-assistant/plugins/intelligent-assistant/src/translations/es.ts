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

import { intelligentAssistantTranslationRef } from './ref';

/**
 * es translation for plugin.intelligent-assistant.
 * @public
 */
const intelligentAssistantTranslationEs = createTranslationMessages({
  ref: intelligentAssistantTranslationRef,
  messages: {
    'aria.chatHistoryMenu': 'Menú del historial de chat',
    'modelSelector.visionScreenshot.line1': 'Análisis de imágenes compatible.',
    'modelSelector.visionScreenshot.line2':
      'Se incluirá una captura de pantalla con su mensaje.',
    'modelSelector.visionScreenshot.ariaLabel':
      'Contexto de captura de pantalla del modelo de visión',
    'modelSelector.disabledTooltip':
      'Cada sesión de chat admite un solo modelo. Para cambiar de modelo, abra un nuevo chat.',
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
    'chatbox.emptyState.noPinnedChats':
      'Fijar los chats para mantenerlos en la parte superior',
    'chatbox.emptyState.noRecentChats': 'No hay chats recientes',
    'chatbox.emptyState.noResults.body':
      'Ajuste su solicitud de búsqueda y vuelva a intentarlo. Revise la ortografía o pruebe con un término más general.',
    'chatbox.emptyState.noResults.title': 'No se encontraron resultados',
    'chatbox.fileUpload.failed': 'Error al cargar el archivo',
    'chatbox.fileUpload.infoText':
      'Los tipos de archivo admitidos son .txt, .yaml y .json. El tamaño máximo del archivo es de 25 MB.',
    'chatbox.header.title': 'Asistente inteligente de Developer Hub',
    'chatbox.message.placeholder': 'Enviar mensaje',
    'chatbox.provider.other': 'Otro',
    'chatbox.search.placeholder': 'Buscar',
    'chatbox.welcome.description': '¿Cómo puedo ayudar hoy?',
    'chatbox.welcome.greeting': 'Hola, {{userName}}',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.loading': 'Cargando',
    'common.noSearchResults': 'Ningún resultado coincide con la búsqueda',
    'common.readMore': 'Leer más',
    'common.retry': 'Intentar de nuevo',
    'conversation.addToPinnedChats': 'Fijar',
    'conversation.announcement.responseStopped': 'La respuesta se detuvo.',
    'conversation.announcement.userMessage':
      'Mensaje del usuario: {{prompt}}. El mensaje del bot se está cargando.',
    'conversation.category.pinnedChats': 'Chats fijados',
    'conversation.category.recent': 'Chats',
    'conversation.category.savedPrompts': 'Prompts guardados',
    'conversation.delete': 'Eliminar',
    'conversation.delete.confirm.action': 'Eliminar',
    'conversation.delete.confirm.message':
      'Ya no verás este chat aquí. Esto también eliminará la actividad relacionada, como las indicaciones, las respuestas y los comentarios, de su actividad.',
    'conversation.delete.confirm.title': '¿Eliminar "{{chatName}}"?',
    'conversation.removeFromPinnedChats': 'Quitar fijación',
    'conversation.rename': 'Cambiar el nombre',
    'conversation.rename.confirm.action': 'Cambiar el nombre',
    'conversation.rename.confirm.title': '¿Cambiar el nombre del chat?',
    'conversation.rename.placeholder': 'Nombre del chat',
    disclaimer:
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
      'El tamaño del archivo es demasiado grande. Asegúrese de que el archivo tenga menos de 25 MB.',
    'file.upload.error.multipleFiles': 'Subió más de un archivo.',
    'file.upload.error.readFailed':
      'No se pudo leer el archivo: {{errorMessage}}',
    'file.upload.error.unsupportedType':
      'Tipo de archivo no compatible. Los tipos de archivo admitidos son .txt, .yaml y .json.',
    'footer.accuracy.label':
      'Revise siempre el contenido generado con IA antes de usarlo.',
    'icon.lightspeed.alt': 'icono de asistente inteligente',
    'lcore.loadError.description':
      'El back-end del asistente inteligente no devolvió una lista de modelos. Compruebe que el servicio esté en funcionamiento y que pueda accederse a él y, luego, vuelva a intentarlo.',
    'lcore.loadError.title': 'No se pudieron cargar los modelos',
    'lcore.notConfigured.backendDocs':
      'Configuración de back-end del asistente inteligente',
    'lcore.notConfigured.description':
      'El asistente inteligente requiere un LLM registrado. Comuníquese con el administrador de la plataforma de su organización para completar la configuración.',
    'lcore.notConfigured.developerLightspeedDocs':
      'Configuración del asistente inteligente de Developer Hub',
    'lcore.notConfigured.title': 'Conecte un LLM para comenzar',
    'mcp.settings.closeAriaLabel': 'Cerrar configuración de MCP',
    'mcp.settings.closeConfigureModalAriaLabel':
      'Cerrar modal de configuración',
    'mcp.settings.configureServerTitle':
      'Configuración del servidor MCP {{serverName}}',
    'mcp.settings.edit': 'Modificar',
    'mcp.settings.editServerAriaLabel': 'Modificar {{serverName}}',
    'mcp.settings.enabled': 'Activado',
    'mcp.settings.enterToken': 'Ingresar su token',
    'mcp.settings.loading': 'Cargando servidores MCP…',
    'mcp.settings.modalDescription':
      'Las credenciales están cifradas y las operaciones utilizan los permisos asignados a su usuario.',
    'mcp.settings.modalDescriptionDcr':
      'Este servidor utiliza el Registro dinámico de clientes (DCR). Los tokens se generan automáticamente mediante su identidad de Backstage; no se necesita ningún token manual.',
    'mcp.settings.authenticationToken': 'Token de autenticación',
    'mcp.settings.modal.authenticationHeading': 'Autenticación',
    'mcp.settings.modal.credentialMode.organization':
      'Usar token predeterminado de la organización',
    'mcp.settings.modal.credentialMode.organizationDescription':
      'Usa el token configurado por su administrador.',
    'mcp.settings.modal.credentialMode.personal': 'Usar token personal',
    'mcp.settings.modal.toolsHeading': 'Herramientas ({{count}})',
    'mcp.settings.modal.loadingTools': 'Cargando herramientas…',
    'mcp.settings.modal.fetchingStatus': 'Extrayendo estado…',
    'mcp.settings.modal.loadingStatus': 'Desconectando…',
    'mcp.settings.modal.tokenRemovedWarning':
      'El token se eliminó. Para volver a utilizar este servidor MCP, proporcione un nuevo token.',
    'mcp.settings.modal.noToolsAvailable': 'No hay herramientas disponibles.',
    'mcp.settings.modal.toolsLoadFailed':
      'No se pudieron cargar las herramientas.',
    'mcp.settings.modal.enabledDescription':
      'Este servidor está activo y disponible en el chat.',
    'mcp.settings.modal.enabledDescriptionOff':
      'Este servidor está deshabilitado y no está disponible en el chat.',
    'mcp.settings.modal.enabledDescriptionTokenRequired':
      'Este servidor está actualmente deshabilitado. Proporcione un token para habilitarlo.',
    'mcp.settings.name': 'Nombre',
    'mcp.settings.noneAvailable': 'No hay servidores MCP disponibles.',
    'mcp.settings.personalAccessToken': 'Token de acceso personal',
    'mcp.settings.removePersonalToken': 'Eliminar token personal',
    'mcp.settings.savedToken': 'Token guardado',
    'mcp.settings.selectedCount':
      '{{selectedCount}} de {{totalCount}} seleccionados',
    'mcp.settings.status': 'Estado',
    'mcp.settings.status.disabled': 'Deshabilitado',
    'mcp.settings.status.failed': 'Fallido',
    'mcp.settings.status.manyTools': '{{count}} herramientas',
    'mcp.settings.status.oneTool': '{{count}} herramienta',
    'mcp.settings.status.tokenRequired': 'Se requiere token',
    'mcp.settings.status.unknown': 'Desconocido',
    'mcp.settings.tableAriaLabel': 'Tabla de servidores MCP',
    'mcp.settings.title': 'Servidores MCP',
    'mcp.settings.toggleServerAriaLabel': 'Alternar {{serverName}}',
    'mcp.settings.token.clearAriaLabel': 'Borrar entrada de token',
    'mcp.settings.token.connectionSuccessful': 'Conexión exitosa',
    'mcp.settings.token.invalidCredentials':
      'Credenciales no válidas. Verifique el URL del servidor y el token.',
    'mcp.settings.token.savingAndValidating': 'Guardando y validando token…',
    'mcp.settings.token.urlUnavailableForValidation':
      'No se pudo validar el token porque el URL del servidor no está disponible.',
    'mcp.settings.token.validating': 'Validando token…',
    'mcp.settings.token.validationFailed':
      'No se pudo validar. Verifique el URL del servidor y el token.',
    'menu.newConversation': 'Nuevo chat',
    'message.options.label': 'Opciones',
    'modal.cancel': 'Cancelar',
    'modal.close': 'Cerrar',
    'modal.edit': 'Modificar',
    'modal.save': 'Guardar',
    'modal.title.edit': 'Modificar archivo adjunto',
    'modal.title.preview': 'Previsualizar archivo adjunto',
    'notebook.document.rename': 'Cambiar el nombre',
    'notebook.document.rename.tooltip': 'Hacer clic para cambiar el nombre',
    'notebook.document.rename.error':
      'No se pudo cambiar el nombre de "{{documentName}}".',
    'notebook.document.rename.conflict': 'El nombre ya existe.',
    'notebook.document.rename.tooLong':
      'El nombre es demasiado largo (máximo 255).',
    'notebook.document.delete': 'Eliminar',
    'notebook.document.delete.action': 'Eliminar',
    'notebook.document.delete.description':
      '¿Está seguro de que quiere eliminar <documentName/> de este cuaderno? Esta acción no se puede deshacer.',
    'notebook.document.delete.success':
      '"{{documentName}}" eliminado correctamente.',
    'notebook.document.delete.title': '¿Eliminar recurso?',
    'notebook.overwrite.modal.action': 'Cargar ({{count}})',
    'notebook.overwrite.modal.back': 'Atrás',
    'notebook.overwrite.modal.description':
      'Ya existen {{duplicateCount}} archivos en este cuaderno. Se agregarán {{newCount}} nuevos recursos de todos modos.',
    'notebook.overwrite.modal.ignore': 'Ignorar archivos duplicados',
    'notebook.overwrite.modal.replace': 'Reemplazar archivos existentes',
    'notebook.overwrite.modal.title': 'El archivo ya existe',
    'notebook.overwrite.modal.title.one': 'El archivo ya existe',
    'notebook.overwrite.modal.title.other': 'Los archivos ya existen',
    'notebook.overwrite.modal.description.one':
      'Ya existe {{duplicateCount}} archivo en este cuaderno. Se agregarán {{newCount}} nuevos recursos de todos modos.',
    'notebook.overwrite.modal.description.other':
      'Ya existen {{duplicateCount}} archivos en este cuaderno. Se agregarán {{newCount}} nuevos recursos de todos modos.',
    'notebook.upload.error.fileTooLarge':
      'Error de carga: el tamaño del archivo supera el límite de 25 MB.',
    'notebook.upload.error.tooManyFiles':
      'Error de carga: se permite un máximo de {{max}} archivos.',
    'notebook.upload.error.unsupportedType':
      'Error de carga: se encontraron tipos de archivo no compatibles. Cargue solo archivos de tipos compatibles.',
    'notebook.upload.failed': 'No se pudo cargar "{{fileName}}".',
    'notebook.upload.modal.addButton': 'Agregar ({{count}})',
    'notebook.upload.modal.addButtonEmpty': 'Agregar',
    'notebook.upload.modal.browseButton': 'Cargar',
    'notebook.upload.modal.dragDropTitle':
      'Arrastre y suelte los archivos aquí, o haga clic para explorar',
    'notebook.upload.modal.infoText':
      'Tipos de archivo aceptados: .md, .txt, .pdf, .json, .yaml, .log',
    'notebook.upload.modal.maxFileSize':
      'El tamaño máximo del archivo es de 25 MB.',
    'notebook.upload.modal.supportedFormats': 'Formatos compatibles:',
    'notebook.upload.modal.removeFile': 'Eliminar {{fileName}}',
    'notebook.upload.modal.selectedFiles':
      '{{count}} de {{max}} archivos seleccionados',
    'notebook.upload.modal.separator': 'o',
    'notebook.upload.modal.title': 'Agregar recursos',
    'notebook.view.close': 'Cerrar cuaderno',
    'notebook.view.documents.add': 'Agregar',
    'notebook.view.documents.count_one': '{{count}} recurso',
    'notebook.view.documents.count_other': '{{count}} recursos',
    'notebook.view.documents.maxReached':
      'Se permite un máximo de 10 recursos. Para subir un nuevo recurso, elimine uno existente.',
    'notebook.view.documents.uploading': 'Cargando recurso',
    'notebook.view.documents.uploadsInProgress':
      'Espere a que finalicen las cargas actuales antes de agregar más recursos.',
    'notebook.view.input.disabledTooltip':
      'Seleccione al menos un recurso cargado para comenzar a chatear',
    'notebook.view.input.placeholder': 'Preguntar por los recursos…',
    'notebook.view.sidebar.collapse': 'Contraer barra lateral',
    'notebook.view.sidebar.expand': 'Expandir barra lateral',
    'notebook.view.sidebar.resize': 'Cambiar el tamaño de la barra lateral',
    'notebook.view.title': 'Cuaderno sin título',
    'notebook.view.upload.action': 'Agregar un recurso',
    'notebook.view.processing.description':
      'Sus archivos están siendo indexados. Podrá empezar a hacer preguntas cuando termine el procesamiento.',
    'notebook.view.processing.heading': 'Procesando recursos…',
    'notebook.view.upload.heading': 'Agregar un recurso para empezar',
    'notebooks.actions.delete': 'Eliminar',
    'notebooks.actions.rename': 'Cambiar el nombre',
    'notebooks.card.openAria': 'Abrir el cuaderno {{name}}',
    'notebooks.delete.action': 'Eliminar',
    'notebooks.delete.message':
      'Este cuaderno ya no aparecerá aquí. Esto también eliminará la actividad relacionada, como las indicaciones, las respuestas y los comentarios, de su actividad.',
    'notebooks.delete.title': '¿Desea eliminar {{name}}?',
    'notebooks.delete.toast': 'Cuaderno eliminado',
    'notebooks.documents_one': '{{count}} recurso',
    'notebooks.documents_other': '{{count}} recursos',
    'notebooks.empty.action': 'Crear un nuevo cuaderno',
    'notebooks.empty.description':
      'Cree un nuevo cuaderno para organizar sus fuentes y generar información valiosa mediante IA.',
    'notebooks.empty.title': 'No se han creado cuadernos',
    'notebooks.prompts.accessIssue.title': 'Ayúdame con un problema de acceso',
    'notebooks.prompts.coreConcepts.title':
      '¿Cuáles son los conceptos básicos?',
    'notebooks.prompts.vulnerabilities.title':
      'Muestra mis vulnerabilidades críticas',
    'notebooks.rename.inline.tooltip': 'Hacer clic para cambiar el nombre',
    'notebooks.rename.inline.error':
      'No se pudo cambiar el nombre de "{{notebookName}}".',
    'notebooks.title': 'Mis cuadernos',
    'notebooks.updated.days': 'Actualizado hace {{days}} días',
    'notebooks.updated.on': 'Actualizado el',
    'notebooks.updated.today': 'Actualizado hoy',
    'notebooks.updated.yesterday': 'Actualizado hace 1 día',
    'page.subtitle': 'Asistente de desarrollo con tecnología de IA',
    'page.title': 'Asistente inteligente',
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
    'settings.panel.title': 'Configuración',
    'settings.mcp.label': 'Configuración de MCP',
    'settings.prompt.label': 'Configuración de Prompts',
    'settings.pinned.disable': 'Deshabilitar chats fijados',
    'settings.pinned.disabled.description':
      'Los chats fijados están deshabilitados actualmente',
    'settings.pinned.enable': 'Habilitar chats fijados',
    'settings.pinned.enabled.description':
      'Los chats fijados están habilitados actualmente',
    'settings.savedPrompts.disable': 'Deshabilitar prompts guardados',
    'settings.savedPrompts.disabled.description':
      'Los prompts guardados están deshabilitados actualmente',
    'settings.savedPrompts.enable': 'Habilitar prompts guardados',
    'settings.savedPrompts.enabled.description':
      'Los prompts guardados están habilitados actualmente',
    'settings.screenContext.enable': 'Habilitar contexto de pantalla',
    'settings.screenContext.disable': 'Deshabilitar contexto de pantalla',
    'settings.screenContext.enabled.description':
      'El uso compartido del contexto de pantalla está habilitado actualmente',
    'settings.screenContext.disabled.description':
      'El uso compartido del contexto de pantalla está deshabilitado actualmente',
    'contextChip.label.paused': 'Contexto: en pausa',
    'contextChip.label.unavailable': 'Contexto: no disponible',
    'contextChip.label.softwareTemplates': 'Plantillas de software',
    'contextChip.tooltip.askAbout': 'Pregunte sobre {{label}}.',
    'contextChip.tooltip.template':
      'Pregunte cómo completar la plantilla {{label}}.',
    'contextChip.tooltip.search': 'Pregunte sobre su búsqueda: {{label}}.',
    'contextChip.tooltip.paused':
      'El contexto de pantalla está en pausa. Haga clic para reanudar el uso compartido de su pantalla actual con el asistente inteligente.',
    'contextChip.tooltip.unavailable':
      'El contexto de pantalla no está disponible en modo de pantalla completa. Cambie al modo Superposición o Anclar a la ventana para habilitarlo.',
    'contextChip.tooltip.line2.fullContext':
      'El texto de la página y una captura de pantalla se enviarán con su mensaje.',
    'contextChip.tooltip.line2.adminLimited':
      'El uso compartido del contexto de pantalla está limitado por la configuración del administrador.',
    'contextChip.tooltip.line2.screenshotOnly':
      'La extracción de texto está deshabilitada por su administrador. Solo captura de pantalla.',
    'contextChip.tooltip.line2.domOffNoVision':
      'La extracción de texto está deshabilitada por su administrador. Su modelo no admite el análisis de imágenes.',
    'contextChip.tooltip.line2.textOnlyNoVision':
      'Solo contexto de texto: su modelo no admite el análisis de imágenes.',
    'contextChip.tooltip.line2.textOnlyAdminScreenshotsOff':
      'Solo contexto de texto: la captura de pantalla está deshabilitada por su administrador.',
    'contextChip.tooltip.line2.textOnlyCombined':
      'Solo contexto de texto: su modelo no admite el análisis de imágenes y la captura de pantalla está deshabilitada por su administrador.',
    'contextChip.aria.pause': 'Pausar contexto de pantalla: {{label}}',
    'contextChip.aria.resume': 'Reanudar contexto de pantalla',
    'savedPrompts.tab.title': 'Prompts guardados',
    'savedPrompts.disabled.title': 'Los prompts guardados están deshabilitados',
    'savedPrompts.disabled.body':
      'Los prompts guardados están ocultos en el panel del historial de chat. Habilítelos para mostrar sus prompts en la barra lateral.',
    'savedPrompts.disabled.enableLink': 'Habilitar prompts guardados',
    'savedPrompts.count.zero': 'Sin prompts',
    'savedPrompts.count_one': '1 prompt',
    'savedPrompts.count_other': '{{count}} prompts',
    'savedPrompts.newPrompt': '+ Nuevo prompt',
    'savedPrompts.form.titleLabel': 'Título',
    'savedPrompts.form.titlePlaceholder': 'Título del prompt',
    'savedPrompts.form.contentLabel': 'Prompt',
    'savedPrompts.form.contentPlaceholder': 'Contenido del prompt',
    'savedPrompts.form.save': 'Guardar',
    'savedPrompts.form.cancel': 'Cancelar',
    'savedPrompts.validation.titleMaxLength':
      'El título debe tener {{max}} caracteres o menos.',
    'savedPrompts.validation.contentMaxLength':
      'El prompt debe tener {{max}} caracteres o menos.',
    'savedPrompts.limitReached':
      'Se alcanzó el límite de prompts. Elimine un prompt existente para crear uno nuevo.',
    'savedPrompts.actions.apply': 'Aplicar en el cuadro de entrada',
    'savedPrompts.actions.send': 'Enviar directamente',
    'savedPrompts.actions.sendDisabledStreaming':
      'Espere a que finalice la respuesta',
    'savedPrompts.actions.delete': 'Eliminar',
    'savedPrompts.actions.menuAriaLabel': 'Acciones para {{name}}',
    'savedPrompts.delete.confirm.title': '¿Eliminar «{{name}}»?',
    'savedPrompts.delete.confirm.message':
      'Este prompt guardado se eliminará permanentemente.',
    'savedPrompts.delete.confirm.action': 'Eliminar',
    'savedPrompts.empty.description':
      'Guarde los prompts que usa con frecuencia para reutilizarlos rápidamente en sus conversaciones sin volver a escribirlos. Los prompts guardados también aparecen en el panel del historial del chat para un acceso rápido.',
    'savedPrompts.sidebar.showAll': 'Mostrar todo',
    'savedPrompts.sidebar.showLess': 'Mostrar menos',
    'savedPrompts.sidebar.openSettings':
      'Abrir configuración de prompts guardados',
    'savedPrompts.sidebar.empty': 'Aún no hay prompts guardados',
    'sort.alphabeticalAsc': 'Nombre (A-Z)',
    'sort.alphabeticalDesc': 'Nombre (Z-A)',
    'sort.label': 'Ordenar conversaciones',
    'sort.newest': 'Fecha (la más reciente primero)',
    'sort.oldest': 'Fecha (la más antigua primero)',
    'sources.chip.label_one': '{{count}} fuente',
    'sources.chip.label_other': '{{count}} fuentes',
    'sources.modal.description':
      'Las siguientes fuentes se utilizaron para generar esta respuesta de IA y proporcionar información de respaldo:',
    'sources.modal.title': 'Fuentes',
    'sources.popover.closeAriaLabel': 'Cerrar fuentes',
    'tabs.ariaLabel': 'Vistas del asistente inteligente',
    'tabs.chat': 'Chatear',
    'tabs.notebooks': 'Cuadernos',
    'tabs.notebooks.devPreview': 'Vista previa para desarrolladores',
    'tabs.notebooks.empty': 'Aquí va el contenido de los cuadernos.',
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
    'toolCall.thinking': 'Pensó durante {{seconds}} segundos',
    'tooltip.attach': 'Adjuntar',
    'tooltip.backToBottom': 'Volver al final',
    'tooltip.backToTop': 'Volver arriba',
    'tooltip.chatHistoryMenu': 'Menú del historial de chat',
    'tooltip.close': 'Cerrar',
    'tooltip.collapseHistoryPanel': 'Contraer el historial de chat',
    'tooltip.expandHistoryPanel': 'Ampliar el historial de chat',
    'tooltip.fab.close': 'Cerrar asistente inteligente',
    'tooltip.fab.open': 'Abrir asistente inteligente',
    'tooltip.microphone.active': 'Dejar de escuchar',
    'tooltip.microphone.inactive': 'Usar micrófono',
    'tooltip.quickNewChat': 'Nuevo chat',
    'tooltip.responseRecorded': 'Respuesta grabada',
    'tooltip.send': 'Enviar',
    'tooltip.settings': 'Opciones de chatbot',
    'user.guest': 'Invitado',
    'user.loading': '...',
  },
});

export default intelligentAssistantTranslationEs;
