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
 * de translation for plugin.augment.
 * @public
 */
const augmentTranslationDe = createTranslationMessages({
  ref: augmentTranslationRef,
  messages: {
    'securityGate.configurationRequired': 'Einrichtung erforderlich',
    'securityGate.configurationErrors':
      '{{appName}} ist nicht korrekt konfiguriert. Beheben Sie die folgenden Probleme:',
    'securityGate.configurationErrorLabel': 'Einrichtungsproblem',
    'securityGate.configurationHint':
      'Starten Sie den Backend-Server nach der Aktualisierung Ihrer Konfiguration neu.',
    'securityGate.accessDeniedMessage':
      'Sie haben keine Berechtigung, auf {{appName}} zuzugreifen. Wenden Sie sich an Ihren Administrator, um Zugriff zu beantragen.',
    'commandCenter.title': 'Kommandozentrale',
    'commandCenter.backToChat': 'Zurück zum Chat',
    'commandCenter.platform': 'Modell und Tools',
    'commandCenter.agents': 'Agents',
    'commandCenter.branding': 'Branding',
    'providerOffline.title': 'Assistent nicht verfügbar',
    'providerOffline.backendUnreachable':
      '{{appName}} ist vorübergehend nicht verfügbar. Wir werden es weiter versuchen.',
    'chatInput.newConversation': 'Neue Unterhaltung',
    'chatInput.newConversationShortcut': 'Neue Unterhaltung (⌘⇧O)',
    'chatInput.startNewConversation': 'Neue Unterhaltung beginnen',
    'chatInput.attachFile': 'Datei anhängen',
    'chatInput.chatMessageInput': 'Chatnachrichteneingabe',
    'chatInput.stopGeneration': 'Generierung beenden',
    'chatInput.stopMessageGeneration': 'Nachrichtengenerierung beenden',
    'chatInput.sendMessage': 'Nachricht senden',
    'welcomeScreen.logoAlt': 'Anwendungslogo',
    'welcomeScreen.emptyPromptHint':
      'Geben Sie unten eine Frage ein, um loszulegen',
    'welcomeScreen.logoError':
      'Das Logo konnte nicht geladen werden – überprüfen Sie die URL in den Branding-Einstellungen.',
    'conversationHistory.title':
      '{{count}} Unterhaltung{{suffix}} • {{appName}}',
    'conversationHistory.refreshAriaLabel':
      'Unterhaltungsverlauf aktualisieren',
    'conversationHistory.noConversationsYet':
      'Ihre Unterhaltungen werden hier angezeigt',
    'conversationHistory.startChatting':
      'Beginnen Sie eine Unterhaltung, um loszulegen',
    'conversationHistory.noMatchingConversations':
      'Keine Unterhaltungen, die mit „{{query}}“ übereinstimmen',
    'toolApproval.destructiveOperation': 'Destruktiver Vorgang',
    'toolApproval.requiresApproval': 'Genehmigung erforderlich',
    'toolApproval.toolExecution': 'Toolausführung',
    'toolApproval.approveHint': '↵ genehmigen',
    'toolApproval.rejectHint': 'Esc ablehnen',
    'toolApproval.enterKey': 'Eingabetaste',
    'toolApproval.escapeKey': 'Esc-Taste',
    'toolApproval.reject': 'Ablehnen',
    'toolApproval.approve': 'Genehmigen',
    'toolApproval.running': 'Wird ausgeführt...',
    'toolApproval.invalidJson': 'JSON ungültig',
    'toolApproval.editJson': 'JSON bearbeiten',
    'toolApproval.hideEditor': 'Editor ausblenden',
    'toolApproval.editArguments': 'Argumente bearbeiten',
    'streaming.thinking': 'Denkvorgang',
    'streaming.working': 'Bearbeitung',
    'streaming.searching': 'Suche',
    'streaming.executingTools': 'Wird bearbeitet',
    'streaming.needsApproval': 'Warten auf Ihr OK',
    'streaming.responding': 'Antwort',
    'streaming.done': 'Erledigt',
    'streaming.processing': 'Verarbeitung...',
    'streaming.thoughtFor': 'Gedanke für {{seconds}} Sekunde{{suffix}}',
    'toolCalls.usedTools': '{{count}} Tool(s) verwendet',
    'toolCalls.expandToolCalls': 'Toolaufrufe erweitern',
    'toolCalls.arguments': 'Argumente',
    'toolCalls.output': 'Ausgabe',
    'toolCalls.collapseOutput': 'Ausgabe reduzieren',
    'toolCalls.expandOutput': 'Ausgabe erweitern',
    'toolCalls.copyOutput': 'Ausgabe kopieren',
    'toolCalls.copiedToClipboard': 'In Zwischenablage kopiert',
    'toolCalls.copy': 'Kopieren',
    'ragSources.sourcesFromVectorRag':
      '{{count}} Quelle(n) aus Wissensdatenbank',
    'ragSources.unknownSource': 'Unbekannte Quelle',
    'ragSources.collapseKnowledgeSources': 'Wissensdatenbankquellen reduzieren',
    'ragSources.expandKnowledgeSources': 'Wissensdatenbankquellen erweitern',
    'tokenUsage.inputTokens': 'Eingabe-Token: {{count}}',
    'agentsPanel.startingAgent': 'Agent wird gestartet',
    'agentsPanel.maxTurns': 'Max. Wendungen',
    'agentsPanel.basePrompt': 'Basis-Prompt',
    'agentsPanel.newAgent': 'Neuer Agent',
    'agentsPanel.save': 'Speichern',
    'agentsPanel.saved': 'Gespeichert',
    'agentsPanel.saveSuccess': 'Konfiguration gespeichert.',
    'agentsPanel.reset': 'Zurücksetzen',
    'agentsPanel.noAgentsTitle': 'Keine Agents konfiguriert',
    'agentsPanel.noAgentsSubtitle':
      'Erstellen Sie Ihren ersten Agent, um mit der Orchestrierung mehrerer Agents zu beginnen.',
    'agentsPanel.createFirstAgent': 'Erstellen Sie Ihren ersten Agent',
    'agentsPanel.selectAgent': 'Wählen Sie einen Agent aus der Liste aus',
    'agentsPanel.topology': 'Topologie',
    'agentsPanel.transfers': 'Übertragungen',
    'agentsPanel.delegates': 'delegiert',
    'agentsPanel.outConnections': '{{count}} aus',
    'agentsPanel.inConnections': '{{count}} ein',
    'agentsPanel.instructions': 'Anweisungen',
    'agentsPanel.inheritBasePrompt': 'Basis-Prompt übernehmen',
    'agentsPanel.agentInstructions': 'Agent-Anweisungen',
    'agentsPanel.applyTemplate': 'Vorlage anwenden:',
    'agentsPanel.capabilities': 'Fähigkeiten',
    'agentsPanel.modelOverride': 'Modellüberschreibung',
    'agentsPanel.modelOverrideHint': 'Für globales Modell leer lassen',
    'agentsPanel.mcpServers': 'MCP-Server',
    'agentsPanel.rag': 'Wissensdatenbank',
    'agentsPanel.webSearch': 'Websuche',
    'agentsPanel.codeInterpreter': 'Code-Interpreter',
    'agentsPanel.connections': 'Verbindungen',
    'agentsPanel.canTransferTo': 'Kann übertragen werden an',
    'agentsPanel.canDelegateTo': 'Kann delegieren an',
    'agentsPanel.advanced': 'Erweitert',
    'agentsPanel.adminModified': 'Geändert',
    'agentsPanel.deleteAgent': 'Agent löschen',
    'agentsPanel.confirmRemoveTitle': '{{name}} entfernen?',
    'agentsPanel.confirmResetTitle': 'Auf Standardeinstellungen zurücksetzen?',
    'agentsPanel.confirmResetMessage':
      'Dadurch werden alle vom Administrator vorgenommenen Anpassungen verworfen und die Standardeinstellungen wiederhergestellt. Dies kann nicht rückgängig gemacht werden.',
    'agentsPanel.confirmResetButton': 'Zurücksetzen',
    'agentsPanel.createModal.title': 'Neuen Agent erstellen',
    'agentsPanel.createModal.subtitle':
      'Geben Sie Ihrem Agent einen Namen und wählen Sie optional eine Vorlage zum Vorbelegen der Einstellungen aus.',
    'agentsPanel.createModal.displayName': 'Anzeigename',
    'agentsPanel.createModal.displayNamePlaceholder': 'z. B. Support-Agent',
    'agentsPanel.createModal.agentId': 'Agent-ID',
    'agentsPanel.createModal.agentIdHint':
      'Wird automatisch aus dem Namen generiert.',
    'agentsPanel.createModal.agentIdExists': 'Diese ID existiert bereits.',
    'agentsPanel.createModal.templateTitle': 'Anhand einer Vorlage beginnen',
    'agentsPanel.createModal.createButton': 'Agent erstellen',
    'agentsPanel.createModal.cancel': 'Abbrechen',
    'keyboardShortcuts.title': 'Tastenkombinationen',
    'keyboardShortcuts.close': 'Schließen',
    'keyboardShortcuts.chatSection': 'Chat',
    'keyboardShortcuts.approvalSection': 'Toolgenehmigung',
    'keyboardShortcuts.focusChatInput': 'Fokus-Chat-Eingabe',
    'keyboardShortcuts.newConversation': 'Neue Unterhaltung',
    'keyboardShortcuts.cancelStreaming': 'Streaming der Antwort abbrechen',
    'keyboardShortcuts.showHelp': 'Diese Hilfe anzeigen',
    'keyboardShortcuts.approveTool': 'Toolausführung genehmigen',
    'keyboardShortcuts.rejectTool': 'Toolausführung ablehnen',
    'confirmDialog.confirm': 'Bestätigen',
    'confirmDialog.cancel': 'Abbrechen',
  },
});

export default augmentTranslationDe;
