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
    'page.title': 'Adoption Insights',
    'header.title': 'Adoption Insights',
    'header.dateRange.today': 'Oggi',
    'header.dateRange.lastWeek': 'La settimana scorsa',
    'header.dateRange.lastMonth': 'Il mese scorso',
    'header.dateRange.last28Days': 'Ultimi 28 giorni',
    'header.dateRange.lastYear': "L'anno scorso",
    'header.dateRange.dateRange': 'Intervallo di date...',
    'header.dateRange.cancel': 'Cancella',
    'header.dateRange.ok': 'OK',
    'header.dateRange.defaultLabel': 'Ultimi 28 giorni',
    'header.dateRange.title': 'Intervallo di date',
    'header.dateRange.startDate': 'Data di inizio',
    'header.dateRange.endDate': 'Data di fine',
    'activeUsers.title': 'Utenti attivi',
    'activeUsers.averagePrefix':
      'Il conteggio del picco medio di utenti attivi era',
    'activeUsers.averageText': '{{count}} per {{period}}',
    'activeUsers.averageSuffix': ' per questo periodo.',
    'activeUsers.hour': 'ora',
    'activeUsers.day': 'giorno',
    'activeUsers.week': 'settimana',
    'activeUsers.month': 'mese',
    'activeUsers.legend.newUsers': 'Nuovi utenti',
    'activeUsers.legend.returningUsers': 'Utenti di ritorno',
    'templates.title': 'Modelli più popolari',
    'templates.topNTitle': 'I {{count}} modelli più popolari',
    'templates.allTitle': 'Tutti i modelli',
    'catalogEntities.title': 'Entità del catalogo più popolari',
    'catalogEntities.topNTitle':
      'Le {{count}} entità del catalogo più popolari',
    'catalogEntities.allTitle': 'Tutte le entità del catalogo',
    'plugins.title': 'I plugin più popolari',
    'plugins.topNTitle': 'I {{count}} plugin più popolari',
    'plugins.allTitle': 'Tutti i plugin',
    'techDocs.title': 'TechDocs più popolari',
    'techDocs.topNTitle': 'I {{count}} TechDocs più popolari',
    'techDocs.allTitle': 'Tutti i TechDocs',
    'searches.title': 'Ricerche più popolari',
    'searches.totalCount': '{{count}} ricerche',
    'searches.averagePrefix': 'Il conteggio medio delle ricerche era',
    'searches.averageText': '{{count}} per {{period}}',
    'searches.averageSuffix': ' per questo periodo.',
    'searches.hour': 'ora',
    'searches.day': 'giorno',
    'searches.week': 'settimana',
    'searches.month': 'mese',
    'users.title': 'Numero totale di utenti',
    'users.haveLoggedIn': 'registrati',
    'users.loggedInUsers': 'Utenti registrati',
    'users.licensed': 'Con licenza',
    'users.licensedNotLoggedIn': 'Con licenza (non registrato)',
    'users.ofTotal': 'di {{totale}}',
    'users.tooltip':
      'Imposta il numero di utenti con licenza in app-config.yaml',
    'table.headers.name': 'Nome',
    'table.headers.kind': 'Tipo',
    'table.headers.lastUsed': 'Ultimo utilizzo',
    'table.headers.views': 'Visualizzazioni',
    'table.headers.executions': 'Esecuzioni',
    'table.headers.trend': 'Tendenza',
    'table.headers.entity': 'Entità',
    'table.pagination.topN': '{{count}} più popolare',
    'filter.all': 'Tutto',
    'filter.selectKind': 'Selezionare il tipo',
    'common.noResults': 'Nessun risultato per questo intervallo di date.',
    'common.readMore': 'Per saperne di più',
    'common.exportCSV': 'Esporta CSV',
    'common.downloading': 'Scaricamento in corso...',
    'common.today': 'Oggi',
    'common.yesterday': 'Ieri',
    'common.numberOfSearches': 'Numero di ricerche',
    'common.filteredBy': 'filtrato da',
    'common.invalidDateFormat': 'Formato data non valido',
    'common.csvFilename': 'active_users',
    'permission.title': 'Autorizzazioni mancanti',
    'permission.description':
      'Per visualizzare il plugin "Adoption Insights", richiedere all\'amministratore le autorizzazioni adoption-insights.events.read.',
  },
});

export default adoptionInsightsTranslationIt;
