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
import { globalHeaderTranslationRef } from './ref';

/**
 * Italian translation for plugin.global-header.
 * @public
 */
const globalHeaderTranslationIt = createTranslationMessages({
  ref: globalHeaderTranslationRef,
  messages: {
    'help.tooltip': 'Assistenza',
    'help.noSupportLinks': 'Nessun link di supporto',
    'help.noSupportLinksSubtitle':
      'Il tuo amministratore deve configurare i link di supporto.',
    'help.quickStart': 'Avvio rapido',
    'help.supportTitle': 'Supporto',
    'profile.picture': 'Immagine del profilo',
    'profile.settings': 'Impostazioni',
    'profile.myProfile': 'Il mio profilo',
    'profile.signOut': 'Disconnessione',
    'search.placeholder': 'Ricerca...',
    'search.noResults': 'Nessun risultato trovato',
    'search.errorFetching': "Errore durante l'estrazione dei risultati",
    'search.allResults': 'Tutti i risultati',
    'search.clear': 'Cancella',
    'applicationLauncher.tooltip': 'Avvio applicazioni',
    'applicationLauncher.noLinksTitle':
      "Nessun link dell'applicazione configurato",
    'applicationLauncher.noLinksSubtitle':
      "Configura i link dell'applicazione nella configurazione dinamica del plugin per un accesso rapido da qui.",
    'applicationLauncher.developerHub': 'Developer Hub',
    'applicationLauncher.rhdhLocal': 'RHDH Local',
    'applicationLauncher.sections.documentation': 'Documentazione',
    'applicationLauncher.sections.developerTools': 'Strumenti per sviluppatori',
    'starred.title': 'I tuoi elementi preferiti',
    'starred.removeTooltip': 'Rimuovi dalla lista',
    'starred.noItemsTitle': 'Ancora nessun elemento preferito',
    'starred.noItemsSubtitle':
      "Fai clic sull'icona a forma di stella accanto al nome di un'entità per salvarla qui e accedervi rapidamente.",
    'notifications.title': 'Notifiche',
    'notifications.unsupportedDismissOption':
      'Opzione di chiusura non supportata "{{option}}", attualmente supportate "none", "session" o "localstorage"!',
  },
});

export default globalHeaderTranslationIt;
