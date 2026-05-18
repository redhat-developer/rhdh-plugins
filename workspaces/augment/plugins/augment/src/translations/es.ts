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
import { augmentTranslationRef } from './ref';

/**
 * es translation for plugin.augment.
 * @public
 */
const augmentTranslationEs = createTranslationMessages({
  ref: augmentTranslationRef,
  messages: {
    'adminOnboarding.adminAccessMessage':
      'Tiene acceso administrativo. ¿Cómo le gustaría comenzar?',
    'adminOnboarding.continueToChat': 'Continuar al chat',
    'adminOnboarding.continueToChatDescription':
      'Utilice el asistente de IA para las conversaciones',
    'adminOnboarding.openCommandCenter': 'Centro de comandos abierto',
    'adminOnboarding.openCommandCenterDescription':
      'Administrar la base de conocimientos, las indicaciones y la configuración',
    'adminOnboarding.switchHint':
      'Puede cambiar de modo en cualquier momento con el botón Centro de comandos en la barra lateral.',
    'adminOnboarding.welcomeAdmin': 'Bienvenido, administrador',
    'agentInfo.connecting': 'Conectando…',
    'agentInfo.defaultAgent': 'Agente predeterminado',
    'agentInfo.mcpConnected': 'Conectado: {{url}} · {{toolCount}} herramientas',
    'agentInfo.mcpDisconnected': 'Desconectado',
    'agentInfo.mcpServers': 'Servidores MCP ({{connected}}/{{total}})',
    'agentInfo.offline': 'Fuera de línea',
    'agentInfo.ready': 'Listo',
    'agentInfo.team': 'Equipo ({{count}})',
    'agentInfo.title': 'Información del agente',
    'agentInfo.vectorRag': 'RAG vectorial',
    'agentInfo.vectorStoreId': 'Tienda de vectores: {{id}}',
    'agentInfo.vectorStoreUnavailable':
      'Tienda de vectores no disponible (opcional)',
    'agentsPanel.adminModified': 'Modificado',
    'agentsPanel.advanced': 'Avanzado',
    'agentsPanel.agentInstructions': 'Instrucciones para el agente',
    'agentsPanel.applyTemplate': 'Aplicar plantilla:',
    'agentsPanel.basePrompt': 'Indicador base',
    'agentsPanel.canDelegateTo': 'Puede delegar en',
    'agentsPanel.canTransferTo': 'Se puede transferir a',
    'agentsPanel.capabilities': 'Capacidades',
    'agentsPanel.codeInterpreter': 'Intérprete de código',
    'agentsPanel.confirmRemoveButton': 'Eliminar',
    'agentsPanel.confirmRemoveMessage':
      'Se eliminará este agente. Se quitarán las referencias de otros agentes a este agente. No se guardará hasta que haga clic en Guardar.',
    'agentsPanel.confirmRemoveTitle': '¿Desea quitar {{name}}?',
    'agentsPanel.confirmResetButton': 'Reiniciar',
    'agentsPanel.confirmResetMessage':
      'Esto descartará todas las personalizaciones de administrador y restaurará los valores predeterminados. Esto no se puede deshacer.',
    'agentsPanel.confirmResetTitle':
      '¿Desea restablecer los valores predeterminados?',
    'agentsPanel.connections': 'Conexiones',
    'agentsPanel.createFirstAgent': 'Cree su primer agente',
    'agentsPanel.createModal.agentId': 'ID de agente',
    'agentsPanel.createModal.agentIdExists': 'Este ID ya existe.',
    'agentsPanel.createModal.agentIdHint':
      'Generado automáticamente a partir del nombre.',
    'agentsPanel.createModal.cancel': 'Cancelar',
    'agentsPanel.createModal.createButton': 'Crear agente',
    'agentsPanel.createModal.displayName': 'Nombre para mostrar',
    'agentsPanel.createModal.displayNamePlaceholder':
      'p. ej., agente de soporte',
    'agentsPanel.createModal.subtitle':
      'Asigne un nombre a su agente y, de manera opcional, seleccione una plantilla para completar previamente la configuración.',
    'agentsPanel.createModal.templateTitle':
      'Comenzar a partir de una plantilla',
    'agentsPanel.createModal.title': 'Crear nuevo agente',
    'agentsPanel.delegates': 'delegados',
    'agentsPanel.deleteAgent': 'Eliminar agente',
    'agentsPanel.inConnections': '{{count}} entrantes',
    'agentsPanel.inheritBasePrompt': 'Indicación de herencia base',
    'agentsPanel.instructions': 'Instrucciones',
    'agentsPanel.maxTurns': 'Máximo de turnos',
    'agentsPanel.mcpServers': 'Servidores MCP',
    'agentsPanel.modelOverride': 'Anulación del modelo',
    'agentsPanel.modelOverrideHint': 'Dejar en blanco para el modelo global',
    'agentsPanel.newAgent': 'Nuevo agente',
    'agentsPanel.noAgentsSubtitle':
      'Cree su primer agente para comenzar con la orquestación multiagente.',
    'agentsPanel.noAgentsTitle': 'No hay agentes configurados',
    'agentsPanel.outConnections': '{{count}} salientes',
    'agentsPanel.rag': 'Base de conocimientos',
    'agentsPanel.reset': 'Reiniciar',
    'agentsPanel.save': 'Guardar',
    'agentsPanel.saveSuccess': 'Se guardó la configuración.',
    'agentsPanel.saved': 'Guardadas',
    'agentsPanel.selectAgent': 'Seleccione un agente de la lista',
    'agentsPanel.startingAgent': 'Agente inicial',
    'agentsPanel.topology': 'Topología',
    'agentsPanel.transfers': 'transferencias',
    'agentsPanel.webSearch': 'Búsqueda web',
    'chat.cancelEdit': 'Cancelar edición',
    'chat.copiedToClipboard': '¡Copiado!',
    'chat.copyResponse': 'Copiar respuesta',
    'chat.disclaimer':
      'Es posible que las respuestas generadas con IA no sean exactas. Verifique la información importante.',
    'chat.editMessage': 'Editar mensaje',
    'chat.emptySessionHint': 'Pregunte lo que desee, estoy aquí para ayudarlo.',
    'chat.emptySessionTitle': 'Iniciar una conversación',
    'chat.messagesUnavailableHint':
      'Es posible que el historial de la conversación haya caducado. Puede continuar si envía un nuevo mensaje.',
    'chat.messagesUnavailableTitle':
      'Los mensajes anteriores ya no están disponibles',
    'chat.regenerateResponse': 'Volver a generar respuesta',
    'chat.submitEdit': 'Enviar edición',
    'chat.you': 'Usted',
    'chatInput.attachFile': 'Adjuntar archivo',
    'chatInput.chatMessageInput': 'Entrada de mensaje de chat',
    'chatInput.newConversation': 'Nueva conversación',
    'chatInput.newConversationShortcut': 'Nueva conversación (⌘⇧O)',
    'chatInput.sendMessage': 'Enviar mensaje',
    'chatInput.startNewConversation': 'Iniciar una nueva conversación',
    'chatInput.stopGeneration': 'Detener generación',
    'chatInput.stopMessageGeneration': 'Detener generación de mensajes',
    'commandCenter.agents': 'Agentes',
    'commandCenter.backToChat': 'Volver al chat',
    'commandCenter.branding': 'Marca',
    'commandCenter.platform': 'Modelo y herramientas',
    'commandCenter.title': 'Centro de comandos',
    'confirmDialog.cancel': 'Cancelar',
    'confirmDialog.confirm': 'Confirmar',
    'conversationHistory.allUsers': 'De todos los usuarios',
    'conversationHistory.cancel': 'Cancelar',
    'conversationHistory.clearSearch': 'Borrar búsqueda',
    'conversationHistory.delete': 'Eliminar',
    'conversationHistory.deleteConversation': 'Eliminar conversación',
    'conversationHistory.mine': 'Mío',
    'conversationHistory.noConversationsYet':
      'Sus conversaciones aparecerán aquí',
    'conversationHistory.noMatchingConversations':
      'No se encontraron conversaciones que coincidieran con “{{query}}”',
    'conversationHistory.older': 'Anterior',
    'conversationHistory.refresh': 'Actualizar',
    'conversationHistory.refreshAriaLabel':
      'Actualizar el historial de conversaciones',
    'conversationHistory.searchPlaceholder': 'Buscar conversaciones…',
    'conversationHistory.startChatting': 'Inicie una conversación para empezar',
    'conversationHistory.thisWeek': 'Esta semana',
    'conversationHistory.title':
      '{{count}} conversación{{suffix}} • {{appName}}',
    'conversationHistory.today': 'Hoy',
    'conversationHistory.yesterday': 'Ayer',
    'errors.connectionError': 'Error de conexión',
    'errors.contentFiltered': 'Contenido filtrado',
    'errors.copied': '¡Copiado!',
    'errors.copyErrorDetails': 'Copiar detalles del error',
    'errors.error': 'Error',
    'errors.networkHint':
      'Se perdió la conexión con el servidor. Compruebe su conexión de red y vuelva a internarlo.',
    'errors.safetyHint':
      'Se bloqueó esta respuesta por una política de seguridad. Intente reformular la solicitud.',
    'errors.tryAgain': 'Intentar de nuevo',
    'keyboardShortcuts.approvalSection': 'Aprobación de herramientas',
    'keyboardShortcuts.approveTool': 'Aprobar la ejecución de la herramienta',
    'keyboardShortcuts.cancelStreaming': 'Cancelar respuesta de transmisión',
    'keyboardShortcuts.chatSection': 'Chatear',
    'keyboardShortcuts.close': 'Cerrar',
    'keyboardShortcuts.focusChatInput': 'Poner el foco en la entrada de chat',
    'keyboardShortcuts.newConversation': 'Nueva conversación',
    'keyboardShortcuts.rejectTool': 'Rechazar la ejecución de la herramienta',
    'keyboardShortcuts.showHelp': 'Mostrar esta ayuda',
    'keyboardShortcuts.title': 'Combinaciones de teclas',
    'providerOffline.backendUnreachable':
      '{{appName}} temporalmente no está disponible. Seguiremos intentándolo.',
    'providerOffline.modelUnreachable':
      'Actualmente, el modelo de IA no está disponible. Es posible que fallen los mensajes hasta que se restablezca la conexión.',
    'providerOffline.title': 'Asistente no disponible',
    'ragSources.collapseKnowledgeSources':
      'Contraer fuentes de la base de conocimientos',
    'ragSources.expandKnowledgeSources':
      'Expandir fuentes de la base de conocimientos',
    'ragSources.sourcesFromVectorRag':
      '{{count}} fuente(s) de la base de conocimientos',
    'ragSources.unknownSource': 'Fuente desconocida',
    'rightPane.admin': 'Administrador',
    'rightPane.collapse': 'Contraer',
    'rightPane.collapseSidebar': 'Contraer barra lateral',
    'rightPane.commandCenter': 'Centro de comandos',
    'rightPane.expand': 'Expandir',
    'rightPane.expandSidebar': 'Expandir barra lateral',
    'rightPane.openCommandCenter': 'Centro de comandos abierto',
    'rightPane.scrollToBottom': 'Desplácese hacia abajo',
    'securityGate.accessDenied': 'Acceso denegado',
    'securityGate.accessDeniedMessage':
      'No tienes permiso para acceder a {{appName}}. Comuníquese con su administrador para solicitar acceso.',
    'securityGate.configurationErrorLabel': 'Problema de configuración',
    'securityGate.configurationErrors':
      '{{appName}} no está configurada correctamente. Solucione los siguientes problemas:',
    'securityGate.configurationHint':
      'Tras actualizar la configuración, reinicie el servidor backend.',
    'securityGate.configurationRequired': 'Se requiere configuración',
    'streaming.connectingWith': 'Conectando con {{agentName}}',
    'streaming.done': 'Hecho',
    'streaming.executingTools': 'Trabajando en ello',
    'streaming.needsApproval': 'Esperando su aprobación',
    'streaming.processing': 'En proceso…',
    'streaming.responding': 'Respondiendo',
    'streaming.searching': 'Buscando',
    'streaming.thinking': 'Pensando',
    'streaming.thinkingEllipsis': 'Pensando…',
    'streaming.thoughtFor': 'Pensé durante {{seconds}} segundo{{suffix}}',
    'streaming.working': 'Trabajando',
    'switchDialog.message':
      'Actualmente se está generando una respuesta. Cambiar de conversación cancelará la respuesta en curso. ¿Desea continuar?',
    'switchDialog.stay': 'Permanecer',
    'switchDialog.switchAnyway': 'Cambiar de todos modos',
    'switchDialog.title': 'Mensaje en curso',
    'tokenUsage.cached': 'Almacenado en caché: {{count}}',
    'tokenUsage.inputTokens': 'Tokens de entrada: {{count}}',
    'tokenUsage.outputTokens': 'Tokens de salida: {{count}}',
    'tokenUsage.reasoning': 'Razonamiento: {{count}}',
    'tokenUsage.reportedBy':
      'Uso de tokens informado por el servidor de inferencia',
    'tokenUsage.totalTokens': 'Total de tokens: {{count}}',
    'toolApproval.approve': 'Aprobar',
    'toolApproval.approveHint': '↵ para aprobar',
    'toolApproval.destructiveOperation': 'Operación destructiva',
    'toolApproval.editArguments': 'Modificar argumentos',
    'toolApproval.editJson': 'Modificar JSON',
    'toolApproval.enterKey': 'Tecla Intro',
    'toolApproval.escapeKey': 'Tecla Escape',
    'toolApproval.hideEditor': 'Ocultar editor',
    'toolApproval.invalidJson': 'JSON no válido',
    'toolApproval.reject': 'Rechazar',
    'toolApproval.rejectHint': 'Esc para rechazar',
    'toolApproval.requiresApproval': 'Requiere aprobación',
    'toolApproval.running': 'En ejecución...',
    'toolApproval.toolExecution': 'Ejecución de herramientas',
    'toolCalls.arguments': 'Argumentos',
    'toolCalls.collapseOutput': 'Contraer resultado',
    'toolCalls.collapseToolCalls': 'Contraer llamadas a herramientas',
    'toolCalls.copiedToClipboard': 'Copiado en el portapapeles',
    'toolCalls.copy': 'Copiar',
    'toolCalls.copyOutput': 'Copiar resultado',
    'toolCalls.expandOutput': 'Expandir resultado',
    'toolCalls.expandToolCalls': 'Expandir llamadas a herramientas',
    'toolCalls.output': 'Salida',
    'toolCalls.usedTools': 'Se utilizaron {{count}} herramienta(s)',
    'welcomeScreen.emptyPromptHint':
      'Escriba una pregunta a continuación para comenzar',
    'welcomeScreen.logoAlt': 'Logotipo de la aplicación',
    'welcomeScreen.logoError':
      'No se pudo cargar el logotipo, compruebe el URL en la configuración de marca',
  },
});

export default augmentTranslationEs;
