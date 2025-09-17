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
 * Italian translation for Homepage.
 * @public
 */
const homepageTranslationIt = createTranslationMessages({
  ref: homepageTranslationRef,
  messages: {
    'header.welcome': 'Bentornato!',
    'header.welcomePersonalized': 'Bentornato, {{name}}!',
    'header.local': 'Locale',
    'homePage.empty':
      'Nessuna scheda della homepage (punti di montaggio) configurata o trovata.',
    'search.placeholder': 'Cerca',
    'quickAccess.title': 'Accesso rapido',
    'quickAccess.fetchError': 'Impossibile recuperare i dati.',
    'quickAccess.error': 'Errore sconosciuto',
    'featuredDocs.learnMore': ' Scopri di più',
    'templates.title': 'Esplora modelli',
    'templates.fetchError': 'Impossibile recuperare i dati.',
    'templates.error': 'Errore sconosciuto',
    'templates.empty': 'Nessun modello aggiunto ancora',
    'templates.emptyDescription':
      'Una volta aggiunti i modelli, questo spazio mostrerà contenuti rilevanti personalizzati per la tua esperienza.',
    'templates.register': 'Registra un modello',
    'templates.viewAll': 'Visualizza tutti i {{count}} modelli',
    'onboarding.greeting.goodMorning': 'Buongiorno',
    'onboarding.greeting.goodAfternoon': 'Buon pomeriggio',
    'onboarding.greeting.goodEvening': 'Buonasera',
    'onboarding.guest': 'Ospite',
    'onboarding.getStarted.title': 'Inizia',
    'onboarding.getStarted.description': 'Scopri Red Hat Developer Hub.',
    'onboarding.getStarted.buttonText': 'Leggi la documentazione',
    'onboarding.getStarted.ariaLabel':
      'Leggi la documentazione (si apre in una nuova scheda)',
    'onboarding.explore.title': 'Esplora',
    'onboarding.explore.description': 'Esplora componenti, API e modelli.',
    'onboarding.explore.buttonText': 'Vai al catalogo',
    'onboarding.explore.ariaLabel': 'Vai al catalogo',
    'onboarding.learn.title': 'Impara',
    'onboarding.learn.description': 'Esplora e sviluppa nuove competenze.',
    'onboarding.learn.buttonText': 'Vai ai percorsi di apprendimento',
    'onboarding.learn.ariaLabel': 'Vai ai percorsi di apprendimento',
    'entities.title': 'Esplora il tuo catalogo software',
    'entities.fetchError': 'Impossibile recuperare i dati.',
    'entities.error': 'Errore sconosciuto',
    'entities.description':
      'Sfoglia i sistemi, componenti, risorse e API disponibili nella tua organizzazione.',
    'entities.close': 'chiudi',
    'entities.empty': 'Nessun catalogo software aggiunto ancora',
    'entities.emptyDescription':
      'Una volta aggiunti i cataloghi software, questo spazio mostrerà contenuti rilevanti personalizzati per la tua esperienza.',
    'entities.register': 'Registra un componente',
    'entities.viewAll': 'Visualizza tutte le {{count}} entità del catalogo',
  },
});

export default homepageTranslationIt;
