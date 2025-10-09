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
 * French translation for Developer Lightspeed.
 * @public
 */
const lightspeedTranslationFr = createTranslationMessages({
  ref: lightspeedTranslationRef,
  messages: {
    // Page titles and headers
    'page.title': 'Lightspeed',
    'page.subtitle': "Assistant de développement alimenté par l'IA",

    // Sample prompts - General Development
    'prompts.codeReadability.title':
      "Obtenir de l'aide sur la lisibilité du code",
    'prompts.codeReadability.message':
      'Pouvez-vous suggérer des techniques que je peux utiliser pour rendre mon code plus lisible et maintenable ?',
    'prompts.debugging.title': "Obtenir de l'aide pour le débogage",
    'prompts.debugging.message':
      "Mon application lance une erreur lors de la tentative de connexion à la base de données. Pouvez-vous m'aider à identifier le problème ?",
    'prompts.developmentConcept.title': 'Expliquer un concept de développement',
    'prompts.developmentConcept.message':
      "Pouvez-vous expliquer comment fonctionne l'architecture des microservices et ses avantages par rapport à une conception monolithique ?",
    'prompts.codeOptimization.title': 'Suggérer des optimisations de code',
    'prompts.codeOptimization.message':
      "Pouvez-vous suggérer des moyens courants d'optimiser le code pour obtenir de meilleures performances ?",
    'prompts.documentation.title': 'Résumé de la documentation',
    'prompts.documentation.message':
      "Pouvez-vous résumer la documentation pour implémenter l'authentification OAuth 2.0 dans une application web ?",
    'prompts.gitWorkflows.title': 'Flux de travail avec Git',
    'prompts.gitWorkflows.message':
      'Je veux apporter des modifications au code sur une autre branche sans perdre mon travail existant. Quelle est la procédure pour faire cela en utilisant Git ?',
    'prompts.testingStrategies.title': 'Suggérer des stratégies de test',
    'prompts.testingStrategies.message':
      'Pouvez-vous recommander des stratégies de test courantes qui rendront mon application robuste et sans erreur ?',
    'prompts.sortingAlgorithms.title': 'Démystifier les algorithmes de tri',
    'prompts.sortingAlgorithms.message':
      'Pouvez-vous expliquer la différence entre un algorithme de tri rapide et un algorithme de tri par fusion, et quand utiliser chacun ?',
    'prompts.eventDriven.title':
      "Comprendre l'architecture orientée événements",
    'prompts.eventDriven.message':
      "Pouvez-vous expliquer ce qu'est l'architecture orientée événements et quand il est bénéfique de l'utiliser dans le développement de logiciels ?",

    // Sample prompts - RHDH Specific
    'prompts.tekton.title': 'Déployer avec Tekton',
    'prompts.tekton.message':
      "Pouvez-vous m'aider à automatiser le déploiement de mon application en utilisant des pipelines Tekton ?",
    'prompts.openshift.title': 'Créer un déploiement OpenShift',
    'prompts.openshift.message':
      "Pouvez-vous me guider à travers la création d'un nouveau déploiement dans OpenShift pour une application conteneurisée ?",
    'prompts.rhdh.title': 'Commencer avec Red Hat Developer Hub',
    'prompts.rhdh.message':
      'Pouvez-vous me guider à travers les premières étapes pour commencer à utiliser Developer Hub en tant que développeur, comme explorer le Catalogue de Logiciels et ajouter mon service ?',

    // Conversation history
    'conversation.history.confirm.title': 'Supprimer le chat ?',
    'conversation.history.confirm.message':
      "Vous ne verrez plus ce chat ici. Cela supprimera également l'activité connexe comme les invites, les réponses et les commentaires de votre Activité Lightspeed.",
    'conversation.history.confirm.delete': 'Supprimer',

    // Permissions
    'permission.required.title': 'Permissions manquantes',
    'permission.required.description':
      "Pour voir le plugin lightspeed, contactez votre administrateur pour qu'il vous donne les permissions <b>lightspeed.chat.read</b> et <b>lightspeed.chat.create</b>.",

    // Disclaimers
    'disclaimer.withValidation':
      "Developer Lightspeed peut répondre à des questions sur de nombreux sujets en utilisant vos modèles configurés. Les réponses de Developer Lightspeed sont influencées par la documentation de Red Hat Developer Hub, mais Developer Lightspeed n'a pas accès à votre Catalogue de Logiciels, TechDocs ou Modèles, etc. Developer Lightspeed utilise la validation des questions (invites) pour s'assurer que les conversations restent axées sur des sujets techniques pertinents pour Red Hat Developer Hub, tels que Backstage, Kubernetes et OpenShift. N'incluez pas d'informations personnelles ou sensibles dans votre saisie. Les interactions avec Developer Lightspeed peuvent être examinées et utilisées pour améliorer les produits ou services.",
    'disclaimer.withoutValidation':
      "Developer Lightspeed peut répondre à des questions sur de nombreux sujets en utilisant vos modèles configurés. Les réponses de Developer Lightspeed sont influencées par la documentation de Red Hat Developer Hub, mais Developer Lightspeed n'a pas accès à votre Catalogue de Logiciels, TechDocs ou Modèles, etc. N'incluez pas d'informations personnelles ou sensibles dans votre saisie. Les interactions avec Developer Lightspeed peuvent être examinées et utilisées pour améliorer les produits ou services.",

    // Footer and feedback
    'footer.accuracy.label':
      "Vérifiez toujours l'exactitude des réponses générées par l'IA/LLM avant de les utiliser.",
    'footer.accuracy.popover.title': "Vérifier l'exactitude",
    'footer.accuracy.popover.description':
      "Bien que Developer Lightspeed s'efforce d'être exact, il y a toujours une possibilité d'erreurs. C'est une bonne pratique de vérifier les informations critiques auprès de sources fiables, surtout si c'est crucial pour la prise de décision ou les actions.",
    'footer.accuracy.popover.image.alt':
      "Image d'exemple pour le popover de note de bas de page",
    'footer.accuracy.popover.cta.label': 'Compris',
    'footer.accuracy.popover.link.label': 'En savoir plus',

    // Common actions
    'common.cancel': 'Annuler',

    // Menu items
    'menu.newConversation': 'Nouveau Chat',

    // Chat-specific UI elements
    'chatbox.header.title': 'Developer Lightspeed',
    'chatbox.search.placeholder': 'Rechercher dans les chats précédents...',
    'chatbox.welcome.greeting': 'Bonjour, {{userName}}',
    'chatbox.welcome.description': "Comment puis-je vous aider aujourd'hui ?",
    'chatbox.message.placeholder':
      'Envoyez un message et téléchargez optionnellement un fichier JSON, YAML, TXT ou XML...',
    'chatbox.fileUpload.failed': 'Le téléchargement du fichier a échoué',
    'chatbox.fileUpload.infoText':
      'Les types de fichiers pris en charge sont : .txt, .yaml, .json et .xml. La taille maximale du fichier est de 25 Mo.',

    // Accessibility and ARIA labels
    'aria.chatbotSelector': 'Sélecteur de chatbot',
    'aria.important': 'Important',

    // Modal actions
    'modal.edit': 'Modifier',
    'modal.save': 'Enregistrer',
    'modal.close': 'Fermer',
    'modal.cancel': 'Annuler',

    // Conversation actions
    'conversation.delete': 'Supprimer',
    'conversation.announcement.userMessage':
      "Message de l'utilisateur : {{prompt}}. Le message du bot se charge.",

    // User states
    'user.guest': 'Invité',
    'user.loading': '...',

    // Button tooltips and labels
    'tooltip.attach': 'Joindre',
    'tooltip.send': 'Envoyer',
    'tooltip.microphone.active': "Arrêter d'écouter",
    'tooltip.microphone.inactive': 'Utiliser le microphone',
    'button.newChat': 'Nouveau chat',

    // Modal titles
    'modal.title.preview': 'Aperçu de la pièce jointe',
    'modal.title.edit': 'Modifier la pièce jointe',

    // Alt texts for icons
    'icon.lightspeed.alt': 'icône lightspeed',
    'icon.permissionRequired.alt': 'icône de permission requise',

    // Message utilities
    'message.options.label': 'Options',

    // File attachment errors
    'file.upload.error.alreadyExists': 'Le fichier existe déjà.',
    'file.upload.error.multipleFiles': "Plus d'un fichier a été téléchargé.",
    'file.upload.error.unsupportedType':
      'Type de fichier non pris en charge. Les types pris en charge sont : .txt, .yaml, .json et .xml.',
    'file.upload.error.fileTooLarge':
      'La taille de votre fichier est trop importante. Veuillez vous assurer que votre fichier fait moins de 25 Mo.',
    'file.upload.error.readFailed':
      'Échec de la lecture du fichier : {{errorMessage}}',

    // Developer error messages
    'error.context.fileAttachment':
      'useFileAttachmentContext doit être dans un FileAttachmentContextProvider',

    // Feedback actions
    'feedback.form.title': 'Pourquoi avez-vous choisi cette évaluation ?',
    'feedback.form.textAreaPlaceholder':
      'Fournissez des commentaires supplémentaires optionnels',
    'feedback.form.submitWord': 'Soumettre',
    'feedback.tooltips.goodResponse': 'Bonne Réponse',
    'feedback.tooltips.badResponse': 'Mauvaise Réponse',
    'feedback.tooltips.copied': 'Copié',
    'feedback.tooltips.copy': 'Copier',
    'feedback.tooltips.listening': 'Écoute',
    'feedback.tooltips.listen': 'Écouter',
    'feedback.quickResponses.positive.helpful': 'Informations utiles',
    'feedback.quickResponses.positive.easyToUnderstand': 'Facile à comprendre',
    'feedback.quickResponses.positive.resolvedIssue': 'A résolu mon problème',
    'feedback.quickResponses.negative.didntAnswer':
      "N'a pas répondu à ma question",
    'feedback.quickResponses.negative.hardToUnderstand':
      'Difficile à comprendre',
    'feedback.quickResponses.negative.notHelpful': 'Pas utile',
    'feedback.completion.title': 'Feedback soumis',
    'feedback.completion.body':
      'Nous avons reçu votre réponse. Merci de partager votre feedback !',

    // Conversation categorization
    'conversation.category.today': "Aujourd'hui",
    'conversation.category.yesterday': 'Hier',
    'conversation.category.previous7Days': '7 derniers jours',
    'conversation.category.previous30Days': '30 derniers jours',
  },
});

export default lightspeedTranslationFr;
