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
    'adminOnboarding.adminAccessMessage':
      'Sie haben Administratorzugriff. Wie möchten Sie beginnen?',
    'adminOnboarding.continueToChat': 'Weiter zum Chat',
    'adminOnboarding.continueToChatDescription':
      'KI-Assistenten für Unterhaltungen verwenden',
    'adminOnboarding.openCommandCenter': 'Kommandozentrale öffnen',
    'adminOnboarding.openCommandCenterDescription':
      'Wissensdatenbank, Prompts und Einstellungen verwalten',
    'adminOnboarding.switchHint':
      'Über die Schaltfläche „Kommandozentrale“ in der Sidebar können Sie jederzeit zwischen den Modi wechseln.',
    'adminOnboarding.welcomeAdmin': 'Willkommen, Administrator',
    'agentInfo.connecting': 'Verbindung wird hergestellt...',
    'agentInfo.defaultAgent': 'Standard-Agent',
    'agentInfo.mcpConnected': 'Verbunden: {{url}} · {{toolCount}} Tools',
    'agentInfo.mcpDisconnected': 'Getrennt',
    'agentInfo.mcpServers': 'MCP-Server ({{connected}}/{{total}})',
    'agentInfo.offline': 'Offline',
    'agentInfo.ready': 'Bereit',
    'agentInfo.team': 'Team ({{count}})',
    'agentInfo.title': 'Agent-Informationen',
    'agentInfo.vectorRag': 'Vektor RAG',
    'agentInfo.vectorStoreId': 'Vektorspeicher: {{id}}',
    'agentInfo.vectorStoreUnavailable':
      'Vektorspeicher nicht verfügbar (optional)',
    'agentsPanel.adminModified': 'Geändert',
    'agentsPanel.advanced': 'Erweitert',
    'agentsPanel.agentInstructions': 'Agent-Anweisungen',
    'agentsPanel.applyTemplate': 'Vorlage anwenden:',
    'agentsPanel.basePrompt': 'Basis-Prompt',
    'agentsPanel.canDelegateTo': 'Kann delegieren an',
    'agentsPanel.canTransferTo': 'Kann übertragen werden an',
    'agentsPanel.capabilities': 'Fähigkeiten',
    'agentsPanel.codeInterpreter': 'Code-Interpreter',
    'agentsPanel.confirmRemoveButton': 'Entfernen',
    'agentsPanel.confirmRemoveMessage':
      'Dieser Agent wird entfernt. Für andere Agents, die darauf verweisen, werden diese Verweise gelöscht. Gespeichert wird erst nach Klicken auf „Speichern“.',
    'agentsPanel.confirmRemoveTitle': '{{name}} entfernen?',
    'agentsPanel.confirmResetButton': 'Zurücksetzen',
    'agentsPanel.confirmResetMessage':
      'Dadurch werden alle vom Administrator vorgenommenen Anpassungen verworfen und die Standardeinstellungen wiederhergestellt. Dies kann nicht rückgängig gemacht werden.',
    'agentsPanel.confirmResetTitle': 'Auf Standardeinstellungen zurücksetzen?',
    'agentsPanel.connections': 'Verbindungen',
    'agentsPanel.createFirstAgent': 'Erstellen Sie Ihren ersten Agent',
    'agentsPanel.createModal.agentId': 'Agent-ID',
    'agentsPanel.createModal.agentIdExists': 'Diese ID existiert bereits.',
    'agentsPanel.createModal.agentIdHint':
      'Wird automatisch aus dem Namen generiert.',
    'agentsPanel.createModal.cancel': 'Abbrechen',
    'agentsPanel.createModal.createButton': 'Agent erstellen',
    'agentsPanel.createModal.displayName': 'Anzeigename',
    'agentsPanel.createModal.displayNamePlaceholder': 'z. B. Support-Agent',
    'agentsPanel.createModal.subtitle':
      'Geben Sie Ihrem Agent einen Namen und wählen Sie optional eine Vorlage zum Vorbelegen der Einstellungen aus.',
    'agentsPanel.createModal.templateTitle': 'Anhand einer Vorlage beginnen',
    'agentsPanel.createModal.title': 'Neuen Agent erstellen',
    'agentsPanel.delegates': 'delegiert',
    'agentsPanel.deleteAgent': 'Agent löschen',
    'agentsPanel.inConnections': '{{count}} ein',
    'agentsPanel.inheritBasePrompt': 'Basis-Prompt übernehmen',
    'agentsPanel.instructions': 'Anweisungen',
    'agentsPanel.maxTurns': 'Max. Wendungen',
    'agentsPanel.mcpServers': 'MCP-Server',
    'agentsPanel.modelOverride': 'Modellüberschreibung',
    'agentsPanel.modelOverrideHint': 'Für globales Modell leer lassen',
    'agentsPanel.newAgent': 'Neuer Agent',
    'agentsPanel.noAgentsSubtitle':
      'Erstellen Sie Ihren ersten Agent, um mit der Orchestrierung mehrerer Agents zu beginnen.',
    'agentsPanel.noAgentsTitle': 'Keine Agents konfiguriert',
    'agentsPanel.outConnections': '{{count}} aus',
    'agentsPanel.rag': 'Wissensdatenbank',
    'agentsPanel.reset': 'Zurücksetzen',
    'agentsPanel.save': 'Speichern',
    'agentsPanel.saveSuccess': 'Konfiguration gespeichert.',
    'agentsPanel.saved': 'Gespeichert',
    'agentsPanel.selectAgent': 'Wählen Sie einen Agent aus der Liste aus',
    'agentsPanel.startingAgent': 'Agent wird gestartet',
    'agentsPanel.topology': 'Topologie',
    'agentsPanel.transfers': 'Übertragungen',
    'agentsPanel.webSearch': 'Websuche',
    'chat.cancelEdit': 'Bearbeitung abbrechen',
    'chat.copiedToClipboard': 'Kopiert!',
    'chat.copyResponse': 'Antwort kopieren',
    'chat.disclaimer':
      'KI-generierte Antworten können ungenau sein. Überprüfen Sie wichtige Informationen.',
    'chat.editMessage': 'Nachricht bearbeiten',
    'chat.emptySessionHint': 'Fragen Sie alles – ich bin hier, um zu helfen.',
    'chat.emptySessionTitle': 'Eine Unterhaltung beginnen',
    'chat.messagesUnavailableHint':
      'Der Unterhaltungsverlauf ist möglicherweise abgelaufen. Sie können fortfahren, indem Sie eine neue Nachricht senden.',
    'chat.messagesUnavailableTitle':
      'Vorherige Nachrichten sind nicht mehr verfügbar.',
    'chat.regenerateResponse': 'Antwort erneut generieren',
    'chat.submitEdit': 'Bearbeitung absenden',
    'chat.you': 'Sie',
    'chatInput.attachFile': 'Datei anhängen',
    'chatInput.chatMessageInput': 'Chatnachrichteneingabe',
    'chatInput.newConversation': 'Neue Unterhaltung',
    'chatInput.newConversationShortcut': 'Neue Unterhaltung (⌘⇧O)',
    'chatInput.sendMessage': 'Nachricht senden',
    'chatInput.startNewConversation': 'Neue Unterhaltung beginnen',
    'chatInput.stopGeneration': 'Generierung beenden',
    'chatInput.stopMessageGeneration': 'Nachrichtengenerierung beenden',
    'commandCenter.agents': 'Agents',
    'commandCenter.backToChat': 'Zurück zum Chat',
    'commandCenter.branding': 'Branding',
    'commandCenter.platform': 'Modell und Tools',
    'commandCenter.title': 'Kommandozentrale',
    'confirmDialog.cancel': 'Abbrechen',
    'confirmDialog.confirm': 'Bestätigen',
    'conversationHistory.allUsers': 'Alle Benutzer',
    'conversationHistory.cancel': 'Abbrechen',
    'conversationHistory.clearSearch': 'Suche löschen',
    'conversationHistory.delete': 'Löschen',
    'conversationHistory.deleteConversation': 'Unterhaltung löschen',
    'conversationHistory.mine': 'Meine',
    'conversationHistory.noConversationsYet':
      'Ihre Unterhaltungen werden hier angezeigt',
    'conversationHistory.noMatchingConversations':
      'Keine Unterhaltungen, die mit „{{query}}“ übereinstimmen',
    'conversationHistory.older': 'Älter',
    'conversationHistory.refresh': 'Aktualisieren',
    'conversationHistory.refreshAriaLabel':
      'Unterhaltungsverlauf aktualisieren',
    'conversationHistory.searchPlaceholder': 'Unterhaltungen durchsuchen...',
    'conversationHistory.startChatting':
      'Beginnen Sie eine Unterhaltung, um loszulegen',
    'conversationHistory.thisWeek': 'Diese Woche',
    'conversationHistory.title':
      '{{count}} Unterhaltung{{suffix}} • {{appName}}',
    'conversationHistory.today': 'Heute',
    'conversationHistory.yesterday': 'Gestern',
    'errors.connectionError': 'Verbindungsfehler',
    'errors.contentFiltered': 'Inhalt gefiltert',
    'errors.copied': 'Kopiert!',
    'errors.copyErrorDetails': 'Details zum Kopierfehler',
    'errors.error': 'Fehler',
    'errors.networkHint':
      'Verbindung zum Server wurde unterbrochen. Überprüfen Sie Ihre Netzwerkverbindung und versuchen Sie es erneut.',
    'errors.safetyHint':
      'Diese Antwort wurde durch eine Sicherheitsrichtlinie blockiert. Versuchen Sie, Ihre Anfrage umzuformulieren.',
    'errors.tryAgain': 'Versuchen Sie es erneut',
    'keyboardShortcuts.approvalSection': 'Toolgenehmigung',
    'keyboardShortcuts.approveTool': 'Toolausführung genehmigen',
    'keyboardShortcuts.cancelStreaming': 'Streaming der Antwort abbrechen',
    'keyboardShortcuts.chatSection': 'Chat',
    'keyboardShortcuts.close': 'Schließen',
    'keyboardShortcuts.focusChatInput': 'Fokus-Chat-Eingabe',
    'keyboardShortcuts.newConversation': 'Neue Unterhaltung',
    'keyboardShortcuts.rejectTool': 'Toolausführung ablehnen',
    'keyboardShortcuts.showHelp': 'Diese Hilfe anzeigen',
    'keyboardShortcuts.title': 'Tastenkombinationen',
    'providerOffline.backendUnreachable':
      '{{appName}} ist vorübergehend nicht verfügbar. Wir werden es weiter versuchen.',
    'providerOffline.modelUnreachable':
      'Das KI-Modell ist derzeit nicht erreichbar. Nachrichten sind erst wieder möglich, wenn die Verbindung wiederhergestellt ist.',
    'providerOffline.title': 'Assistent nicht verfügbar',
    'ragSources.collapseKnowledgeSources': 'Wissensdatenbankquellen reduzieren',
    'ragSources.expandKnowledgeSources': 'Wissensdatenbankquellen erweitern',
    'ragSources.sourcesFromVectorRag':
      '{{count}} Quelle(n) aus Wissensdatenbank',
    'ragSources.unknownSource': 'Unbekannte Quelle',
    'rightPane.admin': 'Administrator',
    'rightPane.collapse': 'Reduzieren',
    'rightPane.collapseSidebar': 'Sidebar reduzieren',
    'rightPane.commandCenter': 'Kommandozentrale',
    'rightPane.expand': 'Erweitern',
    'rightPane.expandSidebar': 'Sidebar erweitern',
    'rightPane.openCommandCenter': 'Kommandozentrale öffnen',
    'rightPane.scrollToBottom': 'Nach unten scrollen',
    'securityGate.accessDenied': 'Zugriff verweigert',
    'securityGate.accessDeniedMessage':
      'Sie haben keine Berechtigung, auf {{appName}} zuzugreifen. Wenden Sie sich an Ihren Administrator, um Zugriff zu beantragen.',
    'securityGate.configurationErrorLabel': 'Einrichtungsproblem',
    'securityGate.configurationErrors':
      '{{appName}} ist nicht korrekt konfiguriert. Beheben Sie die folgenden Probleme:',
    'securityGate.configurationHint':
      'Starten Sie den Backend-Server nach der Aktualisierung Ihrer Konfiguration neu.',
    'securityGate.configurationRequired': 'Einrichtung erforderlich',
    'streaming.connectingWith': 'Verbindung mit {{agentName}} wird hergestellt',
    'streaming.done': 'Erledigt',
    'streaming.executingTools': 'Wird bearbeitet',
    'streaming.needsApproval': 'Warten auf Ihr OK',
    'streaming.processing': 'Verarbeitung...',
    'streaming.responding': 'Antwort',
    'streaming.searching': 'Suche',
    'streaming.thinking': 'Denkvorgang',
    'streaming.thinkingEllipsis': 'Denkvorgang...',
    'streaming.thoughtFor': 'Gedanke für {{seconds}} Sekunde{{suffix}}',
    'streaming.working': 'Bearbeitung',
    'switchDialog.message':
      'Eine Antwort wird derzeit generiert. Durch einen Unterhaltungswechsel wird die laufende Antwort abgebrochen. Weiter?',
    'switchDialog.stay': 'Bleiben',
    'switchDialog.switchAnyway': 'Trotzdem wechseln',
    'switchDialog.title': 'Nachricht wird verarbeitet',
    'tokenUsage.cached': 'Im Cache: {{count}}',
    'tokenUsage.inputTokens': 'Eingabe-Token: {{count}}',
    'tokenUsage.outputTokens': 'Ausgabe-Token: {{count}}',
    'tokenUsage.reasoning': 'Reasoning: {{count}}',
    'tokenUsage.reportedBy': 'Vom Inferenzserver gemeldete Token-Nutzung',
    'tokenUsage.totalTokens': 'Token gesamt: {{count}}',
    'toolApproval.approve': 'Genehmigen',
    'toolApproval.approveHint': '↵ genehmigen',
    'toolApproval.destructiveOperation': 'Destruktiver Vorgang',
    'toolApproval.editArguments': 'Argumente bearbeiten',
    'toolApproval.editJson': 'JSON bearbeiten',
    'toolApproval.enterKey': 'Eingabetaste',
    'toolApproval.escapeKey': 'Esc-Taste',
    'toolApproval.hideEditor': 'Editor ausblenden',
    'toolApproval.invalidJson': 'JSON ungültig',
    'toolApproval.reject': 'Ablehnen',
    'toolApproval.rejectHint': 'Esc ablehnen',
    'toolApproval.requiresApproval': 'Genehmigung erforderlich',
    'toolApproval.running': 'Wird ausgeführt...',
    'toolApproval.toolExecution': 'Toolausführung',
    'toolCalls.arguments': 'Argumente',
    'toolCalls.collapseOutput': 'Ausgabe reduzieren',
    'toolCalls.collapseToolCalls': 'Toolaufrufe reduzieren',
    'toolCalls.copiedToClipboard': 'In Zwischenablage kopiert',
    'toolCalls.copy': 'Kopieren',
    'toolCalls.copyOutput': 'Ausgabe kopieren',
    'toolCalls.expandOutput': 'Ausgabe erweitern',
    'toolCalls.expandToolCalls': 'Toolaufrufe erweitern',
    'toolCalls.output': 'Ausgabe',
    'toolCalls.usedTools': '{{count}} Tool(s) verwendet',
    'welcomeScreen.emptyPromptHint':
      'Geben Sie unten eine Frage ein, um loszulegen',
    'welcomeScreen.logoAlt': 'Anwendungslogo',
    'welcomeScreen.logoError':
      'Das Logo konnte nicht geladen werden – überprüfen Sie die URL in den Branding-Einstellungen.',
  },
});

export default augmentTranslationDe;
