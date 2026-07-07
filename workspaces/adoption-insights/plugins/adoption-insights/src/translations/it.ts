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
    'activeUsers.averagePrefix':
      'Il numero medio di utenti attivi al picco è stato',
    'activeUsers.averageSuffix': ' per questo periodo.',
    'activeUsers.averageText': '{{count}} per {{period}}',
    'activeUsers.day': 'giorno',
    'activeUsers.hour': 'ora',
    'activeUsers.legend.newUsers': 'Nuovi utenti',
    'activeUsers.legend.returningUsers': 'Utenti di ritorno',
    'activeUsers.month': 'mese',
    'activeUsers.title': 'Utenti attivi',
    'activeUsers.week': 'settimana',
    'catalogEntities.allTitle': 'Tutte le entità del catalogo',
    'catalogEntities.title': 'Le migliori entità del catalogo',
    'catalogEntities.topNTitle': 'Le migliori {{count}} entità del catalogo',
    'common.csvFilename': 'utenti_attivi',
    'common.downloading': 'Download in corso...',
    'common.exportCSV': 'Esporta CSV',
    'common.filteredBy': 'filtrato per',
    'common.invalidDateFormat': 'Formato data non valido',
    'common.noResults': 'Nessun risultato per questo intervallo di date.',
    'common.numberOfSearches': 'Numero di ricerche',
    'common.readMore': 'Leggi altri contenuti',
    'common.today': 'Oggi',
    'common.yesterday': 'Ieri',
    'filter.all': 'Tutto',
    'filter.selectKind': 'Seleziona il tipo',
    'header.dateRange.cancel': 'Annulla',
    'header.dateRange.dateRange': 'Intervallo di date...',
    'header.dateRange.defaultLabel': 'Ultimi 28 giorni',
    'header.dateRange.endDate': 'Data di fine',
    'header.dateRange.last28Days': 'Ultimi 28 giorni',
    'header.dateRange.lastMonth': 'Ultimo mese',
    'header.dateRange.lastWeek': 'Ultima settimana',
    'header.dateRange.lastYear': 'Ultimo anno',
    'header.dateRange.ok': 'OK',
    'header.dateRange.startDate': 'Data di inizio',
    'header.dateRange.title': 'Intervallo di date',
    'header.dateRange.today': 'Oggi',
    'header.title': 'Insights adozione',
    'page.title': 'Insights adozione',
    'permission.description':
      'Per visualizzare il plugin "Insights adozione", contatta il tuo amministratore per concedere le autorizzazioni adoption-insights.events.read.',
    'permission.title': 'Autorizzazioni mancanti',
    'plugins.allTitle': 'Tutti i plugin',
    'plugins.title': 'I migliori plugin',
    'plugins.topNTitle': 'I migliori {{count}} plugin',
    'searches.averagePrefix': 'Il numero medio di ricerche è stato',
    'searches.averageSuffix': ' per questo periodo.',
    'searches.averageText': '{{count}} per {{period}}',
    'searches.day': 'giorno',
    'searches.hour': 'ora',
    'searches.month': 'mese',
    'searches.title': 'Le migliori ricerche',
    'searches.totalCount': '{{count}} ricerche',
    'searches.week': 'settimana',
    'table.headers.entity': 'Entità',
    'table.headers.executions': 'Esecuzioni',
    'table.headers.estTimeSaved': 'Tempo stimato risparmiato',
    'table.headers.kind': 'Tipo',
    'table.headers.lastUsed': 'Ultimo utilizzo',
    'table.headers.name': 'Nome',
    'table.headers.trend': 'Trend',
    'table.headers.views': 'Visualizzazioni',
    'table.pagination.topN': 'Migliori {{count}}',
    'techDocs.allTitle': 'Tutti i TechDocs',
    'techDocs.title': 'I migliori TechDocs',
    'techDocs.topNTitle': 'I migliori {{count}} TechDocs',
    'templates.allTitle': 'Tutti i modelli',
    'templates.title': 'I migliori modelli',
    'templates.topNTitle': 'I migliori {{count}} modelli',
    'users.haveLoggedIn': "che hanno effettuato l'accesso",
    'users.licensed': 'Con licenza',
    'users.licensedNotLoggedIn': 'Con licenza (non loggati)',
    'users.loggedInUsers': 'Utenti loggati',
    'users.ofTotal': 'di {{totale}}',
    'users.title': 'Numero totale di utenti',
    'users.tooltip':
      'Imposta il numero di utenti con licenza nel file app-config.yaml',
  },
});

export default adoptionInsightsTranslationIt;
