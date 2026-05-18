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
    'accessibility.aiIllustration': 'Illustrazione IA',
    'accessibility.aiModelsIllustration': 'Illustrazione dei modelli IA',
    'accessibility.close': 'chiudi',
    'common.guest': 'Guest',
    'common.latest': 'ultimo',
    'common.more': 'altro',
    'common.template': 'Modello',
    'common.viewMore': 'Visualizza di più',
    'greeting.goodAfternoon': 'Buon pomeriggio',
    'greeting.goodEvening': 'Buonasera',
    'greeting.goodMorning': 'Buongiorno',
    'learn.explore.cta': 'Vai al catalogo',
    'learn.explore.description': 'Esplora modelli, server e template IA.',
    'learn.explore.title': 'Esplora',
    'learn.getStarted.cta': 'Vai ai TechDocs',
    'learn.getStarted.description': 'Scopri Red Hat Developer Hub.',
    'learn.getStarted.title': 'Inizia subito',
    'learn.learn.cta': 'Vai ai Learning Path',
    'learn.learn.description':
      "Esplora e sviluppa nuove competenze nel campo dell'intelligenza artificiale.",
    'learn.learn.title': 'Impara',
    'modal.cancel': 'Annulla',
    'modal.close': 'Chiudi',
    'modal.edit': 'Modifica',
    'modal.save': 'Salva',
    'modal.title.edit': 'Modifica appendice',
    'modal.title.preview': 'Anteprima appendice',
    'news.fetchingRssFeed': 'Estrazione feed RSS',
    'news.noContentAvailable': 'Nessun contenuto disponibile',
    'news.noContentDescription':
      "Sembra che non sia stato possibile recuperare contenuti da quel feed RSS. È possibile ricontrollare l'URL o passare a una sorgente diversa aggiornando il file di configurazione del plugin.",
    'news.noRssContent': 'Nessun contenuto RSS',
    'news.pageTitle': "Notizie sull'IA",
    'page.subtitle':
      'Esplora modelli, server, notizie e risorse di apprendimento IA',
    'page.title': 'Esperienza IA',
    'sections.discoverModels':
      'Scopri i modelli e i servizi IA disponibili nella tua organizzazione',
    'sections.exploreAiModels': 'Esplora i modelli IA',
    'sections.exploreAiTemplates': 'Esplora i template IA',
    'sections.viewAllModels': 'Visualizza tutti i {{count}} modelli',
    'sections.viewAllTemplates': 'Visualizza tutti i {{count}} template',
  },
});

export default aiExperienceTranslationIt;
