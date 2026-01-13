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
import { aiExperienceTranslationRef } from './ref';

/**
 * Italian translation for plugin.ai-experience.
 * @public
 */
const aiExperienceTranslationIt = createTranslationMessages({
  ref: aiExperienceTranslationRef,
  messages: {
    'page.title': 'Esperienza di intelligenza artificiale',
    'page.subtitle':
      "Esplora modelli, server, notizie e risorse di apprendimento sull'intelligenza artificiale",
    'learn.getStarted.title': 'Inizia',
    'learn.getStarted.description': 'Scopri di più su Red Hat Developer Hub.',
    'learn.getStarted.cta': 'Vai a Documenti tecnici',
    'learn.explore.title': 'Esplora',
    'learn.explore.description':
      'Esplora modelli e server di intelligenza artificiale.',
    'learn.explore.cta': 'Vai al Catalogo',
    'learn.learn.title': 'Apprendi',
    'learn.learn.description':
      "Esplora e sviluppa nuove competenze sull'intelligenza artificiale.",
    'learn.learn.cta': 'Vai ai Percorsi di apprendimento',
    'news.pageTitle': "Notizie sull'intelligenza artificiale",
    'news.fetchingRssFeed': 'Recupero del feed RSS',
    'news.noContentAvailable': 'Nessun contenuto disponibile',
    'news.noContentDescription':
      "Non è stato possibile ottenere contenuti dal feed RSS. Ricontrollare l'URL o passare a un'origine diversa aggiornando il file di configurazione del plugin.",
    'news.noRssContent': 'Nessun contenuto RSS',
    'modal.title.preview': 'Anteprima allegato',
    'modal.title.edit': 'Modifica allegato',
    'modal.edit': 'Modifica',
    'modal.save': 'Salva',
    'modal.close': 'Chiudi',
    'modal.cancel': 'Cancella',
    'common.viewMore': 'Visualizza altro',
    'common.guest': 'Ospite',
    'common.template': 'Modello',
    'common.latest': 'ultimo',
    'common.more': 'altro',
    'greeting.goodMorning': 'Buon giorno',
    'greeting.goodAfternoon': 'Buon pomeriggio',
    'greeting.goodEvening': 'Buona sera',
    'sections.exploreAiModels': 'Esplora i modelli di intelligenza artificiale',
    'sections.exploreAiTemplates':
      'Esplora i modelli di intelligenza artificiale',
    'sections.discoverModels':
      'Scopri i modelli e i servizi di intelligenza artificiale disponibili nella tua organizzazione',
    'sections.viewAllModels': 'Visualizza tutti i {{count}} modelli',
    'sections.viewAllTemplates': 'Visualizza tutti i {{count}} modelli',
    'accessibility.close': 'chiudi',
    'accessibility.aiIllustration':
      "Illustrazione dell'intelligenza artificiale",
    'accessibility.aiModelsIllustration':
      'Illustrazione dei modelli di intelligenza artificiale',
  },
});

export default aiExperienceTranslationIt;
