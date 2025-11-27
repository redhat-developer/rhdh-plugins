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
 * German translation for Adoption Insights.
 * @public
 */
const adoptionInsightsTranslationDe = createTranslationMessages({
  ref: adoptionInsightsTranslationRef,
  messages: {
    'page.title': 'Adoption Insights',
    'header.title': 'Adoption Insights',
    'header.dateRange.today': 'Heute',
    'header.dateRange.lastWeek': 'Letzte Woche',
    'header.dateRange.lastMonth': 'Letzter Monat',
    'header.dateRange.last28Days': 'Letzte 28 Tage',
    'header.dateRange.lastYear': 'Letztes Jahr',
    'header.dateRange.dateRange': 'Datumsbereich...',
    'header.dateRange.cancel': 'Abbrechen',
    'header.dateRange.ok': 'OK',
    'header.dateRange.defaultLabel': 'Letzte 28 Tage',
    'header.dateRange.title': 'Datumsbereich',
    'header.dateRange.startDate': 'Startdatum',
    'header.dateRange.endDate': 'Enddatum',
    'activeUsers.title': 'Aktive Benutzer',
    'activeUsers.averagePrefix':
      'Durchschnittliche Spitzenanzahl aktiver Benutzer war',
    'activeUsers.averageText': '{{count}} pro {{period}}',
    'activeUsers.averageSuffix': ' für diesen Zeitraum.',
    'activeUsers.hour': 'Stunde',
    'activeUsers.day': 'Tag',
    'activeUsers.week': 'Woche',
    'activeUsers.month': 'Monat',
    'activeUsers.legend.newUsers': 'Neue Benutzer',
    'activeUsers.legend.returningUsers': 'Wiederkehrende Benutzer',
    'templates.title': 'Top-Vorlagen',
    'templates.topNTitle': 'Top-{{count}} Vorlagen',
    'templates.allTitle': 'Alle Vorlagen',
    'catalogEntities.title': 'Top-Katalogentitäten',
    'catalogEntities.topNTitle': 'Top-{{count}} Katalogentitäten',
    'catalogEntities.allTitle': 'Alle Katalogentitäten',
    'plugins.title': 'Top-Plugins',
    'plugins.topNTitle': 'Top-{{count}} Plugins',
    'plugins.allTitle': 'Alle Plugins',
    'techDocs.title': 'Top-TechDocs',
    'techDocs.topNTitle': 'Top-{{count}} TechDocs',
    'techDocs.allTitle': 'Alle TechDocs',
    'searches.title': 'Top-Suchen',
    'searches.totalCount': '{{count}} Suchen',
    'searches.averagePrefix': 'Durchschnittliche Suchanzahl war',
    'searches.averageText': '{{count}} pro {{period}}',
    'searches.averageSuffix': ' für diesen Zeitraum.',
    'searches.hour': 'Stunde',
    'searches.day': 'Tag',
    'searches.week': 'Woche',
    'searches.month': 'Monat',
    'users.title': 'Gesamtzahl der Benutzer',
    'users.haveLoggedIn': 'haben sich angemeldet',
    'users.loggedInUsers': 'Angemeldete Benutzer',
    'users.licensed': 'Lizenziert',
    'users.licensedNotLoggedIn': 'Lizenziert (nicht angemeldet)',
    'users.ofTotal': 'von {{total}}',
    'users.tooltip':
      'Legen Sie die Anzahl der lizenzierten Benutzer in der app-config.yaml fest',
    'table.headers.name': 'Name',
    'table.headers.kind': 'Art',
    'table.headers.lastUsed': 'Zuletzt verwendet',
    'table.headers.views': 'Aufrufe',
    'table.headers.executions': 'Ausführungen',
    'table.headers.trend': 'Trend',
    'table.headers.entity': 'Entität',
    'table.pagination.topN': 'Top {{count}}',
    'filter.all': 'Alle',
    'filter.selectKind': 'Art auswählen',
    'common.noResults': 'Keine Ergebnisse für diesen Datumsbereich.',
    'common.readMore': 'Mehr lesen',
    'common.exportCSV': 'CSV exportieren',
    'common.downloading': 'Herunterladen...',
    'common.today': 'Heute',
    'common.yesterday': 'Gestern',
    'common.numberOfSearches': 'Anzahl der Suchen',
    'common.filteredBy': 'gefiltert nach',
    'common.invalidDateFormat': 'Ungültiges Datumsformat',
    'common.csvFilename': 'aktive_benutzer',
    'permission.title': 'Fehlende Berechtigungen',
    'permission.description':
      'Um das „Adoption Insights" Plugin anzuzeigen, wenden Sie sich an Ihren Administrator, um die adoption-insights.events.read Berechtigungen zu erhalten.',
  },
});

export default adoptionInsightsTranslationDe;
