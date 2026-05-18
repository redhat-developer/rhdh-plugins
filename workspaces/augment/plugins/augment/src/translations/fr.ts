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
 * fr translation for plugin.augment.
 * @public
 */
const augmentTranslationFr = createTranslationMessages({
  ref: augmentTranslationRef,
  messages: {
    'adminOnboarding.adminAccessMessage':
      "Vous disposez d'un accès administrateur. Comment souhaitez-vous commencer ?",
    'adminOnboarding.continueToChat': 'Continuez la conversation',
    'adminOnboarding.continueToChatDescription':
      "Utilisez l'assistant IA pour les conversations",
    'adminOnboarding.openCommandCenter': 'Centre de commandement ouvert',
    'adminOnboarding.openCommandCenterDescription':
      'Gérer la base de connaissances, les invites et les paramètres',
    'adminOnboarding.switchHint':
      "Vous pouvez passer d'un mode à l'autre à tout moment grâce au bouton Centre de commandes situé dans la barre latérale.",
    'adminOnboarding.welcomeAdmin': 'Bienvenue, administrateur',
    'agentInfo.connecting': 'Connexion',
    'agentInfo.defaultAgent': 'Agent par défaut',
    'agentInfo.mcpConnected': 'Connecté : {{url}} · {{toolCount}} outils',
    'agentInfo.mcpDisconnected': 'Déconnecté',
    'agentInfo.mcpServers': 'Serveurs MCP ({{connectés}}/{{total}})',
    'agentInfo.offline': 'Hors ligne',
    'agentInfo.ready': 'Prêt',
    'agentInfo.team': 'Équipe ({{count}})',
    'agentInfo.title': "Informations sur l'agent",
    'agentInfo.vectorRag': 'Vector RAG',
    'agentInfo.vectorStoreId': 'Magasin de vecteurs : {{id}}',
    'agentInfo.vectorStoreUnavailable':
      'Boutique Vector indisponible (facultatif)',
    'agentsPanel.adminModified': 'Modifié',
    'agentsPanel.advanced': 'Avancé',
    'agentsPanel.agentInstructions': "Instructions de l'agent",
    'agentsPanel.applyTemplate': 'Appliquer le modèle :',
    'agentsPanel.basePrompt': 'Invite de base',
    'agentsPanel.canDelegateTo': 'Peut déléguer à',
    'agentsPanel.canTransferTo': 'Peut être transféré vers',
    'agentsPanel.capabilities': 'Capacités',
    'agentsPanel.codeInterpreter': 'Interpréteur de code',
    'agentsPanel.confirmRemoveButton': 'Supprimer',
    'agentsPanel.confirmRemoveMessage':
      "Cet agent sera supprimé. Les autres agents qui y font référence verront leurs références validées. Les données ne seront pas enregistrées tant que vous n'aurez pas cliqué sur Enregistrer.",
    'agentsPanel.confirmRemoveTitle': 'Supprimer {{name}} ?',
    'agentsPanel.confirmResetButton': 'Réinitialiser',
    'agentsPanel.confirmResetMessage':
      "Cette opération supprimera toutes les personnalisations d'administration et rétablira les paramètres par défaut. C'est irréversible.",
    'agentsPanel.confirmResetTitle':
      'Réinitialiser les paramètres par défaut ?',
    'agentsPanel.connections': 'Connexions',
    'agentsPanel.createFirstAgent': 'Créez votre premier agent',
    'agentsPanel.createModal.agentId': "ID de l'agent",
    'agentsPanel.createModal.agentIdExists': 'Cet identifiant existe déjà.',
    'agentsPanel.createModal.agentIdHint':
      'Généré automatiquement à partir du nom.',
    'agentsPanel.createModal.cancel': 'Annuler',
    'agentsPanel.createModal.createButton': 'Créer un agent',
    'agentsPanel.createModal.displayName': 'Nom complet',
    'agentsPanel.createModal.displayNamePlaceholder':
      'par exemple, agent de support',
    'agentsPanel.createModal.subtitle':
      'Donnez un nom à votre agent et choisissez éventuellement un modèle pour préremplir les paramètres.',
    'agentsPanel.createModal.templateTitle': 'Commencez par un modèle',
    'agentsPanel.createModal.title': 'Créer un nouvel agent',
    'agentsPanel.delegates': 'délégués',
    'agentsPanel.deleteAgent': "Supprimer l'agent",
    'agentsPanel.inConnections': '{{count}} dans',
    'agentsPanel.inheritBasePrompt': 'Invite de base hériter',
    'agentsPanel.instructions': 'Instructions',
    'agentsPanel.maxTurns': 'Nombre maximal de tours',
    'agentsPanel.mcpServers': 'Serveurs MCP',
    'agentsPanel.modelOverride': 'Remplacement du modèle',
    'agentsPanel.modelOverrideHint': 'Laisser vide pour le modèle global',
    'agentsPanel.newAgent': 'Nouvel agent',
    'agentsPanel.noAgentsSubtitle':
      "Créez votre premier agent pour vous familiariser avec l'orchestration multi-agents.",
    'agentsPanel.noAgentsTitle': 'Aucun agent configuré',
    'agentsPanel.outConnections': '{{compter}} dehors',
    'agentsPanel.rag': 'Base de connaissances',
    'agentsPanel.reset': 'Réinitialiser',
    'agentsPanel.save': 'Enregistrer',
    'agentsPanel.saveSuccess': 'Configuration enregistrée.',
    'agentsPanel.saved': 'Enregistré',
    'agentsPanel.selectAgent': 'Sélectionnez un agent dans la liste',
    'agentsPanel.startingAgent': 'Démarrage de l’agent',
    'agentsPanel.topology': 'Topologie',
    'agentsPanel.transfers': 'transferts',
    'agentsPanel.webSearch': 'Recherche Web',
    'chat.cancelEdit': 'Annuler la modification',
    'chat.copiedToClipboard': 'Copié',
    'chat.copyResponse': 'Copier la réponse',
    'chat.disclaimer':
      "Les réponses générées par l'IA peuvent être inexactes. Vérifiez les informations importantes.",
    'chat.editMessage': 'Modifier le message',
    'chat.emptySessionHint':
      'Posez-moi vos questions, je suis là pour vous aider.',
    'chat.emptySessionTitle': 'Entamez une conversation',
    'chat.messagesUnavailableHint':
      "L'historique des conversations a peut-être expiré. Vous pouvez continuer en envoyant un nouveau message.",
    'chat.messagesUnavailableTitle':
      'Les messages précédents ne sont plus disponibles.',
    'chat.regenerateResponse': 'Réponse régénératrice',
    'chat.submitEdit': 'Soumettre la modification',
    'chat.you': 'Vous',
    'chatInput.attachFile': 'Joindre un fichier',
    'chatInput.chatMessageInput': 'Saisie de messages de chat',
    'chatInput.newConversation': 'Nouvelle conversation',
    'chatInput.newConversationShortcut': 'Nouvelle conversation (⌘⇧O)',
    'chatInput.sendMessage': 'Envoyer un message',
    'chatInput.startNewConversation': 'Entamer une nouvelle conversation',
    'chatInput.stopGeneration': 'Cesser de générer',
    'chatInput.stopMessageGeneration': 'Arrêter la génération de messages',
    'commandCenter.agents': 'Agents',
    'commandCenter.backToChat': 'Retour à la discussion',
    'commandCenter.branding': 'Image de marque',
    'commandCenter.platform': 'Modèles et outils',
    'commandCenter.title': 'Centre de commandement',
    'confirmDialog.cancel': 'Annuler',
    'confirmDialog.confirm': 'Confirmer',
    'conversationHistory.allUsers': 'Tous les utilisateurs',
    'conversationHistory.cancel': 'Annuler',
    'conversationHistory.clearSearch': 'Effacer la recherche',
    'conversationHistory.delete': 'Supprimer',
    'conversationHistory.deleteConversation': 'Supprimer la conversation',
    'conversationHistory.mine': 'Le mien',
    'conversationHistory.noConversationsYet':
      'Vos conversations apparaîtront ici.',
    'conversationHistory.noMatchingConversations':
      'Aucune conversation ne correspond à "{{query}}"',
    'conversationHistory.older': 'Plus vieux',
    'conversationHistory.refresh': 'Actualiser',
    'conversationHistory.refreshAriaLabel':
      "Actualiser l'historique des conversations",
    'conversationHistory.searchPlaceholder': 'Rechercher des conversations...',
    'conversationHistory.startChatting':
      'Lancez une conversation pour démarrer.',
    'conversationHistory.thisWeek': 'Cette semaine',
    'conversationHistory.title':
      '{{count}} conversation{{suffix}} • {{appName}}',
    'conversationHistory.today': "Aujourd'hui",
    'conversationHistory.yesterday': 'Hier',
    'errors.connectionError': 'Erreur de connexion',
    'errors.contentFiltered': 'Contenu filtré',
    'errors.copied': 'Copié',
    'errors.copyErrorDetails': "Copie des détails de l'erreur",
    'errors.error': 'Erreur',
    'errors.networkHint':
      'La connexion au serveur a été perdue. Vérifiez votre réseau et réessayez.',
    'errors.safetyHint':
      'Cette réponse a été bloquée par une politique de sécurité. Essayez de reformuler votre demande.',
    'errors.tryAgain': 'Réessayer',
    'keyboardShortcuts.approvalSection': 'Approbation des outils',
    'keyboardShortcuts.approveTool': "Approuver l'exécution de l'outil",
    'keyboardShortcuts.cancelStreaming': 'Annuler la réponse en streaming',
    'keyboardShortcuts.chatSection': 'Chat',
    'keyboardShortcuts.close': 'Fermer',
    'keyboardShortcuts.focusChatInput': 'Entrée du chat Focus',
    'keyboardShortcuts.newConversation': 'Nouvelle conversation',
    'keyboardShortcuts.rejectTool': "Rejeter l'exécution de l'outil",
    'keyboardShortcuts.showHelp': 'Afficher cette aide',
    'keyboardShortcuts.title': 'Raccourcis clavier',
    'providerOffline.backendUnreachable':
      "{{appName}} est temporairement indisponible. Nous continuerons d'essayer.",
    'providerOffline.modelUnreachable':
      "Le modèle d'IA est actuellement inaccessible. Les messages peuvent ne pas parvenir à destination tant que la connexion n'est pas rétablie.",
    'providerOffline.title': 'Assistant indisponible',
    'ragSources.collapseKnowledgeSources':
      'Réduire les sources de la base de connaissances',
    'ragSources.expandKnowledgeSources':
      'Développer les sources de la base de connaissances',
    'ragSources.sourcesFromVectorRag':
      '{{count}} source(s) de la base de connaissances',
    'ragSources.unknownSource': 'Source inconnue',
    'rightPane.admin': 'Administrateur',
    'rightPane.collapse': 'Réduire',
    'rightPane.collapseSidebar': 'Réduire la barre latérale',
    'rightPane.commandCenter': 'Centre de commandement',
    'rightPane.expand': 'Développer',
    'rightPane.expandSidebar': 'Développer la barre latérale',
    'rightPane.openCommandCenter': 'Centre de commandement ouvert',
    'rightPane.scrollToBottom': 'Défilez vers le bas',
    'securityGate.accessDenied': 'Accès refusé',
    'securityGate.accessDeniedMessage':
      "Vous n'êtes pas autorisé à accéder à {{appName}}. Veuillez contacter votre administrateur pour demander l'accès.",
    'securityGate.configurationErrorLabel': 'Problème de configuration',
    'securityGate.configurationErrors':
      "{{appName}} n'est pas correctement configuré. Veuillez corriger les problèmes suivants :",
    'securityGate.configurationHint':
      'Après avoir mis à jour votre configuration, redémarrez le serveur backend.',
    'securityGate.configurationRequired': 'Configuration requise',
    'streaming.connectingWith': 'Vous mettre en relation avec {{agentName}}',
    'streaming.done': 'Fait',
    'streaming.executingTools': "J'y travaille",
    'streaming.needsApproval': "J'attends votre accord.",
    'streaming.processing': 'Traitement...',
    'streaming.responding': 'Répondre',
    'streaming.searching': 'Recherche',
    'streaming.thinking': 'Réfléchit',
    'streaming.thinkingEllipsis': 'Pensée...',
    'streaming.thoughtFor': 'Pensée pendant {{secondes}} seconde{{suffixe}}',
    'streaming.working': 'Fonctionne',
    'switchDialog.message':
      'Une réponse est en cours de génération. Changer de conversation annulera la réponse en cours. Continuer',
    'switchDialog.stay': 'Rester',
    'switchDialog.switchAnyway': 'Changer de toute façon',
    'switchDialog.title': 'Message en cours',
    'tokenUsage.cached': 'En cache : {{count}}',
    'tokenUsage.inputTokens': "Jetons d'entrée : {{count}}",
    'tokenUsage.outputTokens': 'Jetons de sortie : {{count}}',
    'tokenUsage.reasoning': 'Raisonnement : {{count}}',
    'tokenUsage.reportedBy':
      "Utilisation des jetons signalée par le serveur d'inférence",
    'tokenUsage.totalTokens': 'Nombre total de jetons : {{count}}',
    'toolApproval.approve': 'Approuver',
    'toolApproval.approveHint': '↵ approuver',
    'toolApproval.destructiveOperation': 'Opération destructive',
    'toolApproval.editArguments': 'Modifier les arguments',
    'toolApproval.editJson': 'Modifier le JSON',
    'toolApproval.enterKey': 'Touche Entrée',
    'toolApproval.escapeKey': 'Touche Échap',
    'toolApproval.hideEditor': "Masquer l'éditeur",
    'toolApproval.invalidJson': 'JSON non valide',
    'toolApproval.reject': 'Rejeter',
    'toolApproval.rejectHint': "rejet de l'ESC",
    'toolApproval.requiresApproval': '1 nécessite une approbation',
    'toolApproval.running': "En cours d'exécution...",
    'toolApproval.toolExecution': "Exécution de l'outil",
    'toolCalls.arguments': 'Arguments',
    'toolCalls.collapseOutput': 'Réduire la sortie',
    'toolCalls.collapseToolCalls': "Appels de l'outil de réduction",
    'toolCalls.copiedToClipboard': 'Copié dans le Presse-papiers',
    'toolCalls.copy': 'Copier',
    'toolCalls.copyOutput': 'Copier la sortie',
    'toolCalls.expandOutput': 'Augmenter la sortie',
    'toolCalls.expandToolCalls': "Développer les appels d'outils",
    'toolCalls.output': 'Sortie',
    'toolCalls.usedTools': 'Outil(s) utilisé(s) {{count}}',
    'welcomeScreen.emptyPromptHint':
      'Saisissez votre question ci-dessous pour commencer',
    'welcomeScreen.logoAlt': "Logo de l'application",
    'welcomeScreen.logoError':
      'Impossible de charger le logo — vérifiez l’URL dans les paramètres de marque',
  },
});

export default augmentTranslationFr;
