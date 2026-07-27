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
 * de translation for plugin.intelligent-assistant.
 * @public
 */
const intelligentAssistantTranslationDe = createTranslationMessages({
  ref: intelligentAssistantTranslationRef,
  messages: {
    'aria.chatHistoryMenu': 'Chatverlauf-Menü',
    'aria.chatbotSelector': 'Chatbot-Auswahl',
    'aria.close': 'Chatbot schließen',
    'aria.closeDrawerPanel': 'Drawer-Fenster schließen',
    'aria.important': 'Wichtig',
    'aria.options.label': 'Optionen',
    'aria.resize': 'Größe ändern',
    'aria.scroll.down': 'Zurück zum Ende',
    'aria.scroll.up': 'Zurück zum Anfang',
    'aria.search.placeholder': 'Suchen',
    'aria.searchPreviousConversations': 'Vorherige Unterhaltungen durchsuchen',
    'attach.menu.description': 'Eine JSON-, YAML- oder TXT-Datei anhängen',
    'attach.menu.title': 'Anhängen',
    'button.newChat': 'Neuer Chat',
    'chatbox.emptyState.noPinnedChats': 'Chats anheften, um sie oben zu halten',
    'chatbox.emptyState.noRecentChats': 'Keine letzten Chats',
    'chatbox.emptyState.noResults.body':
      'Passen Sie Ihre Suchanfrage an, und versuchen Sie es erneut. Überprüfen Sie Ihre Rechtschreibung, oder versuchen Sie es mit einem allgemeineren Begriff.',
    'chatbox.emptyState.noResults.title': 'Keine Ergebnisse gefunden',
    'chatbox.fileUpload.failed': 'Datei-Upload fehlgeschlagen',
    'chatbox.fileUpload.infoText':
      'Unterstützte Dateitypen: .txt, .yaml und .json. Die maximale Dateigröße beträgt 25 MB.',
    'chatbox.header.title': 'Developer Hub Intelligenter Assistent',
    'chatbox.message.placeholder':
      'Senden Sie eine Nachricht, und laden Sie optional eine JSON-, YAML- oder TXT-Datei hoch ...',
    'chatbox.provider.other': 'Andere',
    'chatbox.search.placeholder': 'Suchen',
    'chatbox.welcome.description': 'Wie kann ich Ihnen heute helfen?',
    'chatbox.welcome.greeting': 'Hallo {{userName}}',
    'common.cancel': 'Abbrechen',
    'common.close': 'Schließen',
    'common.loading': 'Wird geladen',
    'common.noSearchResults': 'Keine Ergebnisse, die der Suche entsprechen',
    'common.readMore': 'Mehr lesen',
    'common.retry': 'Erneut versuchen',
    'conversation.addToPinnedChats': 'Anheften',
    'conversation.announcement.responseStopped': 'Antwort angehalten.',
    'conversation.announcement.userMessage':
      'Nachricht vom Benutzer: {{prompt}}. Nachricht vom Bot wird geladen.',
    'conversation.category.pinnedChats': 'Angeheftete Chats',
    'conversation.category.recent': 'Chats',
    'conversation.delete': 'Löschen',
    'conversation.delete.confirm.action': 'Löschen',
    'conversation.delete.confirm.message':
      'Dieser Chat wird hier nicht mehr angezeigt. Dadurch werden auch zugehörige Aktivitäten wie Prompts, Antworten und Feedback aus Ihrer Aktivität gelöscht.',
    'conversation.delete.confirm.title': 'Chat "{{chatName}}" löschen?',
    'conversation.removeFromPinnedChats': 'Lösen',
    'conversation.rename': 'Umbenennen',
    'conversation.rename.confirm.action': 'Umbenennen',
    'conversation.rename.confirm.title': 'Chat umbenennen?',
    'conversation.rename.placeholder': 'Chatname',
    'disclaimer.withValidation':
      'Diese Funktion nutzt KI-Technologie. Geben Sie bei Ihrer Eingabe keine persönlichen oder sonstigen sensiblen Informationen an. Interaktionen können dazu genutzt werden, die Produkte oder Dienstleistungen von Red Hat zu verbessern.',
    'disclaimer.withoutValidation':
      'Diese Funktion nutzt KI-Technologie. Geben Sie bei Ihrer Eingabe keine persönlichen oder sonstigen sensiblen Informationen an. Interaktionen können dazu genutzt werden, die Produkte oder Dienstleistungen von Red Hat zu verbessern.',
    'error.context.fileAttachment':
      'useFileAttachmentContext muss innerhalb eines FileAttachmentContextProvider liegen',
    'feedback.completion.body':
      'Wir haben Ihre Antwort erhalten. Vielen Dank für Ihr Feedback!',
    'feedback.completion.title': 'Feedback übermittelt',
    'feedback.form.submitWord': 'Absenden',
    'feedback.form.textAreaPlaceholder':
      'Geben Sie optional zusätzliches Feedback an',
    'feedback.form.title': 'Warum haben Sie diese Bewertung gewählt?',
    'feedback.quickResponses.negative.didntAnswer':
      'Meine Frage wurde nicht beantwortet',
    'feedback.quickResponses.negative.hardToUnderstand': 'Schwer zu verstehen',
    'feedback.quickResponses.negative.notHelpful': 'Nicht hilfreich',
    'feedback.quickResponses.positive.easyToUnderstand': 'Leicht verständlich',
    'feedback.quickResponses.positive.helpful': 'Hilfreiche Informationen',
    'feedback.quickResponses.positive.resolvedIssue':
      'Mein Problem wurde gelöst',
    'feedback.tooltips.badResponse': 'Schlechte Antwort',
    'feedback.tooltips.copied': 'Kopiert',
    'feedback.tooltips.copy': 'Kopieren',
    'feedback.tooltips.goodResponse': 'Gute Antwort',
    'feedback.tooltips.listen': 'Überwachen',
    'feedback.tooltips.listening': 'Überwachung',
    'file.upload.error.alreadyExists': 'Datei existiert bereits.',
    'file.upload.error.fileTooLarge':
      'Ihre Dateigröße ist zu groß. Bitte stellen Sie sicher, dass Ihre Datei kleiner als 25 MB ist.',
    'file.upload.error.multipleFiles':
      'Es wurden mehr als eine Datei hochgeladen.',
    'file.upload.error.readFailed':
      'Datei konnte nicht gelesen werden: {{errorMessage}}',
    'file.upload.error.unsupportedType':
      'Nicht unterstützter Dateityp. Unterstützte Typen: .txt, .yaml und .json.',
    'footer.accuracy.label':
      'KI-generierte Inhalte sollten vor der Verwendung stets überprüft werden.',
    'icon.lightspeed.alt': 'Symbol des intelligenten Assistenten',
    'icon.permissionRequired.alt': "Symbol für 'Berechtigung erforderlich'",
    'lcore.loadError.description':
      'Das Backend des intelligenten Assistenten hat keine Modellliste zurückgegeben. Prüfen Sie, ob der Dienst läuft und erreichbar ist, und versuchen Sie es erneut.',
    'lcore.loadError.title': 'Modelle konnten nicht geladen werden',
    'lcore.notConfigured.backendDocs':
      'Backend des intelligenten Assistenten einrichten',
    'lcore.notConfigured.description':
      'Der intelligente Assistent erfordert ein registriertes LLM. Wenden Sie sich an den Plattformadministrator Ihrer Organisation, um die Einrichtung abzuschließen.',
    'lcore.notConfigured.developerLightspeedDocs':
      'Developer Hub Intelligent Assistant wird konfiguriert',
    'lcore.notConfigured.title': 'Verbinden Sie ein LLM, um zu starten',
    'mcp.settings.closeAriaLabel': 'MCP-Einstellungen schließen',
    'mcp.settings.closeConfigureModalAriaLabel':
      'Konfigurationsdialog schließen',
    'mcp.settings.configureServerTitle':
      '{{serverName}} MCP-Server-Einstellungen',
    'mcp.settings.edit': 'Bearbeiten',
    'mcp.settings.editServerAriaLabel': '{{serverName}} bearbeiten',
    'mcp.settings.enabled': 'Aktiviert',
    'mcp.settings.enterToken': 'Geben Sie Ihren Token ein',
    'mcp.settings.loading': 'MCP-Server werden geladen...',
    'mcp.settings.modalDescription':
      'Anmeldedaten werden verschlüsselt gespeichert und sind auf Ihr Profil beschränkt. Der intelligente Assistent arbeitet mit genau Ihren Berechtigungen.',
    'mcp.settings.modalDescriptionDcr':
      'Dieser Server verwendet Dynamic Client Registration (DCR). Token werden automatisch mit Ihrer Backstage-Identität erstellt — kein manuelles Token erforderlich.',
    'mcp.settings.authenticationToken': 'Authentifizierungstoken',
    'mcp.settings.modal.authenticationHeading': 'Authentifizierung',
    'mcp.settings.modal.credentialMode.organization':
      'Organisations-Standard-Token verwenden',
    'mcp.settings.modal.credentialMode.organizationDescription':
      'Verwendet den von Ihrem Administrator konfigurierten Token.',
    'mcp.settings.modal.credentialMode.personal':
      'Persönlichen Token verwenden',
    'mcp.settings.modal.toolsHeading': 'Tools ({{count}})',
    'mcp.settings.modal.loadingTools': 'Tools werden geladen...',
    'mcp.settings.modal.fetchingStatus': 'Status wird abgerufen...',
    'mcp.settings.modal.loadingStatus': 'Verbindung wird getrennt...',
    'mcp.settings.modal.tokenRemovedWarning':
      'Token wurde entfernt. Um diesen MCP-Server erneut zu verwenden, geben Sie einen neuen Token ein.',
    'mcp.settings.modal.noToolsAvailable': 'Keine Tools verfügbar.',
    'mcp.settings.modal.toolsLoadFailed': 'Tools konnten nicht geladen werden.',
    'mcp.settings.modal.enabledDescription':
      'Dieser Server ist aktiv und im Chat verfügbar.',
    'mcp.settings.modal.enabledDescriptionOff':
      'Dieser Server ist deaktiviert und im Chat nicht verfügbar.',
    'mcp.settings.modal.enabledDescriptionTokenRequired':
      'Dieser Server ist derzeit deaktiviert. Geben Sie einen Token ein, um ihn zu aktivieren.',
    'mcp.settings.name': 'Name',
    'mcp.settings.noneAvailable': 'Keine MCP-Server verfügbar.',
    'mcp.settings.personalAccessToken': 'Persönlicher Zugriffstoken',
    'mcp.settings.readOnlyAccess':
      'Sie haben schreibgeschützten Zugriff auf MCP-Server.',
    'mcp.settings.removePersonalToken': 'Persönlichen Token entfernen',
    'mcp.settings.savedToken': 'Gespeicherter Token',
    'mcp.settings.selectedCount':
      '{{selectedCount}} von {{totalCount}} ausgewählt',
    'mcp.settings.status': 'Status',
    'mcp.settings.status.disabled': 'Deaktiviert',
    'mcp.settings.status.failed': 'Fehlgeschlagen',
    'mcp.settings.status.manyTools': '{{count}} Tools',
    'mcp.settings.status.oneTool': '{{count}} Tool',
    'mcp.settings.status.tokenRequired': 'Token erforderlich',
    'mcp.settings.status.unknown': 'Unbekannt',
    'mcp.settings.tableAriaLabel': 'MCP-Server-Tabelle',
    'mcp.settings.title': 'MCP-Server',
    'mcp.settings.toggleServerAriaLabel': '{{serverName}} umschalten',
    'mcp.settings.token.clearAriaLabel': 'Tokeneingabe löschen',
    'mcp.settings.token.connectionSuccessful': 'Verbindung erfolgreich',
    'mcp.settings.token.invalidCredentials':
      'Ungültige Anmeldedaten. Überprüfen Sie Server-URL und Token.',
    'mcp.settings.token.savingAndValidating':
      'Token wird gespeichert und validiert...',
    'mcp.settings.token.urlUnavailableForValidation':
      'Token kann nicht validiert werden, da die Server-URL nicht verfügbar ist.',
    'mcp.settings.token.validating': 'Token wird validiert...',
    'mcp.settings.token.validationFailed':
      'Validierung fehlgeschlagen. Überprüfen Sie Server-URL und Token.',
    'menu.newConversation': 'Neuer Chat',
    'message.options.label': 'Optionen',
    'modal.cancel': 'Abbrechen',
    'modal.close': 'Schließen',
    'modal.edit': 'Bearbeiten',
    'modal.save': 'Speichern',
    'modal.title.edit': 'Anhang bearbeiten',
    'modal.title.preview': 'Anhang in der Vorschau anzeigen',
    'notebook.document.delete': 'Löschen',
    'notebook.document.delete.action': 'Entfernen',
    'notebook.document.delete.description':
      'Sind Sie sicher, dass Sie <documentName/> aus diesem Notizbuch entfernen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
    'notebook.document.delete.success':
      '„{{documentName}}" wurde erfolgreich entfernt.',
    'notebook.document.delete.title': 'Ressource entfernen?',
    'notebook.overwrite.modal.action': 'Überschreiben',
    'notebook.overwrite.modal.description':
      'Die folgenden Dateien existieren bereits in diesem Notizbuch. Möchten Sie sie mit den neuen Versionen überschreiben?',
    'notebook.overwrite.modal.title': 'Dateien überschreiben?',
    'notebook.upload.error.fileTooLarge':
      'Upload-Fehler: Dateigröße überschreitet das Limit von 25 MB.',
    'notebook.upload.error.tooManyFiles':
      'Upload-Fehler: Maximal {{max}} Dateien erlaubt.',
    'notebook.upload.error.unsupportedType':
      'Upload-Fehler: Nicht unterstützte Dateitypen gefunden. Bitte laden Sie nur unterstützte Dateitypen hoch.',
    'notebook.upload.failed': 'Hochladen von "{{fileName}}" fehlgeschlagen.',
    'notebook.upload.modal.addButton': 'Hinzufügen ({{count}})',
    'notebook.upload.modal.browseButton': 'Hochladen',
    'notebook.upload.modal.dragDropTitle': 'Dateien hierher ziehen und ablegen',
    'notebook.upload.modal.infoText':
      'Akzeptierte Dateitypen: .md, .txt, .pdf, .json, .yaml, .log',
    'notebook.upload.modal.removeFile': '{{fileName}} entfernen',
    'notebook.upload.modal.selectedFiles':
      '{{count}} von {{max}} Dateien ausgewählt',
    'notebook.upload.modal.separator': 'oder',
    'notebook.upload.modal.title': 'Dokument zum Notizbuch hinzufügen',
    'notebook.view.close': 'Notizbuch schließen',
    'notebook.view.documents.add': 'Hinzufügen',
    'notebook.view.documents.count': '{{count}} Dokumente',
    'notebook.view.documents.maxReached':
      'Maximal 10 Dokumente sind erlaubt. Löschen Sie ein Dokument, um ein neues hochzuladen.',
    'notebook.view.documents.uploading': 'Dokument wird hochgeladen',
    'notebook.view.input.disabledTooltip':
      'Wählen Sie mindestens eine geladene Ressource aus, um den Chat zu starten',
    'notebook.view.input.placeholder': 'Fragen Sie zu Ihren Dokumenten...',
    'notebook.view.sidebar.collapse': 'Seitenleiste einklappen',
    'notebook.view.sidebar.expand': 'Seitenleiste ausklappen',
    'notebook.view.sidebar.resize': 'Größe der Seitenleiste ändern',
    'notebook.view.title': 'Unbenanntes Notizbuch',
    'notebook.view.upload.action': 'Ressource hochladen',
    'notebook.view.processing.description':
      'Ihre Dateien werden indexiert. Sie können Fragen stellen, sobald die Verarbeitung abgeschlossen ist.',
    'notebook.view.processing.heading': 'Ressourcen werden verarbeitet...',
    'notebook.view.upload.heading':
      'Laden Sie eine Ressource hoch, um zu beginnen',
    'notebooks.actions.delete': 'Löschen',
    'notebooks.actions.rename': 'Umbenennen',
    'notebooks.card.openAria': 'Notizbuch {{name}} öffnen',
    'notebooks.delete.action': 'Löschen',
    'notebooks.delete.message':
      'Dieses Notizbuch wird hier nicht mehr angezeigt. Dadurch werden auch zugehörige Aktivitäten wie Eingaben, Antworten und Feedback aus Ihrer Aktivität gelöscht.',
    'notebooks.delete.title': '{{name}} löschen?',
    'notebooks.delete.toast': 'Notizbuch gelöscht!',
    'notebooks.documents': 'Dokumente',
    'notebooks.empty.action': 'Neues Notizbuch erstellen',
    'notebooks.empty.description':
      'Erstellen Sie ein neues Notizbuch, um Ihre Quellen zu organisieren und KI-gestützte Erkenntnisse zu gewinnen.',
    'notebooks.empty.title': 'Keine erstellten Notizbücher',
    'notebooks.prompts.accessIssue.title': 'Hilf mir bei einem Zugriffsproblem',
    'notebooks.prompts.coreConcepts.title': 'Was sind die Kernkonzepte?',
    'notebooks.prompts.vulnerabilities.title':
      'Zeige meine kritischen Schwachstellen',
    'notebooks.rename.action': 'Senden',
    'notebooks.rename.description':
      'Bitte geben Sie den neuen Namen für dieses Notizbuch ein und klicken Sie auf „Senden“, um fortzufahren.',
    'notebooks.rename.label': 'Neuer Name',
    'notebooks.rename.placeholder': 'Neuer Name',
    'notebooks.rename.title': '{{name}} umbenennen?',
    'notebooks.title': 'Meine Notizbücher',
    'notebooks.updated.days': 'Vor {{days}} Tagen aktualisiert',
    'notebooks.updated.on': 'Aktualisiert am',
    'notebooks.updated.today': 'Heute aktualisiert',
    'notebooks.updated.yesterday': 'Vor 1 Tag aktualisiert',
    'page.subtitle': 'KI-gestützter Entwicklungsassistent',
    'page.title': 'Intelligenter Assistent',
    'permission.notebooks.goBack': 'Zurück',
    'permission.required.description':
      'Um <subject/> anzuzeigen, wenden Sie sich an Ihren Administrator, um die Berechtigung <permissions/> zu erhalten.',
    'permission.required.title': 'Fehlende Berechtigungen',
    'permission.subject.notebooks':
      'die Notizbücher des intelligenten Assistenten',
    'permission.subject.plugin': 'das Plugin des intelligenten Assistenten',
    'prompts.codeOptimization.message':
      'Können Sie gängige Methoden zur Codeoptimierung vorschlagen, um eine bessere Performance zu erzielen?',
    'prompts.codeOptimization.title':
      'Vorschläge zur Codeoptimierung unterbreiten',
    'prompts.codeReadability.message':
      'Können Sie mir Techniken vorschlagen, mit denen ich meinen Code lesbarer und wartungsfreundlicher gestalten kann?',
    'prompts.codeReadability.title': 'Hilfe zur Code-Lesbarkeit erhalten',
    'prompts.debugging.message':
      'Meine Anwendung gibt beim Versuch einer Verbindung zur Datenbank einen Fehler aus. Können Sie mir helfen, das Problem zu identifizieren?',
    'prompts.debugging.title': 'Hilfe beim Debuggen erhalten',
    'prompts.developmentConcept.message':
      'Können Sie erklären, wie eine Microservices-Architektur funktioniert und welche Vorteile sie gegenüber einem monolithischen Design bietet?',
    'prompts.developmentConcept.title': 'Ein Entwicklungskonzept erläutern',
    'prompts.documentation.message':
      'Können Sie die Dokumentation zur Implementierung der OAuth 2.0-Authentifizierung in einer Webanwendung zusammenfassen?',
    'prompts.documentation.title': 'Zusammenfassung von Dokumentation',
    'prompts.eventDriven.message':
      'Können Sie erklären, was ereignisgesteuerte Architektur bedeutet und wann ihre Verwendung in der Softwareentwicklung von Vorteil ist?',
    'prompts.eventDriven.title': 'Ereignisgesteuerte Architektur verstehen',
    'prompts.gitWorkflows.message':
      'Ich möchte Änderungen am Code in einem anderen Branch vornehmen, ohne meine bestehende Arbeit zu verlieren. Wie geht man dabei mit Git vor?',
    'prompts.gitWorkflows.title': 'Workflows mit Git',
    'prompts.openshift.message':
      'Können Sie mich bei der Erstellung eines neuen Deployments in OpenShift für eine containerisierte Anwendung unterstützen?',
    'prompts.openshift.title': 'OpenShift-Deployment erstellen',
    'prompts.rhdh.message':
      'Können Sie mich bei den ersten Schritten zur Nutzung des Developer Hub als Entwickler unterstützen, z. B. beim Erkunden des Softwarekatalogs und beim Hinzufügen meines Dienstes?',
    'prompts.rhdh.title': 'Erste Schritte mit dem Red Hat Developer Hub',
    'prompts.sortingAlgorithms.message':
      'Können Sie den Unterschied zwischen Quicksort und Mergesort erklären und wann man welchen Algorithmus verwendet?',
    'prompts.sortingAlgorithms.title':
      'Sortieralgorithmen verständlich erklären',
    'prompts.tekton.message':
      'Können Sie mir helfen, das Deployment meiner Anwendung mithilfe von Tekton-Pipelines zu automatisieren?',
    'prompts.tekton.title': 'Mit Tekton deployen',
    'prompts.testingStrategies.message':
      'Können Sie mir einige gängige Teststrategien empfehlen, die meine Anwendung robust und fehlerfrei machen?',
    'prompts.testingStrategies.title': 'Teststrategien vorschlagen',
    'reasoning.thinking': 'Denkvorgang anzeigen',
    'settings.displayMode.docked': 'An Fenster andocken',
    'settings.displayMode.fullscreen': 'Vollbild',
    'settings.displayMode.label': 'Anzeigemodus',
    'settings.displayMode.overlay': 'Overlay',
    'settings.mcp.badge': 'Neu',
    'settings.mcp.label': 'MCP-Einstellungen',
    'settings.pinned.disable': 'Angeheftete Chats deaktivieren',
    'settings.pinned.disabled.description':
      'Angeheftete Chats sind derzeit deaktiviert.',
    'settings.pinned.enable': 'Angeheftete Chats aktivieren',
    'settings.pinned.enabled.description':
      'Angeheftete Chats sind derzeit aktiviert',
    'sort.alphabeticalAsc': 'Name (A-Z)',
    'sort.alphabeticalDesc': 'Name (Z-A)',
    'sort.label': 'Unterhaltungen sortieren',
    'sort.newest': 'Datum (neuestes zuerst)',
    'sort.oldest': 'Datum (ältestes zuerst)',
    'sources.chip.label_one': '{{count}} Quelle',
    'sources.chip.label_other': '{{count}} Quellen',
    'sources.modal.description':
      'Die folgenden Quellen wurden verwendet, um diese KI-Antwort zu generieren und ergänzende Informationen bereitzustellen:',
    'sources.modal.title': 'Quellen',
    'sources.popover.closeAriaLabel': 'Quellen schließen',
    'tabs.ariaLabel': 'Ansichten des intelligenten Assistenten',
    'tabs.chat': 'Chat',
    'tabs.notebooks': 'Notizbücher',
    'tabs.notebooks.devPreview': 'Entwicklervorschau',
    'tabs.notebooks.empty': 'Inhalte der Notizbücher kommen hierhin.',
    'toolCall.copyResponse': 'Antwort kopieren',
    'toolCall.executing': 'Tool wird ausgeführt...',
    'toolCall.executionTime': 'Ausführungszeit: ',
    'toolCall.header': 'Antwort des Tools: {{toolName}}',
    'toolCall.loading': 'Tool wird ausgeführt...',
    'toolCall.mcpServer': 'MCP-Server',
    'toolCall.parameters': 'Parameter',
    'toolCall.response': 'Antwort',
    'toolCall.showLess': 'Weniger anzeigen',
    'toolCall.showMore': 'Mehr anzeigen',
    'toolCall.summary': 'Hier ist eine Zusammenfassung Ihrer Antwort.',
    'toolCall.thinking': 'Hat {{seconds}} Sekunden nachgedacht',
    'tooltip.attach': 'Anhängen',
    'tooltip.backToBottom': 'Zurück zum Ende',
    'tooltip.backToTop': 'Zurück zum Anfang',
    'tooltip.chatHistoryMenu': 'Chatverlauf-Menü',
    'tooltip.close': 'Schließen',
    'tooltip.collapseHistoryPanel': 'Chatverlauf minimieren',
    'tooltip.expandHistoryPanel': 'Chatverlauf erweitern',
    'tooltip.fab.close': 'Intelligenten Assistenten schließen',
    'tooltip.fab.open': 'Intelligenten Assistenten öffnen',
    'tooltip.microphone.active': 'Überwachen beenden',
    'tooltip.microphone.inactive': 'Mikrofon verwenden',
    'tooltip.quickNewChat': 'Neuer Chat',
    'tooltip.responseRecorded': 'Antwort aufgezeichnet',
    'tooltip.send': 'Senden',
    'user.guest': 'Gast',
    'user.loading': '...',
  },
});

export default intelligentAssistantTranslationDe;
