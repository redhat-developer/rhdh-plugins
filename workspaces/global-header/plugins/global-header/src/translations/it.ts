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

const globalHeaderTranslationIt = createTranslationMessages({
  ref: globalHeaderTranslationRef,
  messages: {
    'help.tooltip': 'Aiuto',
    'help.noSupportLinks': 'Nessun link di supporto',
    'help.noSupportLinksSubtitle':
      'Il tuo amministratore deve configurare i link di supporto.',
    'help.quickStart': 'Avvio rapido',
    'help.supportTitle': 'Supporto',
    'profile.picture': 'Immagine del profilo',
    'profile.settings': 'Impostazioni',
    'profile.myProfile': 'Il mio profilo',
    'profile.signOut': 'Esci',
    'search.placeholder': 'Cerca...',
    'search.noResults': 'Nessun risultato trovato',
    'search.errorFetching': 'Errore nel recupero dei risultati',
    'applicationLauncher.tooltip': 'Launcher applicazioni',
    'applicationLauncher.noLinksTitle': 'Nessun link applicazione configurato',
    'applicationLauncher.noLinksSubtitle':
      'Configura i link delle applicazioni nella configurazione del plugin dinamico per un accesso rapido da qui.',
    'applicationLauncher.developerHub': 'Developer Hub',
    'applicationLauncher.rhdhLocal': 'RHDH Local',
    'applicationLauncher.sections.documentation': 'Documentazione',
    'applicationLauncher.sections.developerTools': 'Strumenti per sviluppatori',
    'starred.title': 'I tuoi elementi preferiti',
    'starred.removeTooltip': 'Rimuovi dalla lista',
    'starred.noItemsTitle': 'Nessun elemento preferito ancora',
    'starred.noItemsSubtitle':
      "Clicca sull'icona stella accanto al nome di un'entità per salvarla qui per un accesso rapido.",
    'notifications.title': 'Notifiche',
    'notifications.unsupportedDismissOption':
      'Opzione di chiusura non supportata "{{option}}", attualmente supportate "none", "session" o "localstorage"!',
    'create.title': 'Autoservizio',
    'create.registerComponent.title': 'Registra un componente',
    'create.registerComponent.subtitle': 'Importalo nella pagina del catalogo',
    'create.templates.sectionTitle': 'Usa un modello',
    'create.templates.allTemplates': 'Tutti i modelli',
    'create.templates.errorFetching': 'Errore nel recupero dei modelli',
    'create.templates.noTemplatesAvailable': 'Nessun modello disponibile',
  },
});

export default globalHeaderTranslationIt;
