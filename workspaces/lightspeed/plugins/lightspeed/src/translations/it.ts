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
      "Per visualizzare il plugin Lightspeed, contattare l'amministratore per ottenere le autorizzazioni <b>lightspeed.chat.read</b> e <b>lightspeed.chat.create</b>.",
    'disclaimer.withValidation':
      'Questa funzione utilizza una tecnologia AI. Non includere nei dati immessi informazioni personali o altre informazioni sensibili. Le interazioni possono essere utilizzate per migliorare i prodotti o i servizi Red Hat.',
    'disclaimer.withoutValidation':
      'Questa funzione utilizza una tecnologia AI. Non includere nei dati immessi informazioni personali o altre informazioni sensibili. Le interazioni possono essere utilizzate per migliorare i prodotti o i servizi Red Hat.',
    'footer.accuracy.label':
      "Esaminare sempre i contenuti generati dall'intelligenza artificiale prima di utilizzarli.",
    'common.cancel': 'Cancella',
    'common.close': 'Chiudi',
    'common.readMore': 'Per saperne di più',
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
