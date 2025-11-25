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
 * Italian translation for Adoption Insights.
 * @public
 */
const adoptionInsightsTranslationIt = createTranslationMessages({
  ref: adoptionInsightsTranslationRef,
  messages: {
    'page.title': 'Adoption Insights',
    'header.title': 'Adoption Insights',
    'header.dateRange.today': 'Oggi',
    'header.dateRange.lastWeek': 'Settimana scorsa',
    'header.dateRange.lastMonth': 'Mese scorso',
    'header.dateRange.last28Days': 'Ultimi 28 giorni',
    'header.dateRange.lastYear': 'Anno scorso',
    'header.dateRange.dateRange': 'Intervallo di date...',
    'header.dateRange.cancel': 'Annulla',
    'header.dateRange.ok': 'OK',
    'header.dateRange.defaultLabel': 'Ultimi 28 giorni',
    'header.dateRange.title': 'Intervallo di date',
    'header.dateRange.startDate': 'Data di inizio',
    'header.dateRange.endDate': 'Data di fine',
    'activeUsers.title': 'Utenti Attivi',
    'activeUsers.averagePrefix':
      'Il numero medio di utenti attivi di picco era',
    'activeUsers.averageText': '{{count}} per {{period}}',
    'activeUsers.averageSuffix': ' per questo periodo.',
    'activeUsers.hour': 'ora',
    'activeUsers.day': 'giorno',
    'activeUsers.week': 'settimana',
    'activeUsers.month': 'mese',
    'activeUsers.legend.newUsers': 'Nuovi utenti',
    'activeUsers.legend.returningUsers': 'Utenti di ritorno',
    'templates.title': 'Top template',
    'templates.topNTitle': 'Top {{count}} template',
    'templates.allTitle': 'Tutti i template',
    'catalogEntities.title': 'Top entità del catalogo',
    'catalogEntities.topNTitle': 'Top {{count}} entità del catalogo',
    'catalogEntities.allTitle': 'Tutte le entità del catalogo',
    'plugins.title': 'Top plugin',
    'plugins.topNTitle': 'Top {{count}} plugin',
    'plugins.allTitle': 'Tutti i plugin',
    'techDocs.title': 'Top TechDocs',
    'techDocs.topNTitle': 'Top {{count}} TechDocs',
    'techDocs.allTitle': 'Tutti i TechDocs',
    'searches.title': 'Top ricerche',
    'searches.totalCount': '{{count}} ricerche',
    'searches.averagePrefix': 'Il numero medio di ricerche era',
    'searches.averageText': '{{count}} per {{period}}',
    'searches.averageSuffix': ' per questo periodo.',
    'searches.hour': 'ora',
    'searches.day': 'giorno',
    'searches.week': 'settimana',
    'searches.month': 'mese',
    'users.title': 'Numero totale di utenti',
    'users.haveLoggedIn': 'hanno effettuato il login',
    'users.loggedInUsers': 'Utenti connessi',
    'users.licensed': 'Con licenza',
    'users.licensedNotLoggedIn': 'Con licenza (non connessi)',
    'users.ofTotal': 'su {{total}}',
    'users.tooltip':
      'Imposta il numero di utenti con licenza nel file app-config.yaml',
    'table.headers.name': 'Nome',
    'table.headers.kind': 'Tipo',
    'table.headers.lastUsed': 'Ultimo utilizzo',
    'table.headers.views': 'Visualizzazioni',
    'table.headers.executions': 'Esecuzioni',
    'table.headers.trend': 'Tendenza',
    'table.headers.entity': 'Entità',
    'table.pagination.topN': 'Top {{count}}',
    'filter.all': 'Tutti',
    'filter.selectKind': 'Seleziona tipo',
    'common.noResults': 'Nessun risultato per questo intervallo di date.',
    'common.readMore': 'Leggi di più',
    'common.exportCSV': 'Esporta CSV',
    'common.downloading': 'Download in corso...',
    'common.today': 'Oggi',
    'common.yesterday': 'Ieri',
    'common.numberOfSearches': 'Numero di ricerche',
    'common.filteredBy': 'filtrato per',
    'common.invalidDateFormat': 'Formato data non valido',
    'common.csvFilename': 'utenti_attivi',
    'permission.title': 'Permessi mancanti',
    'permission.description':
      'Per visualizzare il plugin "Adoption Insights", contatta il tuo amministratore per ottenere i permessi adoption-insights.events.read.',
  },
});

export default adoptionInsightsTranslationIt;
