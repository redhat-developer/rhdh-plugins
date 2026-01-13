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
 * fr translation for plugin.lightspeed.
 * @public
 */
const lightspeedTranslationFr = createTranslationMessages({
  ref: lightspeedTranslationRef,
  messages: {
    'page.title': 'Lightspeed',
    'page.subtitle': 'Assistant de développement AI-POWERED',
    'prompts.codeReadability.title': 'Obtenir de l’aide pour Décrypter le Code',
    'prompts.codeReadability.message':
      'Pourriez-vous me suggérer des techniques qui puissent rendre mon code plus lisible et facile d’entretien?',
    'prompts.debugging.title': 'Aide Débogage',
    'prompts.debugging.message':
      'Mon application me renvoie une erreur lorsque j’essaie de me connecter à la base de données. Pouvez-vous m’aider à identifier le problème?',
    'prompts.developmentConcept.title': 'Expliquer un Concept de développement',
    'prompts.developmentConcept.message':
      'Pourriez-vous m’expliquer comment l’architecture des microservices fonctionne et quels sont ses avantages par rapport à un design monolithic ?',
    'prompts.codeOptimization.title': 'Suggestions d’Optmisation de Code',
    'prompts.codeOptimization.message':
      'Pourriez-vous me suggérer les façons d’optimiser le code pour le rendre plus performant ?',
    'prompts.documentation.title': 'Récapitulatif de la documentation',
    'prompts.documentation.message':
      'Pourriez-vous résumer la documentation d’implémentation de l’authentification 2.0 dans un app web ?',
    'prompts.gitWorkflows.title': 'Flux de travail dans Git',
    'prompts.gitWorkflows.message':
      'Je souhaite changer le code sur une autre branche sans perdre mon travail existant. Quelle est la procédure pour ce faire sans utiliser Git ?',
    'prompts.testingStrategies.title': 'Suggestions de Stratégies pour Tester',
    'prompts.testingStrategies.message':
      'Pourriez-vous me conseiller des stratégies communes pour tester qui puissent rendre mon application robuste et sans erreurs?',
    'prompts.sortingAlgorithms.title':
      'Démystification les Algorithmes de triage',
    'prompts.sortingAlgorithms.message':
      'Pourriez-vous m’expliquer quelle est la différence entre un triage rapide (quicksort) et un triage de regroupement (mergesort), et quand utiliser quoi?',
    'prompts.eventDriven.title': 'Comprendre l’Architecture basée-événement',
    'prompts.eventDriven.message':
      'Pourriez-vous m’expliquer l’architecture basée-événement et quand il faut l’utiliser pour le développement des logiciels?',
    'prompts.tekton.title': 'Déployer avec Tekton',
    'prompts.tekton.message':
      'Pourriez-vous m’aider à automatiser le déploiement de mon application en utilisant les pipelines Tekton ?',
    'prompts.openshift.title': 'Créer un Déploiement Openshift',
    'prompts.openshift.message':
      'Pourriez-vous me guider sur la façon de créer un nouveau développement Openshift pour une application conteneurisée ?',
    'prompts.rhdh.title': 'Guide de Démarrage de Red Hat Developer Hub',
    'prompts.rhdh.message':
      'Pourriez-vous me guider pour les premières étapes de démarrage avec Developer Hub en tant que développeur, comme explorer le Software Catalog et ajouter mon service ?',
    'conversation.delete.confirm.title': 'Supprimer cette conversation ?',
    'conversation.delete.confirm.message':
      'Vous ne verrez plus cette conversation ici. Cela supprimera également les activités associées comme les prompts, réponses, et commentaires de votre activité Lightspeed.',
    'conversation.delete.confirm.action': 'Supprimer',
    'conversation.rename.confirm.title': 'Renommer la conversation ?',
    'conversation.rename.confirm.action': 'Renommer',
    'conversation.rename.placeholder': 'Nom de la conversation',
    'conversation.action.error': 'Erreur: {{error}}',
    'permission.required.title': 'Autorisations manquantes',
    'permission.required.description':
      'Pour afficher le plugin lightspeed, veuillez contacter votre administrateur pour qu’il vous donne les permissions<b>lightspeed.chat.read</b> et <b>lightspeed.chat.create</b> .',
    'disclaimer.withValidation':
      'Cette fonctionnalité utilise la technologie AI. Ne pas inclure d’informations personnelles ou toute autre information sensible dans vos entrées de données. Des interactions pourront être utilisées pour améliorer les produits ou services de Red Hat.',
    'disclaimer.withoutValidation':
      'Cette fonctionnalité utilise la technologie AI. Ne pas inclure d’informations personnelles ou toute autre information sensible dans vos entrées de données. Des interactions pourront être utilisées pour améliorer les produits ou services de Red Hat.',
    'footer.accuracy.label':
      'Toujours vérifier le contenu AI généré avant utilisation.',
    'footer.accuracy.popover.title': 'Vérifier l’exactitude',
    'footer.accuracy.popover.description':
      'Bien que Developer Lightspeed soit orienté sur l’exactitude, il y a toujours possibilité d’erreurs. Il est toujours bon de vérifier les informations critiques à partir de sources de confiance, surtout si c’est crucial pour prendre des décisions ou entreprendre des actions.',
    'footer.accuracy.popover.image.alt':
      'Exemple d’image de note de bas de page popover',
    'footer.accuracy.popover.cta.label': "J'ai compris!",
    'footer.accuracy.popover.link.label': 'En savoir plus',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.readMore': 'En savoir plus',
    'common.noSearchResults': 'Aucun résultat ne correspond à cette demande',
    'menu.newConversation': 'Nouvelle Conversation',
    'chatbox.header.title': 'Developer Lightspeed',
    'chatbox.search.placeholder': 'Recherche',
    'chatbox.provider.other': 'Autre',
    'chatbox.emptyState.noPinnedChats': 'Aucune conversation épinglée',
    'chatbox.emptyState.noRecentChats': 'Aucune conversation récente',
    'chatbox.emptyState.noResults.title': 'Aucun résultat trouvé',
    'chatbox.emptyState.noResults.body':
      'Ajuster votre recherche et essayer à nouveau. Vérifier votre orthographe et essayez un terme plus général.',
    'chatbox.welcome.greeting': 'Hello, {{userName}}',
    'chatbox.welcome.description': 'Comment puis-je vous aider ?',
    'chatbox.message.placeholder':
      'Envoyer un message et télécharger un fichier JSON, YAML, ou TXT...',
    'chatbox.fileUpload.failed': 'Le chargement de fichiers a échoué',
    'chatbox.fileUpload.infoText':
      'Types de fichiers pris en charge: .txt, .yaml, and .json. La taille maximale est de 25 MB.',
    'aria.chatbotSelector': 'Sélecteur Chatbot',
    'aria.important': 'Important',
    'aria.chatHistoryMenu': 'Menu de l’historique de conversations',
    'aria.closeDrawerPanel': 'Fermer le panneau de tiroirs',
    'aria.search.placeholder': 'Recherche',
    'aria.searchPreviousConversations': 'Recherche des anciennes conversations',
    'aria.resize': 'Redimensionnement',
    'aria.options.label': 'Options',
    'aria.scroll.down': 'De haut en bas',
    'aria.scroll.up': 'De bas en haut',
    'aria.settings.label': 'Options Chatbot',
    'aria.close': 'Fermer le chatbot',

    'modal.edit': 'Modifier',
    'modal.save': 'Sauvegarder',
    'modal.close': 'Fermer',
    'modal.cancel': 'Annuler',
    'conversation.delete': 'Supprimer',
    'conversation.rename': 'Renommer',
    'conversation.addToPinnedChats': 'Épingler',
    'conversation.removeFromPinnedChats': 'Détacher',
    'conversation.announcement.userMessage':
      'Message en provenance de l’utilisateur: {{prompt}}. Message en provenance du Bot en cours de chargement.',
    'user.guest': 'Invité',
    'user.loading': '...',
    'tooltip.attach': 'Attacher',
    'tooltip.send': 'Envoyer',
    'tooltip.microphone.active': 'Cessez d’écouter',
    'tooltip.microphone.inactive': 'Utilisez le micro',
    'button.newChat': 'Nouvelle Conversation',
    'tooltip.chatHistoryMenu': 'Menu de l’historique de conversations',
    'tooltip.responseRecorded': 'Réponse enregistrée',
    'tooltip.backToTop': 'De bas en haut',
    'tooltip.backToBottom': 'De haut en bas',
    'tooltip.settings': 'Options Chatbot',
    'tooltip.close': 'Fermer',

    'modal.title.preview': 'Aperçu de la pièce jointe',
    'modal.title.edit': 'Modifier la pièce jointe',
    'icon.lightspeed.alt': 'Icône Lightspeed',
    'icon.permissionRequired.alt': 'icône d’autorisation requise',
    'message.options.label': 'Options',
    'file.upload.error.alreadyExists': 'Le fichier existe déjà',
    'file.upload.error.multipleFiles': 'Télécharger plus d’un fichier.',
    'file.upload.error.unsupportedType':
      'Type de fichier non pris en charge. Types de fichiers pris en charge: .txt, .yaml, and .json.',
    'file.upload.error.fileTooLarge':
      'Votre taille de fichier est trop grande. Veuillez vous assurer que votre fichier soit inférieur à 25MB.',
    'file.upload.error.readFailed':
      'Impossible de lire le fichier : {{errorMessage}}',
    'error.context.fileAttachment':
      'useFileAttachmentContext doit être dans un FileAttachmentContextProvider',
    'feedback.form.title': 'Pourquoi avez-vous sélectionnée cette estimation ?',
    'feedback.form.textAreaPlaceholder':
      'Veuillez-nous offrir des commentaires supplémentaires ?',
    'feedback.form.submitWord': 'Soumettre',
    'feedback.tooltips.goodResponse': 'Bonne réponse',
    'feedback.tooltips.badResponse': 'Mauvaise réponse',
    'feedback.tooltips.copied': 'Copié',
    'feedback.tooltips.copy': 'Copier',
    'feedback.tooltips.listening': 'En cours d’écoute',
    'feedback.tooltips.listen': 'Écouter',
    'feedback.quickResponses.positive.helpful': 'Information utile',
    'feedback.quickResponses.positive.easyToUnderstand': 'Facile à comprendre',
    'feedback.quickResponses.positive.resolvedIssue':
      'A pu résoudre mon problème',
    'feedback.quickResponses.negative.didntAnswer':
      'N’a pas répondu à ma question',
    'feedback.quickResponses.negative.hardToUnderstand':
      'Difficile à comprendre',
    'feedback.quickResponses.negative.notHelpful': 'Peu utile',
    'feedback.completion.title': 'Commentaire soumis',
    'feedback.completion.body':
      'Nous avons reçu votre réponse. Merci de partager vos commentaires avec nous !',
    'conversation.category.pinnedChats': 'Épinglé',
    'conversation.category.recent': 'Récent',
    'settings.pinned.enable': 'Activer les conversations épinglées',
    'settings.pinned.disable': 'Désactiver les conversations épinglées',
    'settings.pinned.enabled.description':
      'Les conversation épinglées sont actuellement activées',
    'settings.pinned.disabled.description':
      'Les conversations épinglées sont actuellement désactivées',

    // Tool calling
    'toolCall.header': "Réponse de l'outil : {{toolName}}",
    'toolCall.thinking': 'A réfléchi pendant {{seconds}} secondes',
    'toolCall.executionTime': "Temps d'exécution : ",
    'toolCall.parameters': 'Paramètres',
    'toolCall.response': 'Réponse',
    'toolCall.showMore': 'afficher plus',
    'toolCall.showLess': 'afficher moins',
    'toolCall.loading': "Exécution de l'outil...",
    'toolCall.executing': "Exécution de l'outil...",
    'toolCall.copyResponse': 'Copier la réponse',
    'toolCall.summary': 'Voici un résumé de votre réponse',
    'toolCall.mcpServer': 'Serveur MCP',
    // Display modes
    'settings.displayMode.label': "Mode d'affichage",
    'settings.displayMode.overlay': 'Superposition',
    'settings.displayMode.docked': 'Ancrer à la fenêtre',
    'settings.displayMode.fullscreen': 'Plein écran',
  },
});

export default lightspeedTranslationFr;
