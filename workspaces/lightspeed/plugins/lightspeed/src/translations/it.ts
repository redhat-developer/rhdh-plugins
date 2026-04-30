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
 * Italian translation for plugin.lightspeed.
 * @public
 */
const lightspeedTranslationIt = createTranslationMessages({
  ref: lightspeedTranslationRef,
  messages: {
    'page.title': 'Lightspeed',
    'page.subtitle':
      "Assistente allo sviluppo basato sull'intelligenza artificiale",
    'tabs.ariaLabel': 'Viste di Lightspeed',
    'tabs.chat': 'Chat',
    'tabs.notebooks': 'Quaderni',
    'tabs.notebooks.empty': 'Il contenuto dei quaderni va qui.',
    'notebooks.title': 'I miei quaderni',
    'notebooks.empty.title': 'Nessun quaderno creato',
    'notebooks.empty.description':
      'Crea un nuovo quaderno per organizzare le tue fonti e generare insight basati su IA.',
    'notebooks.empty.action': 'Crea un nuovo quaderno',
    'notebooks.documents': 'Documenti',
    'notebooks.actions.rename': 'Rinomina',
    'notebooks.actions.delete': 'Elimina',
    'notebooks.rename.title': 'Rinominare {{name}}?',
    'notebooks.rename.description':
      'Inserisci il nuovo nome per questo quaderno e fai clic su Invia per continuare.',
    'notebooks.rename.label': 'Nuovo nome',
    'notebooks.rename.placeholder': 'Nuovo nome',
    'notebooks.rename.action': 'Invia',
    'notebooks.delete.title': 'Eliminare {{name}}?',
    'notebooks.delete.message':
      'Non vedrai più questo quaderno qui. Questo eliminerà anche le attività correlate come prompt, risposte e feedback dalla tua attività Lightspeed.',
    'notebooks.delete.action': 'Elimina',
    'notebooks.delete.toast': 'Quaderno eliminato!',
    'notebooks.updated.today': 'Aggiornato oggi',
    'notebooks.updated.yesterday': 'Aggiornato 1 giorno fa',
    'notebooks.updated.days': 'Aggiornato {{days}} giorni fa',
    'notebooks.updated.on': 'Aggiornato il',

    // Notebook view
    'notebook.view.title': 'Quaderno senza titolo',
    'notebook.view.close': 'Chiudi quaderno',
    'notebook.view.documents.count': '{{count}} Documenti',
    'notebook.view.documents.add': 'Aggiungi',
    'notebook.view.upload.heading': 'Carica una risorsa per iniziare',
    'notebook.view.upload.action': 'Carica una risorsa',
    'notebook.view.input.placeholder':
      'Chiedi informazioni sui tuoi documenti...',
    'notebook.view.input.disabledTooltip':
      'Seleziona almeno una risorsa caricata per iniziare a chattare',
    'notebook.view.sidebar.collapse': 'Comprimi barra laterale',
    'notebook.view.sidebar.expand': 'Espandi barra laterale',
    'notebook.view.sidebar.resize': 'Ridimensiona barra laterale',
    'notebook.view.documents.uploading': 'Caricamento documento',
    'notebook.view.documents.maxReached':
      'Sono consentiti al massimo 10 documenti. Elimina un documento per caricarne uno nuovo.',
    'notebook.upload.success': '{{fileName}} caricato con successo.',
    'notebook.upload.failed': 'Caricamento di {{fileName}} non riuscito.',

    // Notebook upload modal
    'notebook.upload.modal.title': 'Aggiungi un documento al quaderno',
    'notebook.upload.modal.dragDropTitle': 'Trascina e rilascia i file qui',
    'notebook.upload.modal.browseButton': 'Carica',
    'notebook.upload.modal.separator': 'o',
    'notebook.upload.modal.infoText':
      'Tipi di file accettati: .md, .txt, .pdf, .json, .yaml, .log',
    'notebook.upload.modal.selectedFiles':
      '{{count}} di {{max}} file selezionati',
    'notebook.upload.modal.addButton': 'Aggiungi ({{count}})',
    'notebook.upload.modal.removeFile': 'Rimuovi {{fileName}}',
    'notebook.upload.error.unsupportedType':
      'Errore di caricamento: trovati tipi di file non supportati. Caricare solo tipi di file supportati.',
    'notebook.upload.error.fileTooLarge':
      'Errore di caricamento: la dimensione del file supera il limite di 25 MB.',
    'notebook.upload.error.tooManyFiles':
      'Errore di caricamento: sono consentiti al massimo {{max}} file.',

    // Notebook overwrite modal
    'notebook.overwrite.modal.title': 'Sovrascrivere i file?',
    'notebook.overwrite.modal.description':
      'I seguenti file esistono già in questo quaderno. Vuoi sovrascriverli con le nuove versioni?',
    'notebook.overwrite.modal.action': 'Sovrascrivi',
    'notebook.document.delete': 'Elimina',

    'prompts.codeReadability.title':
      'Ottenere aiuto sulla leggibilità del codice',
    'prompts.codeReadability.message':
      'Puoi suggerirmi delle tecniche da utilizzare per rendere il mio codice più leggibile e gestibile?',
    'prompts.debugging.title': 'Ottenere aiuto con il debug',
    'prompts.debugging.message':
      'La mia applicazione genera un errore quando tenta di connettersi al database. Puoi aiutarmi a identificare il problema?',
    'prompts.developmentConcept.title': 'Spiegare un concetto di sviluppo',
    'prompts.developmentConcept.message':
      "Puoi spiegarmi come funziona l'architettura dei microservizi e quali vantaggi ha rispetto alla progettazione monolitica?",
    'prompts.codeOptimization.title': 'Suggerimenti per ottimizzare il codice',
    'prompts.codeOptimization.message':
      'Puoi suggerirmi metodi comuni per ottimizzare il codice e ottenere prestazioni migliori?',
    'prompts.documentation.title': 'Riepilogo della documentazione',
    'prompts.documentation.message':
      "Puoi riassumere la documentazione per implementare l'autenticazione OAuth 2.0 in un'app web?",
    'prompts.gitWorkflows.title': 'Flussi di lavoro con Git',
    'prompts.gitWorkflows.message':
      "Voglio apportare modifiche al codice su un'altra diramazione, senza perdere il lavoro svolto in precedenza. Qual è la procedura per farlo utilizzando Git?",
    'prompts.testingStrategies.title': 'Suggerimenti su strategie di test',
    'prompts.testingStrategies.message':
      'Puoi consigliarmi alcune strategie di test comuni in grado di rendere la mia applicazione efficiente e priva di errori?',
    'prompts.sortingAlgorithms.title': 'Svelare gli algoritmi di ordinamento',
    'prompts.sortingAlgorithms.message':
      'Puoi spiegarmi la differenza tra un algoritmo quicksort e un algoritmo merge sort e quando utilizzare ognuno di essi?',
    'prompts.eventDriven.title':
      "Comprendere l'architettura guidata dagli eventi",
    'prompts.eventDriven.message':
      "Puoi spiegarmi cos'è l'architettura guidata dagli eventi e quando è utile utilizzarla nello sviluppo software?",
    'prompts.tekton.title': 'Deployment con Tekton',
    'prompts.tekton.message':
      'Puoi aiutarmi ad automatizzare il deployment della mia applicazione utilizzando le pipeline Tekton?',
    'prompts.openshift.title': 'Creare un deployment in OpenShift',
    'prompts.openshift.message':
      "Puoi guidarmi nella creazione di un nuovo deployment in OpenShift per un'applicazione containerizzata?",
    'prompts.rhdh.title': 'Introduzione a Red Hat Developer Hub',
    'prompts.rhdh.message':
      'Puoi guidarmi nelle prime fasi per iniziare a utilizzare Developer Hub come sviluppatore, ad esempio esplorando il catalogo software e aggiungendo il mio servizio?',
    'conversation.delete.confirm.title': 'Eliminare la chat?',
    'conversation.delete.confirm.message':
      'Questa chat non sarà più visibile qui. Dalla tua attività Lightspeed verranno eliminate anche le attività correlate, come prompt, risposte e feedback.',
    'conversation.delete.confirm.action': 'Elimina',
    'conversation.rename.confirm.title': 'Rinominare la chat?',
    'conversation.rename.confirm.action': 'Rinomina',
    'conversation.rename.placeholder': 'Nome della chat',
    'permission.required.title': 'Autorizzazioni mancanti',
    'permission.required.description':
      "Per visualizzare <subject/>, contattare l'amministratore per ottenere l'autorizzazione <permissions/>.",
    'permission.subject.plugin': 'il plugin Lightspeed',
    'permission.subject.notebooks': 'i quaderni Lightspeed',
    'permission.notebooks.goBack': 'Torna indietro',
    'lcore.notConfigured.title': 'Collega un LLM per iniziare',
    'lcore.notConfigured.description':
      "Lightspeed richiede un LLM registrato. Contattare l'amministratore della piattaforma dell'organizzazione per completare la configurazione.",
    'lcore.notConfigured.developerLightspeedDocs':
      'Configurazione di Developer Lightspeed',
    'lcore.notConfigured.backendDocs': 'Configurazione backend Lightspeed',
    'lcore.loadError.title': 'Impossibile caricare i modelli',
    'lcore.loadError.description':
      'Il backend Lightspeed non ha restituito un elenco di modelli. Verifica che il servizio sia in esecuzione e raggiungibile, quindi riprova.',
    'disclaimer.withValidation':
      'Questa funzione utilizza una tecnologia AI. Non includere nei dati immessi informazioni personali o altre informazioni sensibili. Le interazioni possono essere utilizzate per migliorare i prodotti o i servizi Red Hat.',
    'disclaimer.withoutValidation':
      'Questa funzione utilizza una tecnologia AI. Non includere nei dati immessi informazioni personali o altre informazioni sensibili. Le interazioni possono essere utilizzate per migliorare i prodotti o i servizi Red Hat.',
    'footer.accuracy.label':
      "Esaminare sempre i contenuti generati dall'intelligenza artificiale prima di utilizzarli.",
    'common.cancel': 'Cancella',
    'common.close': 'Chiudi',
    'common.readMore': 'Per saperne di più',
    'common.retry': 'Riprova',
    'common.loading': 'Caricamento in corso',
    'common.noSearchResults': 'Nessun risultato corrisponde alla ricerca',
    'menu.newConversation': 'Nuova chat',
    'chatbox.header.title': 'Sviluppatore Lightspeed',
    'chatbox.search.placeholder': 'Ricerca',
    'chatbox.provider.other': 'Altro',
    'chatbox.emptyState.noPinnedChats': 'Nessuna chat bloccata',
    'chatbox.emptyState.noRecentChats': 'Nessuna chat recente',
    'chatbox.emptyState.noResults.title': 'Nessun risultato trovato',
    'chatbox.emptyState.noResults.body':
      "Modificare la query di ricerca e riprovare. Controllare l'ortografia o provare un termine più generico.",
    'chatbox.welcome.greeting': 'Ciao {{userName}},',
    'chatbox.welcome.description': 'come posso aiutarti oggi?',
    'chatbox.message.placeholder': 'Inserisci un prompt per Lightspeed',
    'chatbox.fileUpload.failed': 'Caricamento del file non riuscito',
    'chatbox.fileUpload.infoText':
      'I tipi di file supportati sono: .txt, .yaml e .json. La dimensione massima del file è 25 MB.',
    'aria.chatbotSelector': 'Selettore di chatbot',
    'aria.important': 'Importante',
    'aria.chatHistoryMenu': 'Menu cronologia chat',
    'aria.closeDrawerPanel': 'Chiudi riquadro',
    'aria.search.placeholder': 'Ricerca',
    'aria.searchPreviousConversations': 'Cerca conversazioni precedenti',
    'aria.resize': 'Ridimensiona',
    'aria.options.label': 'Opzioni',
    'aria.scroll.down': 'Torna alla fine',
    'aria.scroll.up': "Torna all'inizio",
    'aria.settings.label': 'Opzioni chatbot',
    'aria.close': 'Chiudi chatbot',
    'modal.edit': 'Modifica',
    'modal.save': 'Salva',
    'modal.close': 'Chiudi',
    'modal.cancel': 'Cancella',
    'conversation.delete': 'Elimina',
    'conversation.rename': 'Rinomina',
    'conversation.addToPinnedChats': 'Blocca',
    'conversation.removeFromPinnedChats': 'Sblocca',
    'conversation.announcement.userMessage':
      "Messaggio dall'utente: {{prompt}}. Caricamento in corso del messaggio del bot.",
    'conversation.announcement.responseStopped': 'Risposta interrotta.',
    'user.guest': 'Ospite',
    'user.loading': '...',
    'tooltip.attach': 'Allega',
    'tooltip.send': 'Invia',
    'tooltip.microphone.active': 'Non ascoltare più',
    'tooltip.microphone.inactive': 'Usa il microfono',
    'button.newChat': 'Nuova chat',
    'tooltip.chatHistoryMenu': 'Menu cronologia chat',
    'tooltip.responseRecorded': 'Risposta registrata',
    'tooltip.backToTop': "Torna all'inizio",
    'tooltip.backToBottom': 'Torna alla fine',
    'tooltip.settings': 'Opzioni chatbot',
    'tooltip.close': 'Chiudi',
    'modal.title.preview': 'Anteprima allegato',
    'modal.title.edit': 'Modifica allegato',
    'icon.lightspeed.alt': 'icona di lightspeed',
    'icon.permissionRequired.alt': 'icona di autorizzazione richiesta',
    'message.options.label': 'Opzioni',
    'file.upload.error.alreadyExists': 'Il file esiste già.',
    'file.upload.error.multipleFiles': 'È stato caricato più di un file.',
    'file.upload.error.unsupportedType':
      'Tipo di file non supportato. I tipi supportati sono: .txt, .yaml e .json.',
    'file.upload.error.fileTooLarge':
      'Dimensione del file troppo grande. Verificare che il file sia inferiore a 25 MB.',
    'file.upload.error.readFailed':
      'Impossibile leggere il file: {{errorMessage}}',
    'error.context.fileAttachment':
      "useFileAttachmentContext deve essere all'interno di un FileAttachmentContextProvider",
    'feedback.form.title': 'Perché hai scelto questa valutazione?',
    'feedback.form.textAreaPlaceholder':
      'Fornire commenti aggiuntivi facoltativi',
    'feedback.form.submitWord': 'Invia',
    'feedback.tooltips.goodResponse': 'Risposta valida',
    'feedback.tooltips.badResponse': 'Risposta non valida',
    'feedback.tooltips.copied': 'Copiato',
    'feedback.tooltips.copy': 'Copia',
    'feedback.tooltips.listening': 'In ascolto',
    'feedback.tooltips.listen': 'Ascoltare',
    'feedback.quickResponses.positive.helpful': 'Informazioni utili',
    'feedback.quickResponses.positive.easyToUnderstand': 'Facile da capire',
    'feedback.quickResponses.positive.resolvedIssue':
      'Ha risolto il mio problema',
    'feedback.quickResponses.negative.didntAnswer':
      'Non ha risposto alla mia domanda',
    'feedback.quickResponses.negative.hardToUnderstand': 'Difficile da capire',
    'feedback.quickResponses.negative.notHelpful': 'Non utile',
    'feedback.completion.title': 'Feedback inviato',
    'feedback.completion.body':
      'Abbiamo ricevuto la tua risposta. Grazie per aver condiviso i tuoi commenti!',
    'conversation.category.pinnedChats': 'Bloccata',
    'conversation.category.recent': 'Recente',
    'settings.pinned.enable': 'Abilita le chat bloccate',
    'settings.pinned.disable': 'Disattiva le chat bloccate',
    'settings.pinned.enabled.description':
      'Le chat bloccate sono attualmente abilitate',
    'settings.pinned.disabled.description':
      'Le chat bloccate sono attualmente disabilitate',
    'settings.mcp.label': 'Impostazioni MCP',
    'mcp.settings.title': 'Server MCP',
    'mcp.settings.selectedCount':
      '{{selectedCount}} di {{totalCount}} selezionati',
    'mcp.settings.closeAriaLabel': 'Chiudi impostazioni MCP',
    'mcp.settings.readOnlyAccess':
      "Disponi dell'accesso in sola lettura ai server MCP.",
    'mcp.settings.tableAriaLabel': 'Tabella dei server MCP',
    'mcp.settings.enabled': 'Abilitato',
    'mcp.settings.name': 'Nome',
    'mcp.settings.status': 'Stato',
    'mcp.settings.edit': 'Modifica',
    'mcp.settings.loading': 'Caricamento dei server MCP...',
    'mcp.settings.noneAvailable': 'Nessun server MCP disponibile.',
    'mcp.settings.status.disabled': 'Disabilitato',
    'mcp.settings.status.tokenRequired': 'Token richiesto',
    'mcp.settings.status.failed': 'Non riuscito',
    'mcp.settings.status.oneTool': '{{count}} strumento',
    'mcp.settings.status.manyTools': '{{count}} strumenti',
    'mcp.settings.status.unknown': 'Sconosciuto',
    'mcp.settings.toggleServerAriaLabel': 'Attiva/disattiva {{serverName}}',
    'mcp.settings.editServerAriaLabel': 'Modifica {{serverName}}',
    'mcp.settings.configureServerTitle': 'Configura server {{serverName}}',
    'mcp.settings.closeConfigureModalAriaLabel':
      'Chiudi finestra di configurazione',
    'mcp.settings.modalDescription':
      'Le credenziali sono crittografate a riposo e associate al tuo profilo. Lightspeed opererà con esattamente le tue autorizzazioni.',
    'mcp.settings.savedToken': 'Token salvato',
    'mcp.settings.personalAccessToken': 'Token di accesso personale',
    'mcp.settings.usingAdminCredential':
      "Sono in uso le credenziali fornite dall'amministratore. Inserisci un token personale per sovrascriverle per il tuo account.",
    'mcp.settings.enterToken': 'Inserisci il tuo token',
    'mcp.settings.removePersonalToken': 'Rimuovi token personale',
    'mcp.settings.token.clearAriaLabel': 'Cancella campo token',
    'mcp.settings.token.validating': 'Convalida del token in corso...',
    'mcp.settings.token.savingAndValidating':
      'Salvataggio e convalida del token in corso...',
    'mcp.settings.token.urlUnavailableForValidation':
      "Impossibile convalidare il token perché l'URL del server non è disponibile.",
    'mcp.settings.token.invalidCredentials':
      "Credenziali non valide. Controlla l'URL del server e il token.",
    'mcp.settings.token.validationFailed':
      "Convalida non riuscita. Controlla l'URL del server e il token.",
    'mcp.settings.token.connectionSuccessful': 'Connessione riuscita',
    // Display modes
    'settings.displayMode.label': 'Modalità di visualizzazione',
    'settings.displayMode.overlay': 'Sovrapposizione',
    'settings.displayMode.docked': 'Aggancia alla finestra',
    'settings.displayMode.fullscreen': 'Schermo intero',

    // Tool calling
    'toolCall.header': 'Risposta dello strumento: {{toolName}}',
    'toolCall.thinking': 'Ha pensato per {{seconds}} secondi',
    'toolCall.executionTime': 'Tempo di esecuzione: ',
    'toolCall.parameters': 'Parametri',
    'toolCall.response': 'Risposta',
    'toolCall.showMore': 'mostra di più',
    'toolCall.showLess': 'mostra di meno',
    'toolCall.loading': 'Esecuzione dello strumento...',
    'toolCall.executing': 'Esecuzione dello strumento...',
    'toolCall.copyResponse': 'Copia risposta',
    'toolCall.summary': 'Ecco un riepilogo della tua risposta',
    'toolCall.mcpServer': 'Server MCP',

    // Sort options
    'sort.label': 'Ordina conversazioni',
    'sort.newest': 'Data (più recente prima)',
    'sort.oldest': 'Data (meno recente prima)',
    'sort.alphabeticalAsc': 'Nome (A-Z)',
    'sort.alphabeticalDesc': 'Nome (Z-A)',

    // Deep thinking
    'reasoning.thinking': 'Mostra ragionamento',
  },
});

export default lightspeedTranslationIt;
