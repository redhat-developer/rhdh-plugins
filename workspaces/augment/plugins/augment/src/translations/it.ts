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
 * Italian translation for plugin.augment.
 * @public
 */
const augmentTranslationIt = createTranslationMessages({
  ref: augmentTranslationRef,
  messages: {
    'adminOnboarding.adminAccessMessage':
      'Hai accesso da amministratore. Come vorresti iniziare?',
    'adminOnboarding.continueToChat': 'Continua a chattare',
    'adminOnboarding.continueToChatDescription':
      "Utilizza l'assistente IA per le conversazioni",
    'adminOnboarding.openCommandCenter': 'Apri Centro comandi',
    'adminOnboarding.openCommandCenterDescription':
      'Gestisci knowledge base, prompt e impostazioni',
    'adminOnboarding.switchHint':
      "È possibile passare da una modalità all'altra in qualsiasi momento utilizzando il pulsante Centro comandi nella barra laterale.",
    'adminOnboarding.welcomeAdmin': 'Benvenuto, Amministratore',
    'agentInfo.connecting': 'Connessione...',
    'agentInfo.defaultAgent': 'Agente predefinito',
    'agentInfo.mcpConnected': 'Connesso: {{url}} · {{toolCount}} strumenti',
    'agentInfo.mcpDisconnected': 'Disconnesso',
    'agentInfo.mcpServers': 'Server MCP ({{connected}}/{{total}})',
    'agentInfo.offline': 'Offline',
    'agentInfo.ready': 'Pronto',
    'agentInfo.team': 'Team ({{count}})',
    'agentInfo.title': "Informazioni sull'agente",
    'agentInfo.vectorRag': 'RAG vettoriale',
    'agentInfo.vectorStoreId': 'Archivio vettoriale: {{id}}',
    'agentInfo.vectorStoreUnavailable':
      'Archivio vettoriale non disponibile (opzionale)',
    'agentsPanel.adminModified': 'Modificato',
    'agentsPanel.advanced': 'Avanzato',
    'agentsPanel.agentInstructions': 'Istruzioni agente',
    'agentsPanel.applyTemplate': 'Applica il modello:',
    'agentsPanel.basePrompt': 'Prompt di base',
    'agentsPanel.canDelegateTo': 'Può delegare a',
    'agentsPanel.canTransferTo': 'Può trasferire a',
    'agentsPanel.capabilities': 'Capacità',
    'agentsPanel.codeInterpreter': 'Interprete di codice',
    'agentsPanel.confirmRemoveButton': 'Rimuovi',
    'agentsPanel.confirmRemoveMessage':
      'Questo agente verrà rimosso. Altri agenti che faranno riferimento a questa informazione vedranno tali riferimenti cancellati. Il salvataggio non verrà effettuato finché non si fa clic su Salva.',
    'agentsPanel.confirmRemoveTitle': 'Rimuovere {{name}}?',
    'agentsPanel.confirmResetButton': 'Reset',
    'agentsPanel.confirmResetMessage':
      "Questa operazione annullerà tutte le personalizzazioni dell'amministratore e ripristinerà le impostazioni predefinite. Impossibile annullare l'operazione.",
    'agentsPanel.confirmResetTitle':
      'Ripristinare le impostazioni predefinite?',
    'agentsPanel.connections': 'Connessioni',
    'agentsPanel.createFirstAgent': 'Crea il tuo primo agente',
    'agentsPanel.createModal.agentId': 'ID agente',
    'agentsPanel.createModal.agentIdExists': 'Questo ID esiste già.',
    'agentsPanel.createModal.agentIdHint': 'Generato automaticamente dal nome.',
    'agentsPanel.createModal.cancel': 'Annulla',
    'agentsPanel.createModal.createButton': 'Crea agente',
    'agentsPanel.createModal.displayName': 'Nome visualizzato',
    'agentsPanel.createModal.displayNamePlaceholder':
      'ad esempio, Agente di supporto',
    'agentsPanel.createModal.subtitle':
      'Assegna un nome al tuo agente e scegli un modello per precompilare le impostazioni (opzionale).',
    'agentsPanel.createModal.templateTitle': 'Parti da un modello',
    'agentsPanel.createModal.title': 'Crea un nuovo agente',
    'agentsPanel.delegates': 'delegati',
    'agentsPanel.deleteAgent': 'Elimina agente',
    'agentsPanel.inConnections': '{{count}} dentro',
    'agentsPanel.inheritBasePrompt': 'Eredita prompt di base',
    'agentsPanel.instructions': 'Istruzioni',
    'agentsPanel.maxTurns': 'Turni massimi',
    'agentsPanel.mcpServers': 'Server MCP',
    'agentsPanel.modelOverride': 'Sovrascrittura modello',
    'agentsPanel.modelOverrideHint': 'Lascia vuoto per il modello globale',
    'agentsPanel.newAgent': 'Nuovo agente',
    'agentsPanel.noAgentsSubtitle':
      "Crea il tuo primo agente per iniziare subito con l'orchestrazione multi agente.",
    'agentsPanel.noAgentsTitle': 'Nessun agente configurato',
    'agentsPanel.outConnections': '{{count}} fuori',
    'agentsPanel.rag': 'Knowledge Base',
    'agentsPanel.reset': 'Reset',
    'agentsPanel.save': 'Salva',
    'agentsPanel.saveSuccess': 'Configurazione salvata.',
    'agentsPanel.saved': 'Salvate',
    'agentsPanel.selectAgent': "Seleziona un agente dall'elenco",
    'agentsPanel.startingAgent': 'Avvio agente',
    'agentsPanel.topology': 'Topologia',
    'agentsPanel.transfers': 'trasferimenti',
    'agentsPanel.webSearch': 'Ricerca sul web',
    'chat.cancelEdit': 'Annulla modifica',
    'chat.copiedToClipboard': 'Copiato!',
    'chat.copyResponse': 'Copia risposta',
    'chat.disclaimer':
      'Le risposte generate da IA potrebbero essere imprecise. Verifica le informazioni importanti.',
    'chat.editMessage': 'Modifica messaggio',
    'chat.emptySessionHint': 'Chiedi qualsiasi cosa: sono qui per aiutarti.',
    'chat.emptySessionTitle': 'Avvia una conversazione',
    'chat.messagesUnavailableHint':
      'La cronologia delle conversazioni potrebbe essere scaduta. È possibile continuare inviando un nuovo messaggio.',
    'chat.messagesUnavailableTitle':
      'I messaggi precedenti non sono più disponibili',
    'chat.regenerateResponse': 'Rigenera risposta',
    'chat.submitEdit': 'Invia modifica',
    'chat.you': 'Tu',
    'chatInput.attachFile': 'Allega file',
    'chatInput.chatMessageInput': 'Input messaggio chat',
    'chatInput.newConversation': 'Nuova conversazione',
    'chatInput.newConversationShortcut': 'Nuova conversazione (⌘⇧O)',
    'chatInput.sendMessage': 'Invia messaggio',
    'chatInput.startNewConversation': 'Inizia una nuova conversazione',
    'chatInput.stopGeneration': 'Interrompi generazione',
    'chatInput.stopMessageGeneration': 'Interrompi generazione messaggi',
    'commandCenter.agents': 'Agenti',
    'commandCenter.backToChat': 'Torna alla chat',
    'commandCenter.branding': 'Branding',
    'commandCenter.platform': 'Modello e strumenti',
    'commandCenter.title': 'Centro comandi',
    'confirmDialog.cancel': 'Annulla',
    'confirmDialog.confirm': 'Conferma',
    'conversationHistory.allUsers': 'Di tutti gli utenti',
    'conversationHistory.cancel': 'Annulla',
    'conversationHistory.clearSearch': 'Cancella ricerca',
    'conversationHistory.delete': 'Elimina',
    'conversationHistory.deleteConversation': 'Elimina conversazione',
    'conversationHistory.mine': 'Le mie',
    'conversationHistory.noConversationsYet':
      'Le tue conversazioni appariranno qui',
    'conversationHistory.noMatchingConversations':
      'Nessuna conversazione corrispondente a "{{query}}"',
    'conversationHistory.older': 'Più vecchie',
    'conversationHistory.refresh': 'Aggiorna',
    'conversationHistory.refreshAriaLabel':
      'Aggiorna la cronologia delle conversazioni',
    'conversationHistory.searchPlaceholder': 'Cerca conversazioni...',
    'conversationHistory.startChatting':
      'Inizia una conversazione per cominciare',
    'conversationHistory.thisWeek': 'Questa settimana',
    'conversationHistory.title':
      '{{count}} conversazione{{suffix}} • {{appName}}',
    'conversationHistory.today': 'Oggi',
    'conversationHistory.yesterday': 'Ieri',
    'errors.connectionError': 'Errore di connessione',
    'errors.contentFiltered': 'Contenuto filtrato',
    'errors.copied': 'Copiato!',
    'errors.copyErrorDetails': 'Copia dettagli errore',
    'errors.error': 'Errore',
    'errors.networkHint':
      'La connessione al server è stata interrotta. Verifica la rete e riprova.',
    'errors.safetyHint':
      'Questa risposta è stata bloccata da una norma di sicurezza. Prova a riformulare la tua richiesta.',
    'errors.tryAgain': 'Riprova',
    'keyboardShortcuts.approvalSection': 'Approvazione strumenti',
    'keyboardShortcuts.approveTool': 'Approva esecuzione strumento',
    'keyboardShortcuts.cancelStreaming': 'Annulla risposta in streaming',
    'keyboardShortcuts.chatSection': 'Chat',
    'keyboardShortcuts.close': 'Chiudi',
    'keyboardShortcuts.focusChatInput': 'Attiva input chat',
    'keyboardShortcuts.newConversation': 'Nuova conversazione',
    'keyboardShortcuts.rejectTool': 'Rifiuta esecuzione strumento',
    'keyboardShortcuts.showHelp': 'Mostra questo aiuto',
    'keyboardShortcuts.title': 'Scorciatoie da tastiera',
    'providerOffline.backendUnreachable':
      '{{appName}} non è temporaneamente disponibile. Continueremo a riprovare.',
    'providerOffline.modelUnreachable':
      "Il modello di IA è attualmente irraggiungibile. L'invio dei messaggi potrebbe non andare a buon fine finché la connessione non viene ripristinata.",
    'providerOffline.title': 'Assistente non disponibile',
    'ragSources.collapseKnowledgeSources':
      'Comprimi sorgenti della knowledge base',
    'ragSources.expandKnowledgeSources':
      'Espandi sorgenti della knowledge base',
    'ragSources.sourcesFromVectorRag':
      '{{count}} sorgente/i dalla Knowledge Base',
    'ragSources.unknownSource': 'Sorgente sconosciuta',
    'rightPane.admin': 'Amministratore',
    'rightPane.collapse': 'Comprimi',
    'rightPane.collapseSidebar': 'Comprimi barra laterale',
    'rightPane.commandCenter': 'Centro comandi',
    'rightPane.expand': 'Espandi',
    'rightPane.expandSidebar': 'Espandi barra laterale',
    'rightPane.openCommandCenter': 'Apri Centro comandi',
    'rightPane.scrollToBottom': 'Scorri fino in fondo',
    'securityGate.accessDenied': 'Accesso negato',
    'securityGate.accessDeniedMessage':
      "Non si dispone dell'autorizzazione per accedere a {{appName}}. Contatta il tuo amministratore per richiedere l'accesso.",
    'securityGate.configurationErrorLabel': 'Problema di configurazione',
    'securityGate.configurationErrors':
      'La configurazione di {{appName}} non è corretta. Si prega di correggere i seguenti problemi:',
    'securityGate.configurationHint':
      'Dopo aver aggiornato la configurazione, riavvia il server backend.',
    'securityGate.configurationRequired': 'Configurazione necessaria',
    'streaming.connectingWith': 'Ti metto in contatto con {{agentName}}',
    'streaming.done': 'Fatto',
    'streaming.executingTools': 'Ci sto lavorando',
    'streaming.needsApproval': 'In attesa del tuo OK',
    'streaming.processing': 'Elaborazione...',
    'streaming.responding': 'Sto rispondendo',
    'streaming.searching': 'Sto cercando',
    'streaming.thinking': 'Sto pensando',
    'streaming.thinkingEllipsis': 'Sto pensando...',
    'streaming.thoughtFor': 'Ho pensato per {{seconds}} second{{suffisso}}',
    'streaming.working': 'Sto lavorando',
    'switchDialog.message':
      "È in corso la generazione di una risposta. Passare a un'altra conversazione annullerà la risposta in corso. Continuare?",
    'switchDialog.stay': 'Resta',
    'switchDialog.switchAnyway': 'Cambia comunque',
    'switchDialog.title': 'Messaggio in corso',
    'tokenUsage.cached': 'Nella cache: {{count}}',
    'tokenUsage.inputTokens': 'Token input: {{count}}',
    'tokenUsage.outputTokens': 'Token output: {{count}}',
    'tokenUsage.reasoning': 'Ragionamento: {{count}}',
    'tokenUsage.reportedBy': 'Utilizzo token segnalato dal server di inferenza',
    'tokenUsage.totalTokens': 'Totale token: {{count}}',
    'toolApproval.approve': 'Approva',
    'toolApproval.approveHint': '↵ approva',
    'toolApproval.destructiveOperation': 'Operazione distruttiva',
    'toolApproval.editArguments': 'Modifica parametri',
    'toolApproval.editJson': 'Modifica JSON',
    'toolApproval.enterKey': 'Tasto Invio',
    'toolApproval.escapeKey': 'Tasto Esc',
    'toolApproval.hideEditor': 'Nascondi editor',
    'toolApproval.invalidJson': 'JSON non valido',
    'toolApproval.reject': 'Rifiuta',
    'toolApproval.rejectHint': 'esc per rifiutare',
    'toolApproval.requiresApproval': 'Richiede approvazione',
    'toolApproval.running': 'In esecuzione...',
    'toolApproval.toolExecution': 'Esecuzione strumenti',
    'toolCalls.arguments': 'Parametri',
    'toolCalls.collapseOutput': 'Comprimi output',
    'toolCalls.collapseToolCalls': 'Comprimi chiamate agli strumenti',
    'toolCalls.copiedToClipboard': 'Copiato negli appunti',
    'toolCalls.copy': 'Copia',
    'toolCalls.copyOutput': 'Copia output',
    'toolCalls.expandOutput': 'Espandi output',
    'toolCalls.expandToolCalls': 'Espandi chiamate agli strumenti',
    'toolCalls.output': 'Output',
    'toolCalls.usedTools': '{{count}} strumento/i utilizzato/i',
    'welcomeScreen.emptyPromptHint':
      'Per iniziare, inserisci una domanda qui sotto',
    'welcomeScreen.logoAlt': 'Logo applicazione',
    'welcomeScreen.logoError':
      "Impossibile caricare il logo. Controlla l'URL nelle impostazioni di branding",
  },
});

export default augmentTranslationIt;
