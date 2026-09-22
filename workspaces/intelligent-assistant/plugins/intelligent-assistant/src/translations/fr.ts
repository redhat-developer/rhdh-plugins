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
    'aria.chatHistoryMenu': "Menu de l'historique des conversations",
    'modelSelector.visionScreenshot.line1': "Analyse d'images prise en charge.",
    'modelSelector.visionScreenshot.line2':
      "Une capture d'écran sera jointe à votre message.",
    'modelSelector.visionScreenshot.ariaLabel':
      "Contexte de capture d'écran du modèle vision",
    'modelSelector.disabledTooltip':
      "Chaque session de chat ne prend en charge qu'un seul modèle. Pour changer de modèle, ouvrez une nouvelle conversation.",
    'aria.chatbotSelector': 'Sélecteur de chatbot',
    'aria.close': 'Fermer Chatbot',
    'aria.closeDrawerPanel': 'Panneau de tiroir fermé',
    'aria.important': 'important',
    'aria.options.label': 'Options',
    'aria.resize': 'Redimensionner',
    'aria.scroll.down': 'Retour en bas',
    'aria.scroll.up': 'Retour en haut de page',
    'aria.search.placeholder': 'Recherche',
    'aria.searchPreviousConversations':
      'Rechercher les conversations précédentes',
    'attach.menu.description': 'Joignez un fichier JSON, YAML ou TXT',
    'attach.menu.title': 'Attacher',
    'button.newChat': 'Nouvelle conversation',
    'chatbox.emptyState.noPinnedChats':
      'Épinglez les discussions pour les garder en haut de la liste.',
    'chatbox.emptyState.noRecentChats': 'Aucune discussion récente',
    'chatbox.emptyState.noResults.body':
      'Modifiez votre requête de recherche et réessayez. Vérifiez votre orthographe ou essayez un terme plus général.',
    'chatbox.emptyState.noResults.title': 'Aucun résultat trouvé',
    'chatbox.fileUpload.failed': 'Échec du chargement du fichier',
    'chatbox.fileUpload.infoText':
      'Les types de fichiers pris en charge sont : .txt, .yaml et .json. La taille maximale des fichiers est de 25 Mo.',
    'chatbox.header.title': 'Assistant intelligent du centre de développement',
    'chatbox.message.placeholder': 'Envoyer un message',
    'chatbox.provider.other': 'Autre',
    'chatbox.search.placeholder': 'Recherche',
    'chatbox.welcome.description': "Comment puis-je vous aider aujourd'hui ?",
    'chatbox.welcome.greeting': 'Bonjour, {{userName}}',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.loading': 'Chargement',
    'common.noSearchResults': 'Aucun résultat ne correspond à la recherche',
    'common.readMore': 'En savoir plus',
    'common.retry': 'Réessayer',
    'conversation.addToPinnedChats': 'Pin',
    'conversation.announcement.responseStopped': 'Réponse interrompue.',
    'conversation.announcement.userMessage':
      "Message de l'utilisateur : {{prompt}}. Message du bot en cours de chargement.",
    'conversation.category.pinnedChats': 'Discussions épinglées',
    'conversation.category.recent': 'Discussions',
    'conversation.category.savedPrompts': 'Prompts enregistrés',
    'conversation.delete': 'Supprimer',
    'conversation.delete.confirm.action': 'Supprimer',
    'conversation.delete.confirm.message':
      'Vous ne verrez plus cette conversation ici. Cela supprimera également les activités connexes telles que les invites, les réponses et les commentaires relatifs à votre activité.',
    'conversation.delete.confirm.title': 'Supprimer "{{chatName}}" ?',
    'conversation.removeFromPinnedChats': 'Détacher',
    'conversation.rename': 'Rebaptiser',
    'conversation.rename.confirm.action': 'Rebaptiser',
    'conversation.rename.confirm.title': 'Renommer la conversation ?',
    'conversation.rename.placeholder': 'Nom du chat',
    disclaimer:
      'Cette fonctionnalité utilise la technologie AI. Ne pas inclure d’informations personnelles ou toute autre information sensible dans vos entrées de données. Des interactions pourront être utilisées pour améliorer les produits ou services de Red Hat.',
    'error.context.fileAttachment':
      'La méthode useFileAttachmentContext doit être définie dans un FileAttachmentContextProvider.',
    'feedback.completion.body':
      "Nous avons reçu votre réponse. Merci d'avoir partagé vos commentaires !",
    'feedback.completion.title': 'Commentaires soumis',
    'feedback.form.submitWord': 'Envoyer',
    'feedback.form.textAreaPlaceholder':
      'Fournir des commentaires supplémentaires facultatifs',
    'feedback.form.title': 'Pourquoi avez-vous choisi cette note ?',
    'feedback.quickResponses.negative.didntAnswer':
      "N'a pas répondu à ma question",
    'feedback.quickResponses.negative.hardToUnderstand':
      'Difficile à comprendre',
    'feedback.quickResponses.negative.notHelpful': 'Pas utile',
    'feedback.quickResponses.positive.easyToUnderstand': 'Facile à comprendre',
    'feedback.quickResponses.positive.helpful': 'Informations utiles',
    'feedback.quickResponses.positive.resolvedIssue':
      'Mon problème est résolu.',
    'feedback.tooltips.badResponse': 'Mauvaise réponse',
    'feedback.tooltips.copied': 'Copié',
    'feedback.tooltips.copy': 'Copier',
    'feedback.tooltips.goodResponse': 'Bonne réponse',
    'feedback.tooltips.listen': 'Listen',
    'feedback.tooltips.listening': 'Listening',
    'file.upload.error.alreadyExists': 'Le fichier existe déjà.',
    'file.upload.error.fileTooLarge':
      'La taille de votre fichier est trop importante. Veuillez vous assurer que votre fichier fait moins de 25 Mo.',
    'file.upload.error.multipleFiles':
      'Plusieurs fichiers ont été téléchargés.',
    'file.upload.error.readFailed':
      'Impossible de lire le fichier : {{errorMessage}}',
    'file.upload.error.unsupportedType':
      'Type de fichier non pris en charge. Les types pris en charge sont : .txt, .yaml et .json.',
    'footer.accuracy.label':
      "Toujours vérifier le contenu généré par l'IA avant utilisation.",
    'icon.lightspeed.alt': "icône d'assistant intelligent",
    'lcore.loadError.description':
      "Le système d'assistance intelligent n'a pas renvoyé de liste de modèles. Vérifiez que le service est en cours d'exécution et accessible, puis réessayez.",
    'lcore.loadError.title': 'Impossible de charger les modèles',
    'lcore.notConfigured.backendDocs':
      "Configuration du backend de l'assistant intelligent",
    'lcore.notConfigured.description':
      "L'assistant intelligent requiert un LLM enregistré. Contactez l'administrateur de la plateforme de votre organisation pour finaliser la configuration.",
    'lcore.notConfigured.developerLightspeedDocs':
      "Configuration de l'assistant intelligent du Developer Hub",
    'lcore.notConfigured.title': 'Connectez-vous à un LLM pour commencer',
    'mcp.settings.closeAriaLabel': 'Fermer les paramètres MCP',
    'mcp.settings.closeConfigureModalAriaLabel':
      'Fermer la fenêtre modale de configuration',
    'mcp.settings.configureServerTitle':
      'Paramètres du serveur MCP {{serverName}}',
    'mcp.settings.edit': 'Modifier',
    'mcp.settings.editServerAriaLabel': 'Modifier {{serverName}}',
    'mcp.settings.enabled': 'Activé',
    'mcp.settings.enterToken': 'Saisissez votre jeton',
    'mcp.settings.loading': 'Chargement des serveurs MCP...',
    'mcp.settings.modalDescription':
      'Les identifiants sont chiffrés et les opérations utilisent vos autorisations exactes.',
    'mcp.settings.modalDescriptionDcr':
      "Ce serveur utilise l'enregistrement dynamique des clients (DCR). Les jetons sont créés automatiquement à l'aide de votre identité Backstage ; aucun jeton manuel n'est nécessaire.",
    'mcp.settings.authenticationToken': "Jeton d'authentification",
    'mcp.settings.modal.authenticationHeading': 'Authentification',
    'mcp.settings.modal.credentialMode.organization':
      "Utiliser le jeton par défaut de l'organisation",
    'mcp.settings.modal.credentialMode.organizationDescription':
      'Utilise le jeton configuré par votre administrateur.',
    'mcp.settings.modal.credentialMode.personal': 'Utiliser un jeton personnel',
    'mcp.settings.modal.toolsHeading': 'Outils ({{count}})',
    'mcp.settings.modal.loadingTools': 'Chargement des outils...',
    'mcp.settings.modal.fetchingStatus': 'Récupération du statut...',
    'mcp.settings.modal.loadingStatus': 'Déconnexion...',
    'mcp.settings.modal.tokenRemovedWarning':
      'Le jeton a été supprimé. Pour réutiliser ce serveur MCP, veuillez fournir un nouveau jeton.',
    'mcp.settings.modal.noToolsAvailable': 'Aucun outil disponible.',
    'mcp.settings.modal.toolsLoadFailed': 'Échec du chargement des outils.',
    'mcp.settings.modal.enabledDescription':
      'Ce serveur est actif et le chat est disponible.',
    'mcp.settings.modal.enabledDescriptionOff':
      'Ce serveur est désactivé et indisponible dans le chat.',
    'mcp.settings.modal.enabledDescriptionTokenRequired':
      'Ce serveur est actuellement désactivé. Fournissez un jeton pour activer.',
    'mcp.settings.name': 'Nom',
    'mcp.settings.noneAvailable': 'Aucun serveur MCP disponible.',
    'mcp.settings.personalAccessToken': "Jeton d'accès personnel",
    'mcp.settings.removePersonalToken': 'Supprimer le jeton personnel',
    'mcp.settings.savedToken': 'Jeton enregistré',
    'mcp.settings.selectedCount':
      '{{selectedCount}} sur {{totalCount}} sélectionnés',
    'mcp.settings.status': 'Statut',
    'mcp.settings.status.disabled': 'Désactivé',
    'mcp.settings.status.failed': 'Ayant échoué',
    'mcp.settings.status.manyTools': '{{count}} outils',
    'mcp.settings.status.oneTool': '{{count}} outil',
    'mcp.settings.status.tokenRequired': 'Jeton requis',
    'mcp.settings.status.unknown': 'Inconnu',
    'mcp.settings.tableAriaLabel': 'Tableau des serveurs MCP',
    'mcp.settings.title': 'Serveurs MCP',
    'mcp.settings.toggleServerAriaLabel': 'Basculer {{serverName}}',
    'mcp.settings.token.clearAriaLabel': 'Supprimer les entrées du jeton',
    'mcp.settings.token.connectionSuccessful': 'Connexion réussie',
    'mcp.settings.token.invalidCredentials':
      "Informations d’identification non valides Vérifiez l'URL du serveur et le jeton.",
    'mcp.settings.token.savingAndValidating':
      'Enregistrement et validation du jeton...',
    'mcp.settings.token.urlUnavailableForValidation':
      "Impossible de valider le jeton car l'URL du serveur n'est pas disponible.",
    'mcp.settings.token.validating': 'Validation du jeton...',
    'mcp.settings.token.validationFailed':
      "Échec de la validation Vérifiez l'URL du serveur et le jeton.",
    'menu.newConversation': 'Nouvelle conversation',
    'message.options.label': 'Options',
    'modal.cancel': 'Annuler',
    'modal.close': 'Fermer',
    'modal.edit': 'Modifier',
    'modal.save': 'Enregistrer',
    'modal.title.edit': 'Modifier la pièce jointe',
    'modal.title.preview': 'Aperçu de la pièce jointe',
    'notebook.document.rename': 'Rebaptiser',
    'notebook.document.rename.tooltip': 'Cliquez pour renommer',
    'notebook.document.rename.error':
      'Impossible de renommer « {{documentName}} ».',
    'notebook.document.rename.conflict': 'Ce nom existe déjà.',
    'notebook.document.rename.tooLong': 'Nom trop long (max. 255 caractères).',
    'notebook.document.delete': 'Supprimer',
    'notebook.document.delete.action': 'Supprimer',
    'notebook.document.delete.description':
      'Êtes-vous sûr de vouloir supprimer <documentName/> de ce carnet ? Cette action est irréversible.',
    'notebook.document.delete.success': '"{{documentName}}" supprimé.',
    'notebook.document.delete.title': 'Supprimer la ressource ?',
    'notebook.overwrite.modal.action': 'Téléverser ({{count}})',
    'notebook.overwrite.modal.back': 'Précédent',
    'notebook.overwrite.modal.description':
      'Ce bloc-notes contient déjà {{duplicateCount}} fichiers. {{newCount}} nouvelles ressources seront ajoutées malgré tout.',
    'notebook.overwrite.modal.ignore': 'Ignorer les fichiers dupliqués',
    'notebook.overwrite.modal.replace': 'Remplacer les fichiers existants',
    'notebook.overwrite.modal.title': 'Le fichier existe déjà.',
    'notebook.overwrite.modal.title.one': 'Le fichier existe déjà.',
    'notebook.overwrite.modal.title.other': 'Les fichiers existent déjà.',
    'notebook.overwrite.modal.description.one':
      '{{duplicateCount}} fichiers existent déjà dans ce notebook. {{newCount}} nouvelles ressources seront ajoutées malgré tout.',
    'notebook.overwrite.modal.description.other':
      'Ce bloc-notes contient déjà {{duplicateCount}} fichiers. {{newCount}} nouvelles ressources seront ajoutées malgré tout.',
    'notebook.upload.error.fileTooLarge':
      'Erreur de chargement : la taille du fichier dépasse la limite de 25 Mo.',
    'notebook.upload.error.tooManyFiles':
      'Erreur de chargement : Nombre maximal de fichiers autorisés : {{max}}.',
    'notebook.upload.error.unsupportedType':
      'Erreur de chargement : Type(s) de fichier(s) non pris en charge détecté(s). Veuillez ne télécharger que les types de fichiers pris en charge.',
    'notebook.upload.failed': 'Échec du chargement de {{fileName}}.',
    'notebook.upload.modal.addButton': 'Ajouter ({{count}})',
    'notebook.upload.modal.addButtonEmpty': 'Ajouter',
    'notebook.upload.modal.browseButton': 'Télécharger',
    'notebook.upload.modal.dragDropTitle':
      'Glissez-déposez les fichiers ici, ou cliquez pour parcourir',
    'notebook.upload.modal.infoText':
      'Types de fichiers acceptés : .md, .txt, .pdf, .json, .yaml, .log',
    'notebook.upload.modal.maxFileSize':
      'La taille maximale du fichier est de 25 Mo.',
    'notebook.upload.modal.supportedFormats': 'Formats pris en charge :',
    'notebook.upload.modal.removeFile': 'Supprimer {{fileName}}',
    'notebook.upload.modal.selectedFiles':
      '{{count}} des {{max}} fichiers sélectionnés',
    'notebook.upload.modal.separator': 'ou',
    'notebook.upload.modal.title': 'Ajouter des ressources',
    'notebook.view.close': 'Fermer le carnet',
    'notebook.view.documents.add': 'Ajouter',
    'notebook.view.documents.count_one': '{{count}} Ressource',
    'notebook.view.documents.count_other': '{{count}} Ressources',
    'notebook.view.documents.maxReached':
      'Un maximum de 10 ressources est autorisé. Supprimez une ressource pour en télécharger une nouvelle.',
    'notebook.view.documents.uploading': 'Téléchargement de ressources',
    'notebook.view.documents.uploadsInProgress':
      "Veuillez patienter jusqu'à la fin des chargements en cours avant d'ajouter d'autres ressources.",
    'notebook.view.input.disabledTooltip':
      'Sélectionnez au moins une ressource chargée pour commencer à discuter.',
    'notebook.view.input.placeholder': 'Renseignez-vous sur vos ressources...',
    'notebook.view.sidebar.collapse': 'Réduire la barre latérale',
    'notebook.view.sidebar.expand': 'Développer la barre latérale',
    'notebook.view.sidebar.resize': 'Redimensionner la barre latérale',
    'notebook.view.title': 'Carnet sans titre',
    'notebook.view.upload.action': 'Ajouter une ressource',
    'notebook.view.processing.description':
      "Vos fichiers sont en cours d'indexation. Vous pourrez commencer à poser des questions une fois le traitement terminé.",
    'notebook.view.processing.heading': 'Ressources de traitement...',
    'notebook.view.upload.heading': 'Ajoutez une ressource pour commencer',
    'notebooks.actions.delete': 'Supprimer',
    'notebooks.actions.rename': 'Rebaptiser',
    'notebooks.card.openAria': 'Ouvrir le bloc-notes {{name}}',
    'notebooks.delete.action': 'Supprimer',
    'notebooks.delete.message':
      'Vous ne verrez plus ce carnet ici. Cela supprimera également les activités connexes telles que les invites, les réponses et les commentaires relatifs à votre activité.',
    'notebooks.delete.title': 'Supprimer {{name}} ?',
    'notebooks.delete.toast': 'Carnet supprimé !',
    'notebooks.documents_one': '{{count}} Ressource',
    'notebooks.documents_other': '{{count}} Ressources',
    'notebooks.empty.action': 'Créer un nouveau bloc-notes',
    'notebooks.empty.description':
      "Créez un nouveau bloc-notes pour organiser vos sources et générer des analyses grâce à l'IA.",
    'notebooks.empty.title': 'Aucun carnet créé',
    'notebooks.prompts.accessIssue.title':
      "Aidez-moi à résoudre un problème d'accès",
    'notebooks.prompts.coreConcepts.title':
      'Quels sont les concepts fondamentaux ?',
    'notebooks.prompts.vulnerabilities.title':
      'Afficher mes vulnérabilités critiques',
    'notebooks.rename.inline.tooltip': 'Cliquez pour renommer',
    'notebooks.rename.inline.error':
      'Impossible de renommer « {{notebookName}} ».',
    'notebooks.title': 'Mes carnets',
    'notebooks.updated.days': 'Mis à jour il y a {{days}} jours',
    'notebooks.updated.on': 'Mise à jour le',
    'notebooks.updated.today': "Mise à jour aujourd'hui",
    'notebooks.updated.yesterday': 'Mis à jour il y a 1 jour',
    'page.subtitle': "Assistant de développement basé sur l'IA",
    'page.title': 'assistant intelligent',
    'prompts.codeOptimization.message':
      "Pouvez-vous suggérer des méthodes courantes d'optimisation du code pour obtenir de meilleures performances ?",
    'prompts.codeOptimization.title': "Suggestions d'optimisation du code",
    'prompts.codeReadability.message':
      'Pouvez-vous me suggérer des techniques pour rendre mon code plus lisible et plus facile à maintenir ?',
    'prompts.codeReadability.title':
      "Obtenez de l'aide sur la lisibilité du code",
    'prompts.debugging.message':
      "Mon application génère une erreur lors de la tentative de connexion à la base de données. Pouvez-vous m'aider à identifier le problème ?",
    'prompts.debugging.title': "Obtenez de l'aide pour le débogage",
    'prompts.developmentConcept.message':
      "Pouvez-vous expliquer le fonctionnement de l'architecture microservices et ses avantages par rapport à une conception monolithique ?",
    'prompts.developmentConcept.title': 'Expliquer un concept de développement',
    'prompts.documentation.message':
      "Pouvez-vous résumer la documentation relative à la mise en œuvre de l'authentification OAuth 2.0 dans une application web ?",
    'prompts.documentation.title': 'Résumé de la documentation',
    'prompts.eventDriven.message':
      "Pouvez-vous expliquer ce qu'est une architecture événementielle et dans quels cas il est avantageux de l'utiliser dans le développement logiciel ?",
    'prompts.eventDriven.title': "Comprendre l'architecture événementielle",
    'prompts.gitWorkflows.message':
      "Je souhaite apporter des modifications au code d'une autre branche sans perdre mon travail existant. Quelle est la procédure à suivre pour réaliser cela avec Git ?",
    'prompts.gitWorkflows.title': 'Flux de travail avec Git',
    'prompts.openshift.message':
      "Pouvez-vous me guider dans la création d'un nouveau déploiement dans OpenShift pour une application conteneurisée ?",
    'prompts.openshift.title': 'Créer un déploiement OpenShift',
    'prompts.rhdh.message':
      'Pouvez-vous me guider à travers les premières étapes pour commencer à utiliser Developer Hub en tant que développeur, comme explorer le catalogue de logiciels et ajouter mon service ?',
    'prompts.rhdh.title': 'Premiers pas avec Red Hat Developer Hub',
    'prompts.sortingAlgorithms.message':
      "Pouvez-vous expliquer la différence entre un algorithme de tri rapide et un algorithme de tri fusion, et quand utiliser l'un ou l'autre ?",
    'prompts.sortingAlgorithms.title': 'Démystifier les algorithmes de tri',
    'prompts.tekton.message':
      "Pouvez-vous m'aider à automatiser le déploiement de mon application à l'aide de pipelines Tekton ?",
    'prompts.tekton.title': 'Déploiement avec Tekton',
    'prompts.testingStrategies.message':
      'Pouvez-vous me recommander des stratégies de test courantes qui permettront de rendre mon application robuste et sans erreur ?',
    'prompts.testingStrategies.title': 'Proposer des stratégies de test',
    'reasoning.thinking': 'Montrer sa réflexion',
    'settings.displayMode.docked': 'Ancrer à la fenêtre',
    'settings.displayMode.fullscreen': 'Plein écran',
    'settings.displayMode.label': "Mode d'affichage",
    'settings.displayMode.overlay': 'Recouvrir',
    'settings.mcp.badge': 'Nouveau',
    'settings.panel.title': 'Paramètres',
    'settings.mcp.label': 'Paramètres MCP',
    'settings.prompt.label': 'Paramètres de prompts',
    'settings.pinned.disable': 'Désactiver les discussions épinglées',
    'settings.pinned.disabled.description':
      'Les discussions épinglées sont actuellement désactivées.',
    'settings.pinned.enable': 'Activer les discussions épinglées',
    'settings.pinned.enabled.description':
      'Les discussions épinglées sont actuellement activées.',
    'settings.savedPrompts.disable': 'Désactiver les prompts sauvegardés',
    'settings.savedPrompts.disabled.description':
      'Les prompts sauvegardés sont actuellement désactivés',
    'settings.savedPrompts.enable': 'Activer les prompts sauvegardés',
    'settings.savedPrompts.enabled.description':
      'Les prompts sauvegardés sont actuellement activés',
    'settings.screenContext.enable': "Activer le contexte d'écran",
    'settings.screenContext.disable': "Désactiver le contexte d'écran",
    'settings.screenContext.enabled.description':
      "Le partage du contexte d'écran est actuellement activé",
    'settings.screenContext.disabled.description':
      "Le partage du contexte d'écran est actuellement désactivé",
    'contextChip.label.paused': 'Contexte : en pause',
    'contextChip.label.unavailable': 'Contexte : indisponible',
    'contextChip.label.softwareTemplates': 'Modèles logiciels',
    'contextChip.tooltip.askAbout': 'Posez une question sur {{label}}.',
    'contextChip.tooltip.template':
      'Demandez comment remplir le modèle {{label}}.',
    'contextChip.tooltip.search':
      'Posez une question sur votre recherche : {{label}}.',
    'contextChip.tooltip.paused':
      "Le contexte d'écran est en pause. Cliquez pour reprendre le partage de votre écran actuel avec l'assistant intelligent.",
    'contextChip.tooltip.unavailable':
      "Le contexte d'écran n'est pas disponible en mode plein écran. Passez en mode Superposition ou Ancrer à la fenêtre pour l'activer.",
    'contextChip.tooltip.line2.fullContext':
      "Le texte de la page et une capture d'écran seront envoyés avec votre message.",
    'contextChip.tooltip.line2.adminLimited':
      "Le partage du contexte d'écran est limité par les paramètres de l'administrateur.",
    'contextChip.tooltip.line2.screenshotOnly':
      "L'extraction de texte est désactivée par votre administrateur. Capture d'écran uniquement.",
    'contextChip.tooltip.line2.domOffNoVision':
      "L'extraction de texte est désactivée par votre administrateur. Votre modèle ne prend pas en charge l'analyse d'images.",
    'contextChip.tooltip.line2.textOnlyNoVision':
      "Contexte texte uniquement – votre modèle ne prend pas en charge l'analyse d'images.",
    'contextChip.tooltip.line2.textOnlyAdminScreenshotsOff':
      "Contexte texte uniquement – la capture d'écran est désactivée par votre administrateur.",
    'contextChip.tooltip.line2.textOnlyCombined':
      "Contexte texte uniquement – votre modèle ne prend pas en charge l'analyse d'images et la capture d'écran est désactivée par votre administrateur.",
    'contextChip.aria.pause': "Mettre en pause le contexte d'écran : {{label}}",
    'contextChip.aria.resume': "Reprendre le contexte d'écran",
    'savedPrompts.tab.title': 'Prompts enregistrés',
    'savedPrompts.disabled.title': 'Les prompts enregistrés sont désactivés',
    'savedPrompts.disabled.body':
      "Les prompts enregistrés sont masqués dans le panneau d'historique des conversations. Activez-les pour afficher vos prompts dans la barre latérale.",
    'savedPrompts.disabled.enableLink': 'Activer les prompts enregistrés',
    'savedPrompts.count.zero': 'Aucun prompt',
    'savedPrompts.count_one': '1 prompt',
    'savedPrompts.count_other': '{{count}} prompts',
    'savedPrompts.newPrompt': '+ Nouveau prompt',
    'savedPrompts.form.titleLabel': 'Titre',
    'savedPrompts.form.titlePlaceholder': 'Titre du prompt',
    'savedPrompts.form.contentLabel': 'Prompt',
    'savedPrompts.form.contentPlaceholder': 'Contenu du prompt',
    'savedPrompts.form.save': 'Enregistrer',
    'savedPrompts.form.cancel': 'Annuler',
    'savedPrompts.validation.titleMaxLength':
      'Le titre doit contenir {{max}} caractères ou moins.',
    'savedPrompts.validation.contentMaxLength':
      'Le prompt doit contenir {{max}} caractères ou moins.',
    'savedPrompts.limitReached':
      'Limite de prompts atteinte. Supprimez un prompt existant pour en créer un nouveau.',
    'savedPrompts.actions.apply': 'Appliquer dans la zone de saisie',
    'savedPrompts.actions.send': 'Envoyer directement',
    'savedPrompts.actions.sendDisabledStreaming':
      'Attendez la fin de la réponse',
    'savedPrompts.actions.delete': 'Supprimer',
    'savedPrompts.actions.menuAriaLabel': 'Actions pour {{name}}',
    'savedPrompts.delete.confirm.title': 'Supprimer « {{name}} » ?',
    'savedPrompts.delete.confirm.message':
      'Ce prompt sauvegardé sera définitivement supprimé.',
    'savedPrompts.delete.confirm.action': 'Supprimer',
    'savedPrompts.empty.description':
      'Enregistrez les prompts fréquemment utilisés pour les réutiliser rapidement dans vos conversations sans les retaper. Les prompts sauvegardés apparaissent également dans le panneau d’historique du chat pour un accès rapide.',
    'savedPrompts.sidebar.showAll': 'Tout afficher',
    'savedPrompts.sidebar.showLess': 'Afficher moins',
    'savedPrompts.sidebar.openSettings':
      'Ouvrir les paramètres des prompts enregistrés',
    'savedPrompts.sidebar.empty': 'Aucun prompt enregistré pour le moment',
    'sort.alphabeticalAsc': 'Nom (AZ)',
    'sort.alphabeticalDesc': 'Nom (ZA)',
    'sort.label': 'Trier les conversations',
    'sort.newest': 'Date (du plus récent au plus ancien)',
    'sort.oldest': 'Date (du plus ancien au plus récent)',
    'sources.chip.label_one': '{{count}} Source',
    'sources.chip.label_other': '{{count}} Sources',
    'sources.modal.description':
      "Les sources suivantes ont été utilisées pour générer cette réponse de l'IA et fournir des informations complémentaires :",
    'sources.modal.title': 'Sources',
    'sources.popover.closeAriaLabel': 'Sources proches',
    'tabs.ariaLabel': "vues de l'assistant intelligent",
    'tabs.chat': 'Chat',
    'tabs.notebooks': 'Cahiers',
    'tabs.notebooks.devPreview': 'Aperçu du développeur',
    'tabs.notebooks.empty': "Le contenu des carnets s'affiche ici.",
    'toolCall.copyResponse': 'Copier la réponse',
    'toolCall.executing': "Outil d'exécution...",
    'toolCall.executionTime': "Temps d'exécution : ",
    'toolCall.header': "Réponse de l'outil : {{toolName}}",
    'toolCall.loading': "Outil d'exécution...",
    'toolCall.mcpServer': 'Serveur MCP',
    'toolCall.parameters': 'Paramètres',
    'toolCall.response': 'Réponse',
    'toolCall.showLess': 'afficher moins',
    'toolCall.showMore': 'afficher davantage',
    'toolCall.summary': 'Voici un résumé de votre réponse',
    'toolCall.thinking': 'Pensée pendant {{secondes}} secondes',
    'tooltip.attach': 'Attacher',
    'tooltip.backToBottom': 'Retour en bas',
    'tooltip.backToTop': 'Retour en haut de page',
    'tooltip.chatHistoryMenu': "Menu de l'historique des conversations",
    'tooltip.close': 'Fermer',
    'tooltip.collapseHistoryPanel': "Réduire l'historique des conversations",
    'tooltip.expandHistoryPanel': "Développer l'historique des conversations",
    'tooltip.fab.close': 'Assistant intelligent proche',
    'tooltip.fab.open': 'Assistant intelligent ouvert',
    'tooltip.microphone.active': "Arrêtez d'écouter",
    'tooltip.microphone.inactive': 'Utilisez le microphone',
    'tooltip.quickNewChat': 'Nouvelle conversation',
    'tooltip.responseRecorded': 'Réponse enregistrée',
    'tooltip.send': 'Envoyer',
    'tooltip.settings': 'Options Chatbot',
    'user.guest': 'Invité',
    'user.loading': '...',
  },
});

export default intelligentAssistantTranslationFr;
