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
    'help.tooltip': 'Guida',
    'help.noSupportLinks': 'Nessun link di supporto',
    'help.noSupportLinksSubtitle':
      "L'amministratore deve impostare i link di supporto.",
    'help.quickStart': 'Avvio rapido',
    'help.supportTitle': 'Supporto',
    'profile.picture': 'Immagine del profilo',
    'profile.settings': 'Impostazioni',
    'profile.myProfile': 'Il mio profilo',
    'profile.signOut': 'Disconnetti',
    'search.placeholder': 'Cerca...',
    'search.noResults': 'Nessun risultato trovato',
    'search.errorFetching': 'Errore durante il recupero dei risultati',
    'applicationLauncher.tooltip': 'Avvio applicazione',
    'applicationLauncher.noLinksTitle':
      "Nessun collegamento all'applicazione configurato",
    'applicationLauncher.noLinksSubtitle':
      "Configurare i collegamenti all'applicazione nella configurazione del plugin dinamico per accedere rapidamente da qui.",
    'applicationLauncher.developerHub': 'Developer Hub',
    'applicationLauncher.rhdhLocal': 'RHDH Local',
    'applicationLauncher.sections.documentation': 'Documentazione',
    'applicationLauncher.sections.developerTools': 'Strumenti per sviluppatori',
    'starred.title': 'I tuoi articoli contrassegnati',
    'starred.removeTooltip': "Rimuovi dall'elenco",
    'starred.noItemsTitle': 'Non è stato ancora contrassegnato alcun articolo',
    'starred.noItemsSubtitle':
      "Fare clic sull'icona a forma di stella accanto al nome di un'entità per salvarla qui e accedervi rapidamente.",
    'notifications.title': 'Notifiche',
    'notifications.unsupportedDismissOption':
      'Opzione di esclusione non supportata "{{option}}"; attualmente sono supportate le opzioni "none", "session" o "localstorage"!',
    'create.title': 'Self-service',
    'create.registerComponent.title': 'Registrare un componente',
    'create.registerComponent.subtitle':
      'Importare il componente nella pagina del catalogo',
    'create.templates.sectionTitle': 'Utilizzare un modello',
    'create.templates.allTemplates': 'Tutti i modelli',
    'create.templates.errorFetching': 'Errore durante il recupero dei modelli',
    'create.templates.noTemplatesAvailable': 'Nessun modello disponibile',
  },
});

export default globalHeaderTranslationIt;
