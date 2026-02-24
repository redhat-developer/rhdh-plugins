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
import { homepageTranslationRef } from './ref';

/**
 * Italian translation for plugin.dynamic-home-page.
 * @public
 */
const homepageTranslationIt = createTranslationMessages({
  ref: homepageTranslationRef,
  messages: {
    'header.welcome': 'Bentornato/a!',
    'header.welcomePersonalized': 'Bentornato/a, {{name}}!',
    'header.local': 'Locale',
    'homePage.empty':
      'Nessuna scheda home page (punto di montaggio) configurata o trovata.',
    'search.placeholder': 'Ricerca',
    'quickAccess.title': 'Accesso rapido',
    'quickAccess.fetchError': 'Impossibile recuperare i dati.',
    'quickAccess.error': 'Errore sconosciuto',
    'featuredDocs.learnMore': ' Per saperne di più',
    'templates.title': 'Esplora i modelli',
    'templates.fetchError': 'Impossibile recuperare i dati.',
    'templates.error': 'Errore sconosciuto',
    'templates.empty': 'Non è stato ancora aggiunto alcun modello',
    'templates.emptyDescription':
      "Una volta aggiunti i modelli, in quest'area verranno visualizzati contenuti pertinenti e personalizzati in base all'esperienza dell'utente.",
    'templates.register': 'Registra un modello',
    'templates.viewAll': 'Visualizza tutti i {{count}} modelli',
    'onboarding.greeting.goodMorning': 'Buon giorno',
    'onboarding.greeting.goodAfternoon': 'Buon pomeriggio',
    'onboarding.greeting.goodEvening': 'Buona sera',
    'onboarding.guest': 'Ospite',
    'onboarding.getStarted.title': 'Inizia',
    'onboarding.getStarted.description':
      'Scopri di più su Red Hat Developer Hub.',
    'onboarding.getStarted.buttonText': 'Leggi la documentazione',
    'onboarding.getStarted.ariaLabel':
      'Leggi la documentazione (si apre in una nuova scheda)',
    'onboarding.explore.title': 'Esplora',
    'onboarding.explore.description': 'Esplora componenti, API e modelli.',
    'onboarding.explore.buttonText': 'Vai al Catalogo',
    'onboarding.explore.ariaLabel': 'Vai al Catalogo',
    'onboarding.learn.title': 'Apprendi',
    'onboarding.learn.description': 'Esplora e sviluppa nuove competenze.',
    'onboarding.learn.buttonText': 'Vai ai Percorsi di apprendimento',
    'onboarding.learn.ariaLabel': 'Vai ai Percorsi di apprendimento',
    'entities.title': 'Esplora il Catalogo software',
    'entities.fetchError': 'Impossibile recuperare i dati.',
    'entities.error': 'Errore sconosciuto',
    'entities.description':
      'Esplora i sistemi, i componenti, le risorse e le API disponibili nella tua organizzazione.',
    'entities.close': 'chiudi',
    'entities.empty': 'Non è stato ancora aggiunto alcun catalogo software',
    'entities.emptyDescription':
      "Una volta aggiunti i cataloghi software, in quest'area verranno visualizzati contenuti pertinenti e personalizzati in base all'esperienza dell'utente.",
    'entities.register': 'Registrare un componente',
    'entities.viewAll': 'Visualizza tutte le {{count}} entità del catalogo',
  },
});

export default homepageTranslationIt;
