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
 * de translation for plugin.lightspeed.
 * @public
 */
const lightspeedTranslationDe = createTranslationMessages({
  ref: lightspeedTranslationRef,
  messages: {
    'page.title': 'Lightspeed',
    'page.subtitle': 'KI-gestützter Entwicklungsassistent',
    'tabs.ariaLabel': 'Lightspeed-Ansichten',
    'tabs.chat': 'Chat',
    'tabs.notebooks': 'Notizbücher',
    'tabs.notebooks.empty': 'Inhalte der Notizbücher kommen hierhin.',
    'notebooks.title': 'Meine Notizbücher',
    'notebooks.empty.title': 'Keine erstellten Notizbücher',
    'notebooks.empty.description':
      'Erstellen Sie ein neues Notizbuch, um Ihre Quellen zu organisieren und KI-gestützte Erkenntnisse zu gewinnen.',
    'notebooks.empty.action': 'Neues Notizbuch erstellen',
    'notebooks.documents': 'Dokumente',
    'notebooks.actions.rename': 'Umbenennen',
    'notebooks.actions.delete': 'Löschen',
    'notebooks.rename.title': '{{name}} umbenennen?',
    'notebooks.rename.description':
      'Bitte geben Sie den neuen Namen für dieses Notizbuch ein und klicken Sie auf „Senden“, um fortzufahren.',
    'notebooks.rename.label': 'Neuer Name',
    'notebooks.rename.placeholder': 'Neuer Name',
    'notebooks.rename.action': 'Senden',
    'notebooks.delete.title': '{{name}} löschen?',
    'notebooks.delete.message':
      'Dieses Notizbuch wird hier nicht mehr angezeigt. Dadurch werden auch zugehörige Aktivitäten wie Eingaben, Antworten und Feedback aus Ihrer Lightspeed-Aktivität gelöscht.',
    'notebooks.delete.action': 'Löschen',
    'notebooks.delete.toast': 'Notizbuch gelöscht!',
    'notebooks.updated.today': 'Heute aktualisiert',
    'notebooks.updated.yesterday': 'Vor 1 Tag aktualisiert',
    'notebooks.updated.days': 'Vor {{days}} Tagen aktualisiert',
    'notebooks.updated.on': 'Aktualisiert am',

    // Notebook view
    'notebook.view.title': 'Unbenanntes Notizbuch',
    'notebook.view.close': 'Notizbuch schließen',
    'notebook.view.documents.count': '{{count}} Dokumente',
    'notebook.view.documents.add': 'Hinzufügen',
    'notebook.view.upload.heading':
      'Laden Sie eine Ressource hoch, um zu beginnen',
    'notebook.view.upload.action': 'Ressource hochladen',
    'notebook.view.input.placeholder': 'Fragen Sie zu Ihren Dokumenten...',
    'notebook.view.sidebar.collapse': 'Seitenleiste einklappen',
    'notebook.view.sidebar.expand': 'Seitenleiste ausklappen',
    'notebook.view.sidebar.resize': 'Größe der Seitenleiste ändern',
    'notebook.view.documents.uploading': 'Dokument wird hochgeladen',
    'notebook.upload.success': '{{fileName}} erfolgreich hochgeladen.',
    'notebook.upload.failed': 'Hochladen von {{fileName}} fehlgeschlagen.',

    // Notebook upload modal
    'notebook.upload.modal.title': 'Dokument zum Notizbuch hinzufügen',
    'notebook.upload.modal.dragDropTitle': 'Dateien hierher ziehen und ablegen',
    'notebook.upload.modal.browseButton': 'Hochladen',
    'notebook.upload.modal.infoText':
      'Akzeptierte Dateitypen: .md, .txt, .pdf, .json, .yaml, .log',
    'notebook.upload.error.unsupportedType':
      'Upload-Fehler: Nicht unterstützte Dateitypen gefunden. Bitte laden Sie nur unterstützte Dateitypen hoch.',
    'notebook.upload.error.fileTooLarge':
      'Upload-Fehler: Dateigröße überschreitet das Limit von 25 MB.',
    'notebook.upload.error.tooManyFiles':
      'Upload-Fehler: Maximal {{max}} Dateien erlaubt.',

    // Notebook overwrite modal
    'notebook.overwrite.modal.title': 'Dateien überschreiben?',
    'notebook.overwrite.modal.description':
      'Die folgenden Dateien existieren bereits in diesem Notizbuch. Möchten Sie sie mit den neuen Versionen überschreiben?',
    'notebook.overwrite.modal.action': 'Überschreiben',
    'notebook.document.delete': 'Löschen',

    'prompts.codeReadability.title': 'Hilfe zur Code-Lesbarkeit erhalten',
    'prompts.codeReadability.message':
      'Können Sie mir Techniken vorschlagen, mit denen ich meinen Code lesbarer und wartungsfreundlicher gestalten kann?',
    'prompts.debugging.title': 'Hilfe beim Debuggen erhalten',
    'prompts.debugging.message':
      'Meine Anwendung gibt beim Versuch einer Verbindung zur Datenbank einen Fehler aus. Können Sie mir helfen, das Problem zu identifizieren?',
    'prompts.developmentConcept.title': 'Ein Entwicklungskonzept erläutern',
    'prompts.developmentConcept.message':
      'Können Sie erklären, wie eine Microservices-Architektur funktioniert und welche Vorteile sie gegenüber einem monolithischen Design bietet?',
    'prompts.codeOptimization.title':
      'Vorschläge zur Codeoptimierung unterbreiten',
    'prompts.codeOptimization.message':
      'Können Sie gängige Methoden zur Codeoptimierung vorschlagen, um eine bessere Performance zu erzielen?',
    'prompts.documentation.title': 'Zusammenfassung von Dokumentation',
    'prompts.documentation.message':
      'Können Sie die Dokumentation zur Implementierung der OAuth 2.0-Authentifizierung in einer Webanwendung zusammenfassen?',
    'prompts.gitWorkflows.title': 'Workflows mit Git',
    'prompts.gitWorkflows.message':
      'Ich möchte Änderungen am Code in einem anderen Branch vornehmen, ohne meine bestehende Arbeit zu verlieren. Wie geht man dabei mit Git vor?',
    'prompts.testingStrategies.title': 'Teststrategien vorschlagen',
    'prompts.testingStrategies.message':
      'Können Sie mir einige gängige Teststrategien empfehlen, die meine Anwendung robust und fehlerfrei machen?',
    'prompts.sortingAlgorithms.title':
      'Sortieralgorithmen verständlich erklären',
    'prompts.sortingAlgorithms.message':
      'Können Sie den Unterschied zwischen Quicksort und Mergesort erklären und wann man welchen Algorithmus verwendet?',
    'prompts.eventDriven.title': 'Ereignisgesteuerte Architektur verstehen',
    'prompts.eventDriven.message':
      'Können Sie erklären, was ereignisgesteuerte Architektur bedeutet und wann ihre Verwendung in der Softwareentwicklung von Vorteil ist?',
    'prompts.tekton.title': 'Mit Tekton deployen',
    'prompts.tekton.message':
      'Können Sie mir helfen, das Deployment meiner Anwendung mithilfe von Tekton-Pipelines zu automatisieren?',
    'prompts.openshift.title': 'OpenShift-Deployment erstellen',
    'prompts.openshift.message':
      'Können Sie mich bei der Erstellung eines neuen Deployments in OpenShift für eine containerisierte Anwendung unterstützen?',
    'prompts.rhdh.title': 'Erste Schritte mit dem Red Hat Developer Hub',
    'prompts.rhdh.message':
      'Können Sie mich bei den ersten Schritten zur Nutzung des Developer Hub als Entwickler unterstützen, z. B. beim Erkunden des Softwarekatalogs und beim Hinzufügen meines Dienstes?',
    'conversation.delete.confirm.title': 'Chat löschen?',
    'conversation.delete.confirm.message':
      'Dieser Chat wird hier nicht mehr angezeigt. Dadurch werden auch zugehörige Aktivitäten wie Prompts, Antworten und Feedback aus Ihrer Lightspeed-Aktivität gelöscht.',
    'conversation.delete.confirm.action': 'Löschen',
    'conversation.rename.confirm.title': 'Chat umbenennen?',
    'conversation.rename.confirm.action': 'Umbenennen',
    'conversation.rename.placeholder': 'Chatname',
    'permission.required.title': 'Fehlende Berechtigungen',
    'permission.required.description':
      'Um <subject/> anzuzeigen, wenden Sie sich an Ihren Administrator, um die Berechtigung <permissions/> zu erhalten.',
    'permission.subject.plugin': 'das Lightspeed-Plugin',
    'permission.subject.notebooks': 'die Lightspeed-Notizbücher',
    'permission.notebooks.goBack': 'Zurück',
    'disclaimer.withValidation':
      'Diese Funktion nutzt KI-Technologie. Geben Sie bei Ihrer Eingabe keine persönlichen oder sonstigen sensiblen Informationen an. Interaktionen können dazu genutzt werden, die Produkte oder Dienstleistungen von Red Hat zu verbessern.',
    'disclaimer.withoutValidation':
      'Diese Funktion nutzt KI-Technologie. Geben Sie bei Ihrer Eingabe keine persönlichen oder sonstigen sensiblen Informationen an. Interaktionen können dazu genutzt werden, die Produkte oder Dienstleistungen von Red Hat zu verbessern.',
    'footer.accuracy.label':
      'KI-generierte Inhalte sollten vor der Verwendung stets überprüft werden.',
    'common.cancel': 'Abbrechen',
    'common.close': 'Schließen',
    'common.readMore': 'Mehr lesen',
    'common.noSearchResults': 'Keine Ergebnisse, die der Suche entsprechen',
    'menu.newConversation': 'Neuer Chat',
    'chatbox.header.title': 'Developer Lightspeed',
    'chatbox.search.placeholder': 'Suchen',
    'chatbox.provider.other': 'Andere',
    'chatbox.emptyState.noPinnedChats': 'Keine angehefteten Chats',
    'chatbox.emptyState.noRecentChats': 'Keine letzten Chats',
    'chatbox.emptyState.noResults.title': 'Keine Ergebnisse gefunden',
    'chatbox.emptyState.noResults.body':
      'Passen Sie Ihre Suchanfrage an, und versuchen Sie es erneut. Überprüfen Sie Ihre Rechtschreibung, oder versuchen Sie es mit einem allgemeineren Begriff.',
    'chatbox.welcome.greeting': 'Hallo {{userName}}',
    'chatbox.welcome.description': 'Wie kann ich Ihnen heute helfen?',
    'chatbox.message.placeholder':
      'Senden Sie eine Nachricht, und laden Sie optional eine JSON-, YAML- oder TXT-Datei hoch ...',
    'chatbox.fileUpload.failed': 'Datei-Upload fehlgeschlagen',
    'chatbox.fileUpload.infoText':
      'Unterstützte Dateitypen: .txt, .yaml und .json. Die maximale Dateigröße beträgt 25 MB.',
    'aria.chatbotSelector': 'Chatbot-Auswahl',
    'aria.important': 'Wichtig',
    'aria.chatHistoryMenu': 'Chatverlauf-Menü',
    'aria.closeDrawerPanel': 'Drawer-Fenster schließen',
    'aria.search.placeholder': 'Suchen',
    'aria.searchPreviousConversations': 'Vorherige Unterhaltungen durchsuchen',
    'aria.resize': 'Größe ändern',
    'aria.options.label': 'Optionen',
    'aria.scroll.down': 'Zurück zum Ende',
    'aria.scroll.up': 'Zurück zum Anfang',
    'aria.settings.label': 'Chatbot-Optionen',
    'aria.close': 'Chatbot schließen',
    'modal.edit': 'Bearbeiten',
    'modal.save': 'Speichern',
    'modal.close': 'Schließen',
    'modal.cancel': 'Abbrechen',
    'conversation.delete': 'Löschen',
    'conversation.rename': 'Umbenennen',
    'conversation.addToPinnedChats': 'Anheften',
    'conversation.removeFromPinnedChats': 'Lösen',
    'conversation.announcement.userMessage':
      'Nachricht vom Benutzer: {{prompt}}. Nachricht vom Bot wird geladen.',
    'user.guest': 'Gast',
    'user.loading': '...',
    'tooltip.attach': 'Anhängen',
    'tooltip.send': 'Senden',
    'tooltip.microphone.active': 'Überwachen beenden',
    'tooltip.microphone.inactive': 'Mikrofon verwenden',
    'button.newChat': 'Neuer Chat',
    'tooltip.chatHistoryMenu': 'Chatverlauf-Menü',
    'tooltip.responseRecorded': 'Antwort aufgezeichnet',
    'tooltip.backToTop': 'Zurück zum Anfang',
    'tooltip.backToBottom': 'Zurück zum Ende',
    'tooltip.settings': 'Chatbot-Optionen',
    'tooltip.close': 'Schließen',
    'modal.title.preview': 'Anhang in der Vorschau anzeigen',
    'modal.title.edit': 'Anhang bearbeiten',
    'icon.lightspeed.alt': 'Lightspeed-Symbol',
    'icon.permissionRequired.alt': "Symbol für 'Berechtigung erforderlich'",
    'message.options.label': 'Optionen',
    'file.upload.error.alreadyExists': 'Datei existiert bereits.',
    'file.upload.error.multipleFiles':
      'Es wurden mehr als eine Datei hochgeladen.',
    'file.upload.error.unsupportedType':
      'Nicht unterstützter Dateityp. Unterstützte Typen: .txt, .yaml und .json.',
    'file.upload.error.fileTooLarge':
      'Ihre Dateigröße ist zu groß. Bitte stellen Sie sicher, dass Ihre Datei kleiner als 25 MB ist.',
    'file.upload.error.readFailed':
      'Datei konnte nicht gelesen werden: {{errorMessage}}',
    'error.context.fileAttachment':
      'useFileAttachmentContext muss innerhalb eines FileAttachmentContextProvider liegen',
    'feedback.form.title': 'Warum haben Sie diese Bewertung gewählt?',
    'feedback.form.textAreaPlaceholder':
      'Geben Sie optional zusätzliches Feedback an',
    'feedback.form.submitWord': 'Absenden',
    'feedback.tooltips.goodResponse': 'Gute Antwort',
    'feedback.tooltips.badResponse': 'Schlechte Antwort',
    'feedback.tooltips.copied': 'Kopiert',
    'feedback.tooltips.copy': 'Kopieren',
    'feedback.tooltips.listening': 'Überwachung',
    'feedback.tooltips.listen': 'Überwachen',
    'feedback.quickResponses.positive.helpful': 'Hilfreiche Informationen',
    'feedback.quickResponses.positive.easyToUnderstand': 'Leicht verständlich',
    'feedback.quickResponses.positive.resolvedIssue':
      'Mein Problem wurde gelöst',
    'feedback.quickResponses.negative.didntAnswer':
      'Meine Frage wurde nicht beantwortet',
    'feedback.quickResponses.negative.hardToUnderstand': 'Schwer zu verstehen',
    'feedback.quickResponses.negative.notHelpful': 'Nicht hilfreich',
    'feedback.completion.title': 'Feedback übermittelt',
    'feedback.completion.body':
      'Wir haben Ihre Antwort erhalten. Vielen Dank für Ihr Feedback!',
    'conversation.category.pinnedChats': 'Angeheftet',
    'conversation.category.recent': 'Neueste',
    'settings.pinned.enable': 'Angeheftete Chats aktivieren',
    'settings.pinned.disable': 'Angeheftete Chats deaktivieren',
    'settings.pinned.enabled.description':
      'Angeheftete Chats sind derzeit aktiviert',
    'settings.pinned.disabled.description':
      'Angeheftete Chats sind derzeit deaktiviert.',
    'toolCall.header': 'Antwort des Tools: {{toolName}}',
    'toolCall.thinking': 'Hat {{seconds}} Sekunden nachgedacht',
    'toolCall.executionTime': 'Ausführungszeit: ',
    'toolCall.parameters': 'Parameter',
    'toolCall.response': 'Antwort',
    'toolCall.showMore': 'Mehr anzeigen',
    'toolCall.showLess': 'Weniger anzeigen',
    'toolCall.loading': 'Tool wird ausgeführt...',
    'toolCall.executing': 'Tool wird ausgeführt...',
    'toolCall.copyResponse': 'Antwort kopieren',
    'toolCall.summary': 'Hier ist eine Zusammenfassung Ihrer Antwort.',
    'toolCall.mcpServer': 'MCP-Server',
    'settings.displayMode.label': 'Anzeigemodus',
    'settings.displayMode.overlay': 'Overlay',
    'settings.displayMode.docked': 'An Fenster andocken',
    'settings.displayMode.fullscreen': 'Vollbild',
    'sort.label': 'Unterhaltungen sortieren',
    'sort.newest': 'Datum (neuestes zuerst)',
    'sort.oldest': 'Datum (ältestes zuerst)',
    'sort.alphabeticalAsc': 'Name (A-Z)',
    'sort.alphabeticalDesc': 'Name (Z-A)',
    'reasoning.thinking': 'Denkvorgang anzeigen',
  },
});

export default lightspeedTranslationDe;
