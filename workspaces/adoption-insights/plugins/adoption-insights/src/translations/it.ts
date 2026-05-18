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
import { adoptionInsightsTranslationRef } from './ref';

/**
 * Italian translation for plugin.adoption-insights.
 * @alpha
 */
const adoptionInsightsTranslationIt = createTranslationMessages({
  ref: adoptionInsightsTranslationRef,
  messages: {
    'page.title': 'Insights adozione',
    'header.title': 'Insights adozione',
    'header.dateRange.today': 'Oggi',
    'header.dateRange.lastWeek': 'Ultima settimana',
    'header.dateRange.lastMonth': 'Ultimo mese',
    'header.dateRange.last28Days': 'Ultimi 28 giorni',
    'header.dateRange.lastYear': 'Ultimo anno',
    'header.dateRange.dateRange': 'Intervallo di date...',
    'header.dateRange.cancel': 'Annulla',
    'header.dateRange.ok': 'OK',
    'header.dateRange.defaultLabel': 'Ultimi 28 giorni',
    'header.dateRange.title': 'Intervallo di date',
    'header.dateRange.startDate': 'Data di inizio',
    'header.dateRange.endDate': 'Data di fine',
    'activeUsers.title': 'Utenti attivi',
    'activeUsers.averagePrefix': 'Il numero medio di utenti attivi al picco è stato',
    'activeUsers.averageText': '{{count}} per {{period}}',
    'activeUsers.day': 'giorno',
    'activeUsers.week': 'settimana',
    'activeUsers.month': 'mese',
    'activeUsers.legend.newUsers': 'Nuovi utenti',
    'activeUsers.legend.returningUsers': 'Utenti di ritorno',
    'templates.title': 'I migliori modelli',
    'templates.topNTitle': 'I migliori {{count}} modelli',
    'templates.allTitle': 'Tutti i modelli',
    'catalogEntities.title': 'Le migliori entità del catalogo',
    'catalogEntities.topNTitle': 'Le migliori {{count}} entità del catalogo',
    'catalogEntities.allTitle': 'Tutte le entità del catalogo',
    'plugins.title': 'I migliori plugin',
    'plugins.topNTitle': 'I migliori {{count}} plugin',
    'plugins.allTitle': 'Tutti i plugin',
    'techDocs.title': 'I migliori TechDocs',
    'techDocs.topNTitle': 'I migliori {{count}} TechDocs',
    'techDocs.allTitle': 'Tutti i TechDocs',
    'searches.title': 'Le migliori ricerche',
    'searches.totalCount': '{{count}} ricerche',
    'searches.averagePrefix': 'Il numero medio di ricerche è stato',
    'searches.averageText': '{{count}} per {{period}}',
    'searches.day': 'giorno',
    'searches.week': 'settimana',
    'searches.month': 'mese',
    'users.title': 'Numero totale di utenti',
    'users.haveLoggedIn': 'che hanno effettuato l\'accesso',
    'users.loggedInUsers': 'Utenti loggati',
    'users.licensed': 'Con licenza',
    'users.licensedNotLoggedIn': 'Con licenza (non loggati)',
    'users.ofTotal': 'di {{totale}}',
    'table.headers.name': 'Nome',
    'table.headers.kind': 'Tipo',
    'table.headers.lastUsed': 'Ultimo utilizzo',
    'table.headers.views': 'Visualizzazioni',
    'table.headers.executions': 'Esecuzioni',
    'table.headers.trend': 'Trend',
    'table.headers.entity': 'Entità',
    'table.pagination.topN': 'Migliori {{count}}',
    'common.noResults': 'Nessun risultato per questo intervallo di date.',
    'common.readMore': 'Leggi altri contenuti',
    'common.exportCSV': 'Esporta CSV',
    'common.downloading': 'Download in corso...',
    'common.today': 'Oggi',
    'common.yesterday': 'Ieri',
    'common.numberOfSearches': 'Numero di ricerche',
    'common.filteredBy': 'filtrato per',
    'common.invalidDateFormat': 'Formato data non valido',
    'common.csvFilename': 'utenti_attivi',
    'permission.title': 'Autorizzazioni mancanti',
    'permission.description': 'Per visualizzare il plugin "Insights adozione", contatta il tuo amministratore per concedere le autorizzazioni adoption-insights.events.read.',
  },
});

export default adoptionInsightsTranslationIt;
