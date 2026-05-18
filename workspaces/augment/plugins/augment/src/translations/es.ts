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
    'securityGate.configurationRequired': 'Se requiere configuración',
    'securityGate.configurationErrors':
      '{{appName}} no está configurada correctamente. Solucione los siguientes problemas:',
    'securityGate.configurationErrorLabel': 'Problema de configuración',
    'securityGate.configurationHint':
      'Tras actualizar la configuración, reinicie el servidor backend.',
    'securityGate.accessDeniedMessage':
      'No tienes permiso para acceder a {{appName}}. Comuníquese con su administrador para solicitar acceso.',
    'commandCenter.title': 'Centro de comandos',
    'commandCenter.backToChat': 'Volver al chat',
    'commandCenter.platform': 'Modelo y herramientas',
    'commandCenter.agents': 'Agentes',
    'commandCenter.branding': 'Marca',
    'providerOffline.title': 'Asistente no disponible',
    'providerOffline.backendUnreachable':
      '{{appName}} temporalmente no está disponible. Seguiremos intentándolo.',
    'chatInput.newConversation': 'Nueva conversación',
    'chatInput.newConversationShortcut': 'Nueva conversación (⌘⇧O)',
    'chatInput.startNewConversation': 'Iniciar una nueva conversación',
    'chatInput.attachFile': 'Adjuntar archivo',
    'chatInput.chatMessageInput': 'Entrada de mensaje de chat',
    'chatInput.stopGeneration': 'Detener generación',
    'chatInput.stopMessageGeneration': 'Detener generación de mensajes',
    'chatInput.sendMessage': 'Enviar mensaje',
    'welcomeScreen.logoAlt': 'Logotipo de la aplicación',
    'welcomeScreen.emptyPromptHint':
      'Escriba una pregunta a continuación para comenzar',
    'welcomeScreen.logoError':
      'No se pudo cargar el logotipo, compruebe el URL en la configuración de marca',
    'conversationHistory.title':
      '{{count}} conversación{{suffix}} • {{appName}}',
    'conversationHistory.refreshAriaLabel':
      'Actualizar el historial de conversaciones',
    'conversationHistory.noConversationsYet':
      'Sus conversaciones aparecerán aquí',
    'conversationHistory.startChatting': 'Inicie una conversación para empezar',
    'conversationHistory.noMatchingConversations':
      'No se encontraron conversaciones que coincidieran con “{{query}}”',
    'toolApproval.destructiveOperation': 'Operación destructiva',
    'toolApproval.requiresApproval': 'Requiere aprobación',
    'toolApproval.toolExecution': 'Ejecución de herramientas',
    'toolApproval.approveHint': '↵ para aprobar',
    'toolApproval.rejectHint': 'Esc para rechazar',
    'toolApproval.enterKey': 'Tecla Intro',
    'toolApproval.escapeKey': 'Tecla Escape',
    'toolApproval.reject': 'Rechazar',
    'toolApproval.approve': 'Aprobar',
    'toolApproval.running': 'En ejecución...',
    'toolApproval.invalidJson': 'JSON no válido',
    'toolApproval.editJson': 'Modificar JSON',
    'toolApproval.hideEditor': 'Ocultar editor',
    'toolApproval.editArguments': 'Modificar argumentos',
    'streaming.thinking': 'Pensando',
    'streaming.working': 'Trabajando',
    'streaming.searching': 'Buscando',
    'streaming.executingTools': 'Trabajando en ello',
    'streaming.needsApproval': 'Esperando su aprobación',
    'streaming.responding': 'Respondiendo',
    'streaming.done': 'Hecho',
    'streaming.processing': 'En proceso…',
    'streaming.thoughtFor': 'Pensé durante {{seconds}} segundo{{suffix}}',
    'toolCalls.usedTools': 'Se utilizaron {{count}} herramienta(s)',
    'toolCalls.expandToolCalls': 'Expandir llamadas a herramientas',
    'toolCalls.arguments': 'Argumentos',
    'toolCalls.output': 'Salida',
    'toolCalls.collapseOutput': 'Contraer resultado',
    'toolCalls.expandOutput': 'Expandir resultado',
    'toolCalls.copyOutput': 'Copiar resultado',
    'toolCalls.copiedToClipboard': 'Copiado en el portapapeles',
    'toolCalls.copy': 'Copiar',
    'ragSources.sourcesFromVectorRag':
      '{{count}} fuente(s) de la base de conocimientos',
    'ragSources.unknownSource': 'Fuente desconocida',
    'ragSources.collapseKnowledgeSources':
      'Contraer fuentes de la base de conocimientos',
    'ragSources.expandKnowledgeSources':
      'Expandir fuentes de la base de conocimientos',
    'tokenUsage.inputTokens': 'Tokens de entrada: {{count}}',
    'agentsPanel.startingAgent': 'Agente inicial',
    'agentsPanel.maxTurns': 'Máximo de turnos',
    'agentsPanel.basePrompt': 'Indicador base',
    'agentsPanel.newAgent': 'Nuevo agente',
    'agentsPanel.save': 'Guardar',
    'agentsPanel.saved': 'Guardadas',
    'agentsPanel.saveSuccess': 'Se guardó la configuración.',
    'agentsPanel.reset': 'Reiniciar',
    'agentsPanel.noAgentsTitle': 'No hay agentes configurados',
    'agentsPanel.noAgentsSubtitle':
      'Cree su primer agente para comenzar con la orquestación multiagente.',
    'agentsPanel.createFirstAgent': 'Cree su primer agente',
    'agentsPanel.selectAgent': 'Seleccione un agente de la lista',
    'agentsPanel.topology': 'Topología',
    'agentsPanel.transfers': 'transferencias',
    'agentsPanel.delegates': 'delegados',
    'agentsPanel.outConnections': '{{count}} salientes',
    'agentsPanel.inConnections': '{{count}} entrantes',
    'agentsPanel.instructions': 'Instrucciones',
    'agentsPanel.inheritBasePrompt': 'Indicación de herencia base',
    'agentsPanel.agentInstructions': 'Instrucciones para el agente',
    'agentsPanel.applyTemplate': 'Aplicar plantilla:',
    'agentsPanel.capabilities': 'Capacidades',
    'agentsPanel.modelOverride': 'Anulación del modelo',
    'agentsPanel.modelOverrideHint': 'Dejar en blanco para el modelo global',
    'agentsPanel.mcpServers': 'Servidores MCP',
    'agentsPanel.rag': 'Base de conocimientos',
    'agentsPanel.webSearch': 'Búsqueda web',
    'agentsPanel.codeInterpreter': 'Intérprete de código',
    'agentsPanel.connections': 'Conexiones',
    'agentsPanel.canTransferTo': 'Se puede transferir a',
    'agentsPanel.canDelegateTo': 'Puede delegar en',
    'agentsPanel.advanced': 'Avanzado',
    'agentsPanel.adminModified': 'Modificado',
    'agentsPanel.deleteAgent': 'Eliminar agente',
    'agentsPanel.confirmRemoveTitle': '¿Desea quitar {{name}}?',
    'agentsPanel.confirmResetTitle':
      '¿Desea restablecer los valores predeterminados?',
    'agentsPanel.confirmResetMessage':
      'Esto descartará todas las personalizaciones de administrador y restaurará los valores predeterminados. Esto no se puede deshacer.',
    'agentsPanel.confirmResetButton': 'Reiniciar',
    'agentsPanel.createModal.title': 'Crear nuevo agente',
    'agentsPanel.createModal.subtitle':
      'Asigne un nombre a su agente y, de manera opcional, seleccione una plantilla para completar previamente la configuración.',
    'agentsPanel.createModal.displayName': 'Nombre para mostrar',
    'agentsPanel.createModal.displayNamePlaceholder':
      'p. ej., agente de soporte',
    'agentsPanel.createModal.agentId': 'ID de agente',
    'agentsPanel.createModal.agentIdHint':
      'Generado automáticamente a partir del nombre.',
    'agentsPanel.createModal.agentIdExists': 'Este ID ya existe.',
    'agentsPanel.createModal.templateTitle':
      'Comenzar a partir de una plantilla',
    'agentsPanel.createModal.createButton': 'Crear agente',
    'agentsPanel.createModal.cancel': 'Cancelar',
    'keyboardShortcuts.title': 'Combinaciones de teclas',
    'keyboardShortcuts.close': 'Cerrar',
    'keyboardShortcuts.chatSection': 'Chatear',
    'keyboardShortcuts.approvalSection': 'Aprobación de herramientas',
    'keyboardShortcuts.focusChatInput': 'Poner el foco en la entrada de chat',
    'keyboardShortcuts.newConversation': 'Nueva conversación',
    'keyboardShortcuts.cancelStreaming': 'Cancelar respuesta de transmisión',
    'keyboardShortcuts.showHelp': 'Mostrar esta ayuda',
    'keyboardShortcuts.approveTool': 'Aprobar la ejecución de la herramienta',
    'keyboardShortcuts.rejectTool': 'Rechazar la ejecución de la herramienta',
    'confirmDialog.confirm': 'Confirmar',
    'confirmDialog.cancel': 'Cancelar',
  },
});

export default augmentTranslationEs;
