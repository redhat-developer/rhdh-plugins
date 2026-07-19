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
 * fr translation for plugin.intelligent-assistant.
 * @public
 */
const intelligentAssistantTranslationFr = createTranslationMessages({
  ref: intelligentAssistantTranslationRef,
  messages: {
    'aria.chatHistoryMenu': 'Menu de l’historique de conversations',
    'aria.chatbotSelector': 'Sélecteur Chatbot',
    'aria.close': 'Fermer le chatbot',
    'aria.closeDrawerPanel': 'Fermer le panneau de tiroirs',
    'aria.important': 'Important',
    'aria.options.label': 'Options',
    'aria.resize': 'Redimensionnement',
    'aria.scroll.down': 'De haut en bas',
    'aria.scroll.up': 'De bas en haut',
    'aria.search.placeholder': 'Recherche',
    'aria.searchPreviousConversations': 'Recherche des anciennes conversations',
    'attach.menu.description': 'Attacher un fichier JSON, YAML ou TXT',
    'attach.menu.title': 'Attacher',
    'button.newChat': 'Nouvelle Conversation',
    'chatbox.emptyState.noPinnedChats':
      'Épinglez des conversations pour les garder en haut',
    'chatbox.emptyState.noRecentChats': 'Aucune conversation récente',
    'chatbox.emptyState.noResults.body':
      'Ajuster votre recherche et essayer à nouveau. Vérifier votre orthographe et essayez un terme plus général.',
    'chatbox.emptyState.noResults.title': 'Aucun résultat trouvé',
    'chatbox.fileUpload.failed': 'Le chargement de fichiers a échoué',
    'chatbox.fileUpload.infoText':
      'Types de fichiers pris en charge: .txt, .yaml, and .json. La taille maximale est de 25 MB.',
    'chatbox.header.title': 'Developer Hub Assistant Intelligent',
    'chatbox.message.placeholder': 'Envoyer un message',
    'chatbox.provider.other': 'Autre',
    'chatbox.search.placeholder': 'Recherche',
    'chatbox.welcome.description': 'Comment puis-je vous aider ?',
    'chatbox.welcome.greeting': 'Hello, {{userName}}',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.loading': 'Chargement',
    'common.noSearchResults': 'Aucun résultat ne correspond à cette demande',
    'common.readMore': 'En savoir plus',
    'common.retry': 'Réessayer',
    'conversation.addToPinnedChats': 'Épingler',
    'conversation.announcement.responseStopped': 'Réponse arrêtée.',
    'conversation.announcement.userMessage':
      'Message en provenance de l’utilisateur: {{prompt}}. Message en provenance du Bot en cours de chargement.',
    'conversation.category.pinnedChats': 'Chats épinglés',
    'conversation.category.recent': 'Chats',
    'conversation.delete': 'Supprimer',
    'conversation.delete.confirm.action': 'Supprimer',
    'conversation.delete.confirm.message':
      'Vous ne verrez plus cette conversation ici. Cela supprimera également les activités associées comme les prompts, réponses, et commentaires de votre activité.',
    'conversation.delete.confirm.title': 'Supprimer "{{chatName}}" ?',
    'conversation.removeFromPinnedChats': 'Détacher',
    'conversation.rename': 'Renommer',
    'conversation.rename.confirm.action': 'Renommer',
    'conversation.rename.confirm.title': 'Renommer la conversation ?',
    'conversation.rename.placeholder': 'Nom de la conversation',
    'disclaimer.withValidation':
      'Cette fonctionnalité utilise la technologie AI. Ne pas inclure d’informations personnelles ou toute autre information sensible dans vos entrées de données. Des interactions pourront être utilisées pour améliorer les produits ou services de Red Hat.',
    'disclaimer.withoutValidation':
      'Cette fonctionnalité utilise la technologie AI. Ne pas inclure d’informations personnelles ou toute autre information sensible dans vos entrées de données. Des interactions pourront être utilisées pour améliorer les produits ou services de Red Hat.',
    'error.context.fileAttachment':
      'useFileAttachmentContext doit être dans un FileAttachmentContextProvider',
    'feedback.completion.body':
      'Nous avons reçu votre réponse. Merci de partager vos commentaires avec nous !',
    'feedback.completion.title': 'Commentaire soumis',
    'feedback.form.submitWord': 'Soumettre',
    'feedback.form.textAreaPlaceholder':
      'Veuillez-nous offrir des commentaires supplémentaires ?',
    'feedback.form.title': 'Pourquoi avez-vous sélectionnée cette estimation ?',
    'feedback.quickResponses.negative.didntAnswer':
      'N’a pas répondu à ma question',
    'feedback.quickResponses.negative.hardToUnderstand':
      'Difficile à comprendre',
    'feedback.quickResponses.negative.notHelpful': 'Peu utile',
    'feedback.quickResponses.positive.easyToUnderstand': 'Facile à comprendre',
    'feedback.quickResponses.positive.helpful': 'Information utile',
    'feedback.quickResponses.positive.resolvedIssue':
      'A pu résoudre mon problème',
    'feedback.tooltips.badResponse': 'Mauvaise réponse',
    'feedback.tooltips.copied': 'Copié',
    'feedback.tooltips.copy': 'Copier',
    'feedback.tooltips.goodResponse': 'Bonne réponse',
    'feedback.tooltips.listen': 'Écouter',
    'feedback.tooltips.listening': 'En cours d’écoute',
    'file.upload.error.alreadyExists': 'Le fichier existe déjà',
    'file.upload.error.fileTooLarge':
      'Votre taille de fichier est trop grande. Veuillez vous assurer que votre fichier soit inférieur à 25MB.',
    'file.upload.error.multipleFiles': 'Télécharger plus d’un fichier.',
    'file.upload.error.readFailed':
      'Impossible de lire le fichier : {{errorMessage}}',
    'file.upload.error.unsupportedType':
      'Type de fichier non pris en charge. Types de fichiers pris en charge: .txt, .yaml, and .json.',
    'footer.accuracy.label':
      'Toujours vérifier le contenu AI généré avant utilisation.',
    'icon.lightspeed.alt': 'Icône de l\u2019assistant intelligent',
    'icon.permissionRequired.alt': 'icône d’autorisation requise',
    'lcore.loadError.description':
      "Le backend de l\u2019assistant intelligent n'a pas renvoyé de liste de modèles. Vérifiez que le service est démarré et joignable, puis réessayez.",
    'lcore.loadError.title': 'Impossible de charger les modèles',
    'lcore.notConfigured.backendDocs':
      'Configuration du backend de l\u2019assistant intelligent',
    'lcore.notConfigured.description':
      "L\u2019assistant intelligent nécessite un LLM enregistré. Contactez l'administrateur de la plateforme de votre organisation pour finaliser la configuration.",
    'lcore.notConfigured.developerLightspeedDocs':
      'Configuration de Developer Hub Intelligent Assistant',
    'lcore.notConfigured.title': 'Connectez un LLM pour commencer',
    'mcp.settings.closeAriaLabel': 'Fermer les paramètres MCP',
    'mcp.settings.closeConfigureModalAriaLabel':
      'Fermer la fenêtre de configuration',
    'mcp.settings.configureServerTitle': 'Configurer le serveur {{serverName}}',
    'mcp.settings.edit': 'Modifier',
    'mcp.settings.editServerAriaLabel': 'Modifier {{serverName}}',
    'mcp.settings.enabled': 'Activé',
    'mcp.settings.enterToken': 'Saisissez votre jeton',
    'mcp.settings.loading': 'Chargement des serveurs MCP...',
    'mcp.settings.modalDescription':
      'Les identifiants sont chiffrés au repos et limités à votre profil. L\u2019assistant intelligent fonctionnera avec exactement vos autorisations.',
    'mcp.settings.modalDescriptionDcr':
      'Ce serveur utilise Dynamic Client Registration (DCR). Les jetons sont générés automatiquement à partir de votre identité Backstage — aucun jeton manuel n\u2019est nécessaire.',
    'mcp.settings.name': 'Nom',
    'mcp.settings.noneAvailable': 'Aucun serveur MCP disponible.',
    'mcp.settings.personalAccessToken': "Jeton d'accès personnel",
    'mcp.settings.readOnlyAccess':
      'Vous disposez d’un accès en lecture seule aux serveurs MCP.',
    'mcp.settings.removePersonalToken': 'Supprimer le jeton personnel',
    'mcp.settings.savedToken': 'Jeton enregistré',
    'mcp.settings.selectedCount':
      '{{selectedCount}} sur {{totalCount}} sélectionnés',
    'mcp.settings.status': 'Statut',
    'mcp.settings.status.disabled': 'Désactivé',
    'mcp.settings.status.failed': 'Échec',
    'mcp.settings.status.manyTools': '{{count}} outils',
    'mcp.settings.status.oneTool': '{{count}} outil',
    'mcp.settings.status.tokenRequired': 'Jeton requis',
    'mcp.settings.status.unknown': 'Inconnu',
    'mcp.settings.tableAriaLabel': 'Tableau des serveurs MCP',
    'mcp.settings.title': 'Serveurs MCP',
    'mcp.settings.toggleServerAriaLabel': 'Basculer {{serverName}}',
    'mcp.settings.token.clearAriaLabel': 'Effacer la saisie du jeton',
    'mcp.settings.token.connectionSuccessful': 'Connexion réussie',
    'mcp.settings.token.invalidCredentials':
      'Identifiants invalides. Vérifiez l’URL du serveur et le jeton.',
    'mcp.settings.token.savingAndValidating':
      'Enregistrement et validation du jeton...',
    'mcp.settings.token.urlUnavailableForValidation':
      'Impossible de valider le jeton car l’URL du serveur n’est pas disponible.',
    'mcp.settings.token.validating': 'Validation du jeton...',
    'mcp.settings.token.validationFailed':
      'Échec de la validation. Vérifiez l’URL du serveur et le jeton.',
    'mcp.settings.usingAdminCredential':
      'Les identifiants fournis par l’administrateur sont utilisés. Saisissez un jeton personnel pour les remplacer pour votre compte.',
    'menu.newConversation': 'Nouvelle Conversation',
    'message.options.label': 'Options',
    'modal.cancel': 'Annuler',
    'modal.close': 'Fermer',
    'modal.edit': 'Modifier',
    'modal.save': 'Sauvegarder',
    'modal.title.edit': 'Modifier la pièce jointe',
    'modal.title.preview': 'Aperçu de la pièce jointe',
    'notebook.document.delete': 'Supprimer',
    'notebook.document.delete.action': 'Supprimer',
    'notebook.document.delete.description':
      'Êtes-vous sûr de vouloir supprimer <documentName/> de ce carnet ? Cette action est irréversible.',
    'notebook.document.delete.success':
      '« {{documentName}} » supprimé avec succès.',
    'notebook.document.delete.title': 'Supprimer la ressource ?',
    'notebook.overwrite.modal.action': 'Écraser',
    'notebook.overwrite.modal.description':
      'Les fichiers suivants existent déjà dans ce carnet. Voulez-vous les écraser avec les nouvelles versions ?',
    'notebook.overwrite.modal.title': 'Écraser les fichiers ?',
    'notebook.upload.error.fileTooLarge':
      'Erreur de chargement : la taille du fichier dépasse la limite de 25 Mo.',
    'notebook.upload.error.tooManyFiles':
      'Erreur de chargement : {{max}} fichiers maximum autorisés.',
    'notebook.upload.error.unsupportedType':
      'Erreur de chargement : type(s) de fichier non pris en charge. Veuillez charger uniquement des types de fichiers pris en charge.',
    'notebook.upload.failed': 'Échec du chargement de "{{fileName}}".',
    'notebook.upload.modal.addButton': 'Ajouter ({{count}})',
    'notebook.upload.modal.browseButton': 'Charger',
    'notebook.upload.modal.dragDropTitle': 'Glissez-déposez les fichiers ici',
    'notebook.upload.modal.infoText':
      'Types de fichiers acceptés : .md, .txt, .pdf, .json, .yaml, .log',
    'notebook.upload.modal.removeFile': 'Supprimer {{fileName}}',
    'notebook.upload.modal.selectedFiles':
      '{{count}} sur {{max}} fichiers sélectionnés',
    'notebook.upload.modal.separator': 'ou',
    'notebook.upload.modal.title': 'Ajouter un document au carnet',
    'notebook.view.close': 'Fermer le carnet',
    'notebook.view.documents.add': 'Ajouter',
    'notebook.view.documents.count': '{{count}} Documents',
    'notebook.view.documents.maxReached':
      'Maximum 10 documents autorisés. Supprimez un document pour en charger un nouveau.',
    'notebook.view.documents.uploading': 'Chargement du document',
    'notebook.view.input.disabledTooltip':
      'Sélectionnez au moins une ressource chargée pour commencer à discuter',
    'notebook.view.input.placeholder':
      'Posez des questions sur vos documents...',
    'notebook.view.sidebar.collapse': 'Réduire la barre latérale',
    'notebook.view.sidebar.expand': 'Développer la barre latérale',
    'notebook.view.sidebar.resize': 'Redimensionner la barre latérale',
    'notebook.view.title': 'Carnet sans titre',
    'notebook.view.upload.action': 'Charger une ressource',
    'notebook.view.processing.description':
      'Vos fichiers sont en cours d’indexation. Vous pourrez poser des questions une fois le traitement terminé.',
    'notebook.view.processing.heading': 'Traitement des ressources...',
    'notebook.view.upload.heading': 'Chargez une ressource pour commencer',
    'notebooks.actions.delete': 'Supprimer',
    'notebooks.actions.rename': 'Renommer',
    'notebooks.card.openAria': 'Ouvrir le carnet {{name}}',
    'notebooks.delete.action': 'Supprimer',
    'notebooks.delete.message':
      'Vous ne verrez plus ce carnet ici. Cela supprimera également l’activité associée comme les requêtes, réponses et retours depuis votre activité.',
    'notebooks.delete.title': 'Supprimer {{name}} ?',
    'notebooks.delete.toast': 'Carnet supprimé !',
    'notebooks.documents': 'Documents',
    'notebooks.empty.action': 'Créer un nouveau carnet',
    'notebooks.empty.description':
      'Créez un nouveau carnet pour organiser vos sources et générer des informations alimentées par l’IA.',
    'notebooks.empty.title': 'Aucun carnet créé',
    'notebooks.prompts.accessIssue.title': "Aidez-moi avec un problème d'accès",
    'notebooks.prompts.coreConcepts.title':
      'Quels sont les concepts fondamentaux ?',
    'notebooks.prompts.vulnerabilities.title':
      'Afficher mes vulnérabilités critiques',
    'notebooks.rename.action': 'Envoyer',
    'notebook.rename.inline.tooltip': 'Double-cliquez pour renommer',
    'notebook.rename.inline.success': '"{{notebookName}}" renommé avec succès.',
    'notebook.rename.inline.error': 'Échec du renommage de "{{notebookName}}".',
    'notebooks.rename.description':
      'Veuillez saisir le nouveau nom de ce carnet et cliquer sur Envoyer pour continuer.',
    'notebooks.rename.label': 'Nouveau nom',
    'notebooks.rename.placeholder': 'Nouveau nom',
    'notebooks.rename.title': 'Renommer {{name}} ?',
    'notebooks.title': 'Mes carnets',
    'notebooks.updated.days': 'Mis à jour il y a {{days}} jours',
    'notebooks.updated.on': 'Mis à jour le',
    'notebooks.updated.today': 'Mis à jour aujourd’hui',
    'notebooks.updated.yesterday': 'Mis à jour il y a 1 jour',
    'page.subtitle': 'Assistant de développement AI-POWERED',
    'page.title': 'Assistant intelligent',
    'permission.notebooks.goBack': 'Retour',
    'permission.required.description':
      "Pour afficher <subject/>, veuillez contacter votre administrateur pour qu'il vous donne la permission <permissions/>.",
    'permission.required.title': 'Autorisations manquantes',
    'permission.subject.notebooks':
      'les carnets de l\u2019assistant intelligent',
    'permission.subject.plugin': 'le plugin de l\u2019assistant intelligent',
    'prompts.codeOptimization.message':
      'Pourriez-vous me suggérer les façons d’optimiser le code pour le rendre plus performant ?',
    'prompts.codeOptimization.title': 'Suggestions d’Optmisation de Code',
    'prompts.codeReadability.message':
      'Pourriez-vous me suggérer des techniques qui puissent rendre mon code plus lisible et facile d’entretien?',
    'prompts.codeReadability.title': 'Obtenir de l’aide pour Décrypter le Code',
    'prompts.debugging.message':
      'Mon application me renvoie une erreur lorsque j’essaie de me connecter à la base de données. Pouvez-vous m’aider à identifier le problème?',
    'prompts.debugging.title': 'Aide Débogage',
    'prompts.developmentConcept.message':
      'Pourriez-vous m’expliquer comment l’architecture des microservices fonctionne et quels sont ses avantages par rapport à un design monolithic ?',
    'prompts.developmentConcept.title': 'Expliquer un Concept de développement',
    'prompts.documentation.message':
      'Pourriez-vous résumer la documentation d’implémentation de l’authentification 2.0 dans un app web ?',
    'prompts.documentation.title': 'Récapitulatif de la documentation',
    'prompts.eventDriven.message':
      'Pourriez-vous m’expliquer l’architecture basée-événement et quand il faut l’utiliser pour le développement des logiciels?',
    'prompts.eventDriven.title': 'Comprendre l’Architecture basée-événement',
    'prompts.gitWorkflows.message':
      'Je souhaite changer le code sur une autre branche sans perdre mon travail existant. Quelle est la procédure pour ce faire sans utiliser Git ?',
    'prompts.gitWorkflows.title': 'Flux de travail dans Git',
    'prompts.openshift.message':
      'Pourriez-vous me guider sur la façon de créer un nouveau développement Openshift pour une application conteneurisée ?',
    'prompts.openshift.title': 'Créer un Déploiement Openshift',
    'prompts.rhdh.message':
      'Pourriez-vous me guider pour les premières étapes de démarrage avec Developer Hub en tant que développeur, comme explorer le Software Catalog et ajouter mon service ?',
    'prompts.rhdh.title': 'Guide de Démarrage de Red Hat Developer Hub',
    'prompts.sortingAlgorithms.message':
      'Pourriez-vous m’expliquer quelle est la différence entre un triage rapide (quicksort) et un triage de regroupement (mergesort), et quand utiliser quoi?',
    'prompts.sortingAlgorithms.title':
      'Démystification les Algorithmes de triage',
    'prompts.tekton.message':
      'Pourriez-vous m’aider à automatiser le déploiement de mon application en utilisant les pipelines Tekton ?',
    'prompts.tekton.title': 'Déployer avec Tekton',
    'prompts.testingStrategies.message':
      'Pourriez-vous me conseiller des stratégies communes pour tester qui puissent rendre mon application robuste et sans erreurs?',
    'prompts.testingStrategies.title': 'Suggestions de Stratégies pour Tester',
    'reasoning.thinking': 'Afficher la réflexion',
    'settings.displayMode.docked': 'Ancrer à la fenêtre',
    'settings.displayMode.fullscreen': 'Plein écran',
    'settings.displayMode.label': "Mode d'affichage",
    'settings.displayMode.overlay': 'Superposition',
    'settings.mcp.badge': 'Nouveau',
    'settings.mcp.label': 'Paramètres MCP',
    'settings.pinned.disable': 'Désactiver les conversations épinglées',
    'settings.pinned.disabled.description':
      'Les conversations épinglées sont actuellement désactivées',
    'settings.pinned.enable': 'Activer les conversations épinglées',
    'settings.pinned.enabled.description':
      'Les conversation épinglées sont actuellement activées',
    'sort.alphabeticalAsc': 'Nom (A-Z)',
    'sort.alphabeticalDesc': 'Nom (Z-A)',
    'sort.label': 'Trier les conversations',
    'sort.newest': 'Date (plus récent en premier)',
    'sort.oldest': 'Date (plus ancien en premier)',
    'sources.chip.label_one': '{{count}} Source',
    'sources.chip.label_other': '{{count}} Sources',
    'sources.modal.description':
      'Les sources suivantes ont été utilisées pour générer cette réponse IA et fournir des informations complémentaires\u00a0:',
    'sources.modal.title': 'Sources',
    'sources.popover.closeAriaLabel': 'Fermer les sources',
    'tabs.ariaLabel': 'Vues de l\u2019assistant intelligent',
    'tabs.chat': 'Chat',
    'tabs.notebooks': 'Carnets',
    'tabs.notebooks.devPreview': 'Aperçu développeur',
    'tabs.notebooks.empty': 'Le contenu des carnets s’affichera ici.',
    'toolCall.copyResponse': 'Copier la réponse',
    'toolCall.executing': "Exécution de l'outil...",
    'toolCall.executionTime': "Temps d'exécution : ",
    'toolCall.header': "Réponse de l'outil : {{toolName}}",
    'toolCall.loading': "Exécution de l'outil...",
    'toolCall.mcpServer': 'Serveur MCP',
    'toolCall.parameters': 'Paramètres',
    'toolCall.response': 'Réponse',
    'toolCall.showLess': 'afficher moins',
    'toolCall.showMore': 'afficher plus',
    'toolCall.summary': 'Voici un résumé de votre réponse',
    'toolCall.thinking': 'A réfléchi pendant {{seconds}} secondes',
    'tooltip.attach': 'Attacher',
    'tooltip.backToBottom': 'De haut en bas',
    'tooltip.backToTop': 'De bas en haut',
    'tooltip.chatHistoryMenu': 'Menu de l’historique de conversations',
    'tooltip.close': 'Fermer',
    'tooltip.collapseHistoryPanel': "Réduire l'historique du chat",
    'tooltip.expandHistoryPanel': "Développer l'historique du chat",
    'tooltip.fab.close': 'Fermer l\u2019assistant intelligent',
    'tooltip.fab.open': 'Ouvrir l\u2019assistant intelligent',
    'tooltip.microphone.active': 'Cessez d’écouter',
    'tooltip.microphone.inactive': 'Utilisez le micro',
    'tooltip.quickNewChat': 'Nouveau chat',
    'tooltip.responseRecorded': 'Réponse enregistrée',
    'tooltip.send': 'Envoyer',
    'user.guest': 'Invité',
    'user.loading': '...',
  },
});

export default intelligentAssistantTranslationFr;
