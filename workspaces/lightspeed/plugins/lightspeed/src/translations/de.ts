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
 * Deutsch translation for Developer Lightspeed.
 * @public
 */
const lightspeedTranslationDe = createTranslationMessages({
  ref: lightspeedTranslationRef,
  messages: {
    // Page titles and headers
    'page.title': 'Lightspeed',
    'page.subtitle': 'KI-gestützter Entwicklungsassistent',

    // Sample prompts - General Development
    'prompts.codeReadability.title': 'Hilfe zur Code-Lesbarkeit',
    'prompts.codeReadability.message':
      'Können Sie Techniken vorschlagen, die ich verwenden kann, um meinen Code lesbarer und wartbarer zu machen?',
    'prompts.debugging.title': 'Hilfe beim Debugging',
    'prompts.debugging.message':
      'Meine Anwendung wirft einen Fehler beim Versuch, sich mit der Datenbank zu verbinden. Können Sie mir helfen, das Problem zu identifizieren?',
    'prompts.developmentConcept.title': 'Entwicklungskonzept erklären',
    'prompts.developmentConcept.message':
      'Können Sie erklären, wie Microservices-Architektur funktioniert und welche Vorteile sie gegenüber einem monolithischen Design hat?',
    'prompts.codeOptimization.title': 'Code-Optimierungen vorschlagen',
    'prompts.codeOptimization.message':
      'Können Sie gängige Möglichkeiten vorschlagen, Code zu optimieren, um bessere Leistung zu erzielen?',
    'prompts.documentation.title': 'Dokumentationszusammenfassung',
    'prompts.documentation.message':
      'Können Sie die Dokumentation für die Implementierung von OAuth 2.0-Authentifizierung in einer Web-App zusammenfassen?',
    'prompts.gitWorkflows.title': 'Arbeitsabläufe mit Git',
    'prompts.gitWorkflows.message':
      'Ich möchte Änderungen am Code in einem anderen Branch vornehmen, ohne meine bestehende Arbeit zu verlieren. Was ist das Verfahren, um dies mit Git zu tun?',
    'prompts.testingStrategies.title': 'Teststrategien vorschlagen',
    'prompts.testingStrategies.message':
      'Können Sie gängige Teststrategien empfehlen, die meine Anwendung robust und fehlerfrei machen?',
    'prompts.sortingAlgorithms.title': 'Sortieralgorithmen entmystifizieren',
    'prompts.sortingAlgorithms.message':
      'Können Sie den Unterschied zwischen einem Quicksort- und einem Mergesort-Algorithmus erklären und wann man welchen verwendet?',
    'prompts.eventDriven.title': 'Event-getriebene Architektur verstehen',
    'prompts.eventDriven.message':
      'Können Sie erklären, was event-getriebene Architektur ist und wann es vorteilhaft ist, sie in der Softwareentwicklung zu verwenden?',

    // Sample prompts - RHDH Specific
    'prompts.tekton.title': 'Mit Tekton bereitstellen',
    'prompts.tekton.message':
      'Können Sie mir helfen, die Bereitstellung meiner Anwendung mit Tekton-Pipelines zu automatisieren?',
    'prompts.openshift.title': 'OpenShift-Bereitstellung erstellen',
    'prompts.openshift.message':
      'Können Sie mich durch die Erstellung einer neuen Bereitstellung in OpenShift für eine containerisierte Anwendung führen?',
    'prompts.rhdh.title': 'Erste Schritte mit Red Hat Developer Hub',
    'prompts.rhdh.message':
      'Können Sie mich durch die ersten Schritte führen, um Developer Hub als Entwickler zu nutzen, wie das Erkunden des Software-Katalogs und das Hinzufügen meines Dienstes?',

    // Conversation history
    'conversation.delete.confirm.title': 'Chat löschen?',
    'conversation.delete.confirm.message':
      'Sie werden diesen Chat hier nicht mehr sehen. Dies löscht auch verwandte Aktivitäten wie Prompts, Antworten und Feedback aus Ihrer Lightspeed-Aktivität.',
    'conversation.delete.confirm.action': 'Löschen',
    'conversation.rename.confirm.title': 'Chat umbenennen?',
    'conversation.rename.confirm.action': 'Umbenennen',
    'conversation.rename.placeholder': 'Chat-Name',
    'conversation.action.error': 'Fehler aufgetreten: {{error}}',

    // Permissions
    'permission.required.title': 'Fehlende Berechtigungen',
    'permission.required.description':
      'Um das Lightspeed-Plugin zu sehen, wenden Sie sich an Ihren Administrator, um die Berechtigungen <b>lightspeed.chat.read</b> und <b>lightspeed.chat.create</b> zu erhalten.',

    // Disclaimers
    'disclaimer.withValidation':
      'Diese Funktion verwendet KI-Technologie. Geben Sie keine persönlichen Informationen oder andere sensible Informationen in Ihre Eingabe ein. Interaktionen können zur Verbesserung der Produkte oder Dienstleistungen von Red Hat verwendet werden.',
    'disclaimer.withoutValidation':
      'Diese Funktion verwendet KI-Technologie. Geben Sie keine persönlichen Informationen oder andere sensible Informationen in Ihre Eingabe ein. Interaktionen können zur Verbesserung der Produkte oder Dienstleistungen von Red Hat verwendet werden.',

    // Footer and feedback
    'footer.accuracy.label':
      'Überprüfen Sie KI-generierte Inhalte immer vor der Verwendung.',
    'footer.accuracy.popover.title': 'Genauigkeit überprüfen',
    'footer.accuracy.popover.description':
      'Obwohl Developer Lightspeed sich um Genauigkeit bemüht, besteht immer die Möglichkeit von Fehlern. Es ist eine gute Praxis, kritische Informationen aus zuverlässigen Quellen zu überprüfen, besonders wenn sie für Entscheidungsfindung oder Handlungen entscheidend sind.',
    'footer.accuracy.popover.image.alt': 'Beispielbild für Fußnoten-Popover',
    'footer.accuracy.popover.cta.label': 'Verstanden',
    'footer.accuracy.popover.link.label': 'Mehr erfahren',

    // Common actions
    'common.cancel': 'Abbrechen',
    'common.close': 'Schließen',
    'common.readMore': 'Mehr erfahren',
    'common.noSearchResults': 'Kein Ergebnis entspricht der Suche',

    // Menu items
    'menu.newConversation': 'Neuer Chat',

    // Chat-specific UI elements
    'chatbox.header.title': 'Developer Lightspeed',
    'chatbox.search.placeholder': 'Suchen',
    'chatbox.provider.other': 'Andere',
    'chatbox.emptyState.noPinnedChats': 'Keine angehefteten Chats',
    'chatbox.emptyState.noRecentChats': 'Keine kürzlichen Chats',
    'chatbox.emptyState.noResults.title': 'Keine Ergebnisse gefunden',
    'chatbox.emptyState.noResults.body':
      'Passen Sie Ihre Suchanfrage an und versuchen Sie es erneut. Überprüfen Sie Ihre Rechtschreibung oder versuchen Sie einen allgemeineren Begriff.',
    'chatbox.welcome.greeting': 'Hallo, {{userName}}',
    'chatbox.welcome.description': 'Wie kann ich Ihnen heute helfen?',
    'chatbox.message.placeholder':
      'Senden Sie eine Nachricht und laden Sie optional eine JSON-, YAML-, oder TXT-Datei hoch...',
    'chatbox.fileUpload.failed': 'Datei-Upload fehlgeschlagen',
    'chatbox.fileUpload.infoText':
      'Unterstützte Dateitypen sind: .txt, .yaml, und .json. Die maximale Dateigröße beträgt 25 MB.',

    // Accessibility and ARIA labels
    'aria.chatbotSelector': 'Chatbot-Auswahl',
    'aria.important': 'Wichtig',
    'aria.chatHistoryMenu': 'Chat-Verlauf-Menü',
    'aria.closeDrawerPanel': 'Seitenleiste schließen',
    'aria.search.placeholder': 'Suchen',
    'aria.searchPreviousConversations': 'Frühere Chats durchsuchen',
    'aria.resize': 'Größe ändern',
    'aria.options.label': 'Optionen',
    'aria.scroll.down': 'Nach unten',
    'aria.scroll.up': 'Nach oben',
    'aria.settings.label': 'Chatbot-Optionen',

    // Modal actions
    'modal.edit': 'Bearbeiten',
    'modal.save': 'Speichern',
    'modal.close': 'Schließen',
    'modal.cancel': 'Abbrechen',

    // Conversation actions
    'conversation.delete': 'Löschen',
    'conversation.rename': 'Umbenennen',
    'conversation.addToPinnedChats': 'Anheften',
    'conversation.removeFromPinnedChats': 'Loslösen',
    'conversation.announcement.userMessage':
      'Nachricht vom Benutzer: {{prompt}}. Nachricht vom Bot wird geladen.',

    // User states
    'user.guest': 'Gast',
    'user.loading': '...',

    // Button tooltips and labels
    'tooltip.attach': 'Anhängen',
    'tooltip.send': 'Senden',
    'tooltip.microphone.active': 'Aufhören zu hören',
    'tooltip.microphone.inactive': 'Mikrofon verwenden',
    'button.newChat': 'Neuer Chat',
    'tooltip.chatHistoryMenu': 'Chat-Verlauf-Menü',
    'tooltip.responseRecorded': 'Antwort aufgezeichnet',
    'tooltip.backToTop': 'Nach oben',
    'tooltip.backToBottom': 'Nach unten',
    'tooltip.settings': 'Chatbot-Optionen',

    // Modal titles
    'modal.title.preview': 'Anhang-Vorschau',
    'modal.title.edit': 'Anhang bearbeiten',

    // Alt texts for icons
    'icon.lightspeed.alt': 'Lightspeed-Icon',
    'icon.permissionRequired.alt': 'Berechtigung erforderlich Icon',

    // Message utilities
    'message.options.label': 'Optionen',

    // File attachment errors
    'file.upload.error.alreadyExists': 'Die Datei existiert bereits.',
    'file.upload.error.multipleFiles': 'Mehr als eine Datei hochgeladen.',
    'file.upload.error.unsupportedType':
      'Nicht unterstützter Dateityp. Unterstützte Typen sind: .txt, .yaml, und .json.',
    'file.upload.error.fileTooLarge':
      'Ihre Dateigröße ist zu groß. Bitte stellen Sie sicher, dass Ihre Datei kleiner als 25 MB ist.',
    'file.upload.error.readFailed':
      'Fehler beim Lesen der Datei: {{errorMessage}}',

    // Developer error messages
    'error.context.fileAttachment':
      'useFileAttachmentContext muss innerhalb eines FileAttachmentContextProvider sein',

    // Feedback actions
    'feedback.form.title': 'Warum haben Sie diese Bewertung gewählt?',
    'feedback.form.textAreaPlaceholder':
      'Geben Sie optionale zusätzliche Kommentare',
    'feedback.form.submitWord': 'Absenden',
    'feedback.tooltips.goodResponse': 'Gute Antwort',
    'feedback.tooltips.badResponse': 'Schlechte Antwort',
    'feedback.tooltips.copied': 'Kopiert',
    'feedback.tooltips.copy': 'Kopieren',
    'feedback.tooltips.listening': 'Höre zu',
    'feedback.tooltips.listen': 'Zuhören',
    'feedback.quickResponses.positive.helpful': 'Hilfreiche Informationen',
    'feedback.quickResponses.positive.easyToUnderstand': 'Einfach zu verstehen',
    'feedback.quickResponses.positive.resolvedIssue': 'Hat mein Problem gelöst',
    'feedback.quickResponses.negative.didntAnswer':
      'Hat meine Frage nicht beantwortet',
    'feedback.quickResponses.negative.hardToUnderstand': 'Schwer zu verstehen',
    'feedback.quickResponses.negative.notHelpful': 'Nicht hilfreich',
    'feedback.completion.title': 'Feedback übermittelt',
    'feedback.completion.body':
      'Wir haben Ihre Antwort erhalten. Vielen Dank für Ihr Feedback!',

    // Conversation categorization
    'conversation.category.pinnedChats': 'Angeheftet',
    'conversation.category.recent': 'Kürzlich',

    // lightspeed settings
    'settings.pinned.enable': 'Angeheftete Chats aktivieren',
    'settings.pinned.disable': 'Angeheftete Chats deaktivieren',
    'settings.pinned.enabled.description':
      'Angeheftete Chats sind derzeit aktiviert',
    'settings.pinned.disabled.description':
      'Angeheftete Chats sind derzeit deaktiviert',

    // Tool calling
    'toolCall.header': 'Werkzeugantwort: {{toolName}}',
    'toolCall.thinking': '{{seconds}} Sekunden nachgedacht',
    'toolCall.executionTime': 'Ausführungszeit: ',
    'toolCall.parameters': 'Parameter',
    'toolCall.response': 'Antwort',
    'toolCall.showMore': 'mehr anzeigen',
    'toolCall.showLess': 'weniger anzeigen',
    'toolCall.loading': 'Werkzeug wird ausgeführt...',
    'toolCall.executing': 'Werkzeug wird ausgeführt...',
    'toolCall.copyResponse': 'Antwort kopieren',
    'toolCall.summary': 'Hier ist eine Zusammenfassung Ihrer Antwort',
    'toolCall.mcpServer': 'MCP-Server',
  },
});

export default lightspeedTranslationDe;
