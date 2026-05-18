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
    'page.title': 'Esperienza IA',
    'page.subtitle': 'Esplora modelli, server, notizie e risorse di apprendimento IA',
    'learn.getStarted.title': 'Inizia subito',
    'learn.getStarted.description': 'Scopri Red Hat Developer Hub.',
    'learn.getStarted.cta': 'Vai ai TechDocs',
    'learn.explore.title': 'Esplora',
    'learn.explore.description': 'Esplora modelli, server e template IA.',
    'learn.learn.title': 'Impara',
    'learn.learn.description': 'Esplora e sviluppa nuove competenze nel campo dell\'intelligenza artificiale.',
    'learn.learn.cta': 'Vai ai Learning Path',
    'news.pageTitle': 'Notizie sull\'IA',
    'news.fetchingRssFeed': 'Estrazione feed RSS',
    'news.noContentAvailable': 'Nessun contenuto disponibile',
    'news.noContentDescription': 'Sembra che non sia stato possibile recuperare contenuti da quel feed RSS. È possibile ricontrollare l\'URL o passare a una sorgente diversa aggiornando il file di configurazione del plugin.',
    'news.noRssContent': 'Nessun contenuto RSS',
    'modal.title.preview': 'Anteprima appendice',
    'modal.title.edit': 'Modifica appendice',
    'modal.edit': 'Modifica',
    'modal.save': 'Salva',
    'modal.close': 'Chiudi',
    'modal.cancel': 'Annulla',
    'common.viewMore': 'Visualizza di più',
    'common.guest': 'Guest',
    'common.template': 'Modello',
    'common.latest': 'ultimo',
    'common.more': 'altro',
    'greeting.goodMorning': 'Buongiorno',
    'greeting.goodAfternoon': 'Buon pomeriggio',
    'greeting.goodEvening': 'Buonasera',
    'sections.exploreAiModels': 'Esplora i modelli IA',
    'sections.exploreAiTemplates': 'Esplora i template IA',
    'sections.discoverModels': 'Scopri i modelli e i servizi IA disponibili nella tua organizzazione',
    'sections.viewAllModels': 'Visualizza tutti i {{count}} modelli',
    'sections.viewAllTemplates': 'Visualizza tutti i {{count}} template',
    'accessibility.close': 'chiudi',
    'accessibility.aiIllustration': 'Illustrazione IA',
    'accessibility.aiModelsIllustration': 'Illustrazione dei modelli IA',
  },
});

export default aiExperienceTranslationIt;
