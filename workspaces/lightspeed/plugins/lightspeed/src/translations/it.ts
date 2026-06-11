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
    'aria.chatHistoryMenu': 'Menu cronologia chat',
    'aria.chatbotSelector': 'Selettore di chatbot',
    'aria.close': 'Chiudi chatbot',
    'aria.closeDrawerPanel': 'Chiudi riquadro',
    'aria.important': 'Importante',
    'aria.options.label': 'Opzioni',
    'aria.resize': 'Ridimensiona',
    'aria.scroll.down': 'Torna alla fine',
    'aria.scroll.up': "Torna all'inizio",
    'aria.search.placeholder': 'Ricerca',
    'aria.searchPreviousConversations': 'Cerca conversazioni precedenti',
    'aria.settings.label': 'Opzioni chatbot',
    'attach.menu.description': 'Allega un file JSON, YAML o TXT',
    'attach.menu.title': 'Allega',
    'button.newChat': 'Nuova chat',
    'chatbox.emptyState.noPinnedChats': 'Fissa le chat per mantenerle in alto',
    'chatbox.emptyState.noRecentChats': 'Nessuna chat recente',
    'chatbox.emptyState.noResults.body':
      "Modificare la query di ricerca e riprovare. Controllare l'ortografia o provare un termine più generico.",
    'chatbox.emptyState.noResults.title': 'Nessun risultato trovato',
    'chatbox.fileUpload.failed': 'Caricamento del file non riuscito',
    'chatbox.fileUpload.infoText':
      'I tipi di file supportati sono: .txt, .yaml e .json. La dimensione massima del file è 25 MB.',
    'chatbox.header.title': 'Developer Hub Intelligent Assistant',
    'chatbox.message.placeholder': 'Invia un messaggio',
    'chatbox.provider.other': 'Altro',
    'chatbox.search.placeholder': 'Ricerca',
    'chatbox.welcome.description': 'come posso aiutarti oggi?',
    'chatbox.welcome.greeting': 'Ciao {{userName}},',
    'common.cancel': 'Cancella',
    'common.close': 'Chiudi',
    'common.loading': 'Caricamento in corso',
    'common.noSearchResults': 'Nessun risultato corrisponde alla ricerca',
    'common.readMore': 'Per saperne di più',
    'common.retry': 'Riprova',
    'conversation.addToPinnedChats': 'Blocca',
    'conversation.announcement.responseStopped': 'Risposta interrotta.',
    'conversation.announcement.userMessage':
      "Messaggio dall'utente: {{prompt}}. Caricamento in corso del messaggio del bot.",
    'conversation.category.pinnedChats': 'Chat fissate',
    'conversation.category.recent': 'Chat',
    'conversation.delete': 'Elimina',
    'conversation.delete.confirm.action': 'Elimina',
    'conversation.delete.confirm.message':
      'Questa chat non sarà più visibile qui. Dalla tua attività verranno eliminate anche le attività correlate, come prompt, risposte e feedback.',
    'conversation.delete.confirm.title': 'Eliminare la chat?',
    'conversation.removeFromPinnedChats': 'Sblocca',
    'conversation.rename': 'Rinomina',
    'conversation.rename.confirm.action': 'Rinomina',
    'conversation.rename.confirm.title': 'Rinominare la chat?',
    'conversation.rename.placeholder': 'Nome della chat',
    'disclaimer.withValidation':
      'Questa funzione utilizza una tecnologia AI. Non includere nei dati immessi informazioni personali o altre informazioni sensibili. Le interazioni possono essere utilizzate per migliorare i prodotti o i servizi Red Hat.',
    'disclaimer.withoutValidation':
      'Questa funzione utilizza una tecnologia AI. Non includere nei dati immessi informazioni personali o altre informazioni sensibili. Le interazioni possono essere utilizzate per migliorare i prodotti o i servizi Red Hat.',
    'error.context.fileAttachment':
      "useFileAttachmentContext deve essere all'interno di un FileAttachmentContextProvider",
    'feedback.completion.body':
      'Abbiamo ricevuto la tua risposta. Grazie per aver condiviso i tuoi commenti!',
    'feedback.completion.title': 'Feedback inviato',
    'feedback.form.submitWord': 'Invia',
    'feedback.form.textAreaPlaceholder':
      'Fornire commenti aggiuntivi facoltativi',
    'feedback.form.title': 'Perché hai scelto questa valutazione?',
    'feedback.quickResponses.negative.didntAnswer':
      'Non ha risposto alla mia domanda',
    'feedback.quickResponses.negative.hardToUnderstand': 'Difficile da capire',
    'feedback.quickResponses.negative.notHelpful': 'Non utile',
    'feedback.quickResponses.positive.easyToUnderstand': 'Facile da capire',
    'feedback.quickResponses.positive.helpful': 'Informazioni utili',
    'feedback.quickResponses.positive.resolvedIssue':
      'Ha risolto il mio problema',
    'feedback.tooltips.badResponse': 'Risposta non valida',
    'feedback.tooltips.copied': 'Copiato',
    'feedback.tooltips.copy': 'Copia',
    'feedback.tooltips.goodResponse': 'Risposta valida',
    'feedback.tooltips.listen': 'Ascoltare',
    'feedback.tooltips.listening': 'In ascolto',
    'file.upload.error.alreadyExists': 'Il file esiste già.',
    'file.upload.error.fileTooLarge':
      'Dimensione del file troppo grande. Verificare che il file sia inferiore a 25 MB.',
    'file.upload.error.multipleFiles': 'È stato caricato più di un file.',
    'file.upload.error.readFailed':
      'Impossibile leggere il file: {{errorMessage}}',
    'file.upload.error.unsupportedType':
      'Tipo di file non supportato. I tipi supportati sono: .txt, .yaml e .json.',
    'footer.accuracy.label':
      "Esaminare sempre i contenuti generati dall'intelligenza artificiale prima di utilizzarli.",
    'icon.lightspeed.alt': "icona dell'assistente intelligente",
    'icon.permissionRequired.alt': 'icona di autorizzazione richiesta',
    'lcore.loadError.description':
      "Il backend dell'assistente intelligente non ha restituito un elenco di modelli. Verifica che il servizio sia in esecuzione e raggiungibile, quindi riprova.",
    'lcore.loadError.title': 'Impossibile caricare i modelli',
    'lcore.notConfigured.backendDocs':
      "Configurazione backend dell'assistente intelligente",
    'lcore.notConfigured.description':
      "L'assistente intelligente richiede un LLM registrato. Contattare l'amministratore della piattaforma dell'organizzazione per completare la configurazione.",
    'lcore.notConfigured.developerLightspeedDocs':
      'Configurazione di Developer Hub Intelligent Assistant',
    'lcore.notConfigured.title': 'Collega un LLM per iniziare',
    'mcp.settings.closeAriaLabel': 'Chiudi impostazioni MCP',
    'mcp.settings.closeConfigureModalAriaLabel':
      'Chiudi finestra di configurazione',
    'mcp.settings.configureServerTitle': 'Configura server {{serverName}}',
    'mcp.settings.edit': 'Modifica',
    'mcp.settings.editServerAriaLabel': 'Modifica {{serverName}}',
    'mcp.settings.enabled': 'Abilitato',
    'mcp.settings.enterToken': 'Inserisci il tuo token',
    'mcp.settings.loading': 'Caricamento dei server MCP...',
    'mcp.settings.modalDescription':
      "Le credenziali sono crittografate a riposo e associate al tuo profilo. L'assistente intelligente opererà con esattamente le tue autorizzazioni.",
    'mcp.settings.name': 'Nome',
    'mcp.settings.noneAvailable': 'Nessun server MCP disponibile.',
    'mcp.settings.personalAccessToken': 'Token di accesso personale',
    'mcp.settings.readOnlyAccess':
      "Disponi dell'accesso in sola lettura ai server MCP.",
    'mcp.settings.removePersonalToken': 'Rimuovi token personale',
    'mcp.settings.savedToken': 'Token salvato',
    'mcp.settings.selectedCount':
      '{{selectedCount}} di {{totalCount}} selezionati',
    'mcp.settings.status': 'Stato',
    'mcp.settings.status.disabled': 'Disabilitato',
    'mcp.settings.status.failed': 'Non riuscito',
    'mcp.settings.status.manyTools': '{{count}} strumenti',
    'mcp.settings.status.oneTool': '{{count}} strumento',
    'mcp.settings.status.tokenRequired': 'Token richiesto',
    'mcp.settings.status.unknown': 'Sconosciuto',
    'mcp.settings.tableAriaLabel': 'Tabella dei server MCP',
    'mcp.settings.title': 'Server MCP',
    'mcp.settings.toggleServerAriaLabel': 'Attiva/disattiva {{serverName}}',
    'mcp.settings.token.clearAriaLabel': 'Cancella campo token',
    'mcp.settings.token.connectionSuccessful': 'Connessione riuscita',
    'mcp.settings.token.invalidCredentials':
      "Credenziali non valide. Controlla l'URL del server e il token.",
    'mcp.settings.token.savingAndValidating':
      'Salvataggio e convalida del token in corso...',
    'mcp.settings.token.urlUnavailableForValidation':
      "Impossibile convalidare il token perché l'URL del server non è disponibile.",
    'mcp.settings.token.validating': 'Convalida del token in corso...',
    'mcp.settings.token.validationFailed':
      "Convalida non riuscita. Controlla l'URL del server e il token.",
    'mcp.settings.usingAdminCredential':
      "Sono in uso le credenziali fornite dall'amministratore. Inserisci un token personale per sovrascriverle per il tuo account.",
    'menu.newConversation': 'Nuova chat',
    'message.options.label': 'Opzioni',
    'modal.cancel': 'Cancella',
    'modal.close': 'Chiudi',
    'modal.edit': 'Modifica',
    'modal.save': 'Salva',
    'modal.title.edit': 'Modifica allegato',
    'modal.title.preview': 'Anteprima allegato',
    'notebook.document.delete': 'Elimina',
    'notebook.document.delete.action': 'Rimuovi',
    'notebook.document.delete.description':
      'Sei sicuro di voler rimuovere <documentName/> da questo quaderno? Questa azione non può essere annullata.',
    'notebook.document.delete.success':
      '«{{documentName}}» rimosso con successo.',
    'notebook.document.delete.title': 'Rimuovere la risorsa?',
    'notebook.overwrite.modal.action': 'Sovrascrivi',
    'notebook.overwrite.modal.description':
      'I seguenti file esistono già in questo quaderno. Vuoi sovrascriverli con le nuove versioni?',
    'notebook.overwrite.modal.title': 'Sovrascrivere i file?',
    'notebook.upload.error.fileTooLarge':
      'Errore di caricamento: la dimensione del file supera il limite di 25 MB.',
    'notebook.upload.error.tooManyFiles':
      'Errore di caricamento: sono consentiti al massimo {{max}} file.',
    'notebook.upload.error.unsupportedType':
      'Errore di caricamento: trovati tipi di file non supportati. Caricare solo tipi di file supportati.',
    'notebook.upload.failed': 'Caricamento di "{{fileName}}" non riuscito.',
    'notebook.upload.modal.addButton': 'Aggiungi ({{count}})',
    'notebook.upload.modal.browseButton': 'Carica',
    'notebook.upload.modal.dragDropTitle': 'Trascina e rilascia i file qui',
    'notebook.upload.modal.infoText':
      'Tipi di file accettati: .md, .txt, .pdf, .json, .yaml, .log',
    'notebook.upload.modal.removeFile': 'Rimuovi {{fileName}}',
    'notebook.upload.modal.selectedFiles':
      '{{count}} di {{max}} file selezionati',
    'notebook.upload.modal.separator': 'o',
    'notebook.upload.modal.title': 'Aggiungi un documento al quaderno',
    'notebook.view.close': 'Chiudi quaderno',
    'notebook.view.documents.add': 'Aggiungi',
    'notebook.view.documents.count': '{{count}} Documenti',
    'notebook.view.documents.maxReached':
      'Sono consentiti al massimo 10 documenti. Elimina un documento per caricarne uno nuovo.',
    'notebook.view.documents.uploading': 'Caricamento documento',
    'notebook.view.input.disabledTooltip':
      'Seleziona almeno una risorsa caricata per iniziare a chattare',
    'notebook.view.input.placeholder':
      'Chiedi informazioni sui tuoi documenti...',
    'notebook.view.sidebar.collapse': 'Comprimi barra laterale',
    'notebook.view.sidebar.expand': 'Espandi barra laterale',
    'notebook.view.sidebar.resize': 'Ridimensiona barra laterale',
    'notebook.view.title': 'Quaderno senza titolo',
    'notebook.view.upload.action': 'Carica una risorsa',
    'notebook.view.processing.description':
      'I tuoi file sono in fase di indicizzazione. Potrai iniziare a fare domande una volta completata l’elaborazione.',
    'notebook.view.processing.heading': 'Elaborazione delle risorse...',
    'notebook.view.upload.heading': 'Carica una risorsa per iniziare',
    'notebooks.actions.delete': 'Elimina',
    'notebooks.actions.rename': 'Rinomina',
    'notebooks.card.openAria': 'Apri il taccuino {{name}}',
    'notebooks.delete.action': 'Elimina',
    'notebooks.delete.message':
      'Non vedrai più questo quaderno qui. Questo eliminerà anche le attività correlate come prompt, risposte e feedback dalla tua attività.',
    'notebooks.delete.title': 'Eliminare {{name}}?',
    'notebooks.delete.toast': 'Quaderno eliminato!',
    'notebooks.documents': 'Documenti',
    'notebooks.empty.action': 'Crea un nuovo quaderno',
    'notebooks.empty.description':
      'Crea un nuovo quaderno per organizzare le tue fonti e generare insight basati su IA.',
    'notebooks.empty.title': 'Nessun quaderno creato',
    'notebooks.prompts.accessIssue.title': 'Aiutami con un problema di accesso',
    'notebooks.prompts.coreConcepts.title': 'Quali sono i concetti chiave?',
    'notebooks.prompts.vulnerabilities.title':
      'Mostra le mie vulnerabilità critiche',
    'notebooks.rename.action': 'Invia',
    'notebooks.rename.description':
      'Inserisci il nuovo nome per questo quaderno e fai clic su Invia per continuare.',
    'notebooks.rename.label': 'Nuovo nome',
    'notebooks.rename.placeholder': 'Nuovo nome',
    'notebooks.rename.title': 'Rinominare {{name}}?',
    'notebooks.title': 'I miei quaderni',
    'notebooks.updated.days': 'Aggiornato {{days}} giorni fa',
    'notebooks.updated.on': 'Aggiornato il',
    'notebooks.updated.today': 'Aggiornato oggi',
    'notebooks.updated.yesterday': 'Aggiornato 1 giorno fa',
    'page.subtitle':
      "Assistente allo sviluppo basato sull'intelligenza artificiale",
    'page.title': 'Assistente intelligente',
    'permission.notebooks.goBack': 'Torna indietro',
    'permission.required.description':
      "Per visualizzare <subject/>, contattare l'amministratore per ottenere l'autorizzazione <permissions/>.",
    'permission.required.title': 'Autorizzazioni mancanti',
    'permission.subject.notebooks': "i quaderni dell'assistente intelligente",
    'permission.subject.plugin': "il plugin dell'assistente intelligente",
    'prompts.codeOptimization.message':
      'Puoi suggerirmi metodi comuni per ottimizzare il codice e ottenere prestazioni migliori?',
    'prompts.codeOptimization.title': 'Suggerimenti per ottimizzare il codice',
    'prompts.codeReadability.message':
      'Puoi suggerirmi delle tecniche da utilizzare per rendere il mio codice più leggibile e gestibile?',
    'prompts.codeReadability.title':
      'Ottenere aiuto sulla leggibilità del codice',
    'prompts.debugging.message':
      'La mia applicazione genera un errore quando tenta di connettersi al database. Puoi aiutarmi a identificare il problema?',
    'prompts.debugging.title': 'Ottenere aiuto con il debug',
    'prompts.developmentConcept.message':
      "Puoi spiegarmi come funziona l'architettura dei microservizi e quali vantaggi ha rispetto alla progettazione monolitica?",
    'prompts.developmentConcept.title': 'Spiegare un concetto di sviluppo',
    'prompts.documentation.message':
      "Puoi riassumere la documentazione per implementare l'autenticazione OAuth 2.0 in un'app web?",
    'prompts.documentation.title': 'Riepilogo della documentazione',
    'prompts.eventDriven.message':
      "Puoi spiegarmi cos'è l'architettura guidata dagli eventi e quando è utile utilizzarla nello sviluppo software?",
    'prompts.eventDriven.title':
      "Comprendere l'architettura guidata dagli eventi",
    'prompts.gitWorkflows.message':
      "Voglio apportare modifiche al codice su un'altra diramazione, senza perdere il lavoro svolto in precedenza. Qual è la procedura per farlo utilizzando Git?",
    'prompts.gitWorkflows.title': 'Flussi di lavoro con Git',
    'prompts.openshift.message':
      "Puoi guidarmi nella creazione di un nuovo deployment in OpenShift per un'applicazione containerizzata?",
    'prompts.openshift.title': 'Creare un deployment in OpenShift',
    'prompts.rhdh.message':
      'Puoi guidarmi nelle prime fasi per iniziare a utilizzare Developer Hub come sviluppatore, ad esempio esplorando il catalogo software e aggiungendo il mio servizio?',
    'prompts.rhdh.title': 'Introduzione a Red Hat Developer Hub',
    'prompts.sortingAlgorithms.message':
      'Puoi spiegarmi la differenza tra un algoritmo quicksort e un algoritmo merge sort e quando utilizzare ognuno di essi?',
    'prompts.sortingAlgorithms.title': 'Svelare gli algoritmi di ordinamento',
    'prompts.tekton.message':
      'Puoi aiutarmi ad automatizzare il deployment della mia applicazione utilizzando le pipeline Tekton?',
    'prompts.tekton.title': 'Deployment con Tekton',
    'prompts.testingStrategies.message':
      'Puoi consigliarmi alcune strategie di test comuni in grado di rendere la mia applicazione efficiente e priva di errori?',
    'prompts.testingStrategies.title': 'Suggerimenti su strategie di test',
    'reasoning.thinking': 'Mostra ragionamento',
    'settings.displayMode.docked': 'Aggancia alla finestra',
    'settings.displayMode.fullscreen': 'Schermo intero',
    'settings.displayMode.label': 'Modalità di visualizzazione',
    'settings.displayMode.overlay': 'Sovrapposizione',
    'settings.mcp.badge': 'Nuovo',
    'settings.mcp.label': 'Impostazioni MCP',
    'settings.pinned.disable': 'Disattiva le chat bloccate',
    'settings.pinned.disabled.description':
      'Le chat bloccate sono attualmente disabilitate',
    'settings.pinned.enable': 'Abilita le chat bloccate',
    'settings.pinned.enabled.description':
      'Le chat bloccate sono attualmente abilitate',
    'sort.alphabeticalAsc': 'Nome (A-Z)',
    'sort.alphabeticalDesc': 'Nome (Z-A)',
    'sort.label': 'Ordina conversazioni',
    'sort.newest': 'Data (più recente prima)',
    'sort.oldest': 'Data (meno recente prima)',
    'tabs.ariaLabel': "Viste dell'assistente intelligente",
    'tabs.chat': 'Chat',
    'tabs.notebooks': 'Quaderni',
    'tabs.notebooks.devPreview': 'Anteprima per sviluppatori',
    'tabs.notebooks.empty': 'Il contenuto dei quaderni va qui.',
    'toolCall.copyResponse': 'Copia risposta',
    'toolCall.executing': 'Esecuzione dello strumento...',
    'toolCall.executionTime': 'Tempo di esecuzione: ',
    'toolCall.header': 'Risposta dello strumento: {{toolName}}',
    'toolCall.loading': 'Esecuzione dello strumento...',
    'toolCall.mcpServer': 'Server MCP',
    'toolCall.parameters': 'Parametri',
    'toolCall.response': 'Risposta',
    'toolCall.showLess': 'mostra di meno',
    'toolCall.showMore': 'mostra di più',
    'toolCall.summary': 'Ecco un riepilogo della tua risposta',
    'toolCall.thinking': 'Ha pensato per {{seconds}} secondi',
    'tooltip.attach': 'Allega',
    'tooltip.backToBottom': 'Torna alla fine',
    'tooltip.backToTop': "Torna all'inizio",
    'tooltip.chatHistoryMenu': 'Menu cronologia chat',
    'tooltip.close': 'Chiudi',
    'tooltip.collapseHistoryPanel': 'Comprimi cronologia chat',
    'tooltip.expandHistoryPanel': 'Espandi cronologia chat',
    'tooltip.fab.close': 'Chiudi assistente intelligente',
    'tooltip.fab.open': 'Apri assistente intelligente',
    'tooltip.microphone.active': 'Non ascoltare più',
    'tooltip.microphone.inactive': 'Usa il microfono',
    'tooltip.quickNewChat': 'Nuova chat',
    'tooltip.responseRecorded': 'Risposta registrata',
    'tooltip.send': 'Invia',
    'tooltip.settings': 'Opzioni chatbot',
    'user.guest': 'Ospite',
    'user.loading': '...',
  },
});

export default lightspeedTranslationIt;
