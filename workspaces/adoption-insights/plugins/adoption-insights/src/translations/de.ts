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
 * de translation for plugin.adoption-insights.
 * @public
 */
const adoptionInsightsTranslationDe = createTranslationMessages({
  ref: adoptionInsightsTranslationRef,
  messages: {
    'page.title': 'Adoption Insights',
    'header.title': 'Adoption Insights',
    'header.dateRange.today': 'Heute',
    'header.dateRange.lastWeek': 'Letzte Woche',
    'header.dateRange.lastMonth': 'Letzten Monat',
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
      'Die durchschnittliche maximale Anzahl aktiver Benutzer betrug',
    'activeUsers.averageText': '{{count}} pro {{period}}',
    'activeUsers.averageSuffix': ' für diesen Zeitraum.',
    'activeUsers.hour': 'Stunde',
    'activeUsers.day': 'Tag',
    'activeUsers.week': 'Woche',
    'activeUsers.month': 'Monat',
    'activeUsers.legend.newUsers': 'Neue Benutzer',
    'activeUsers.legend.returningUsers': 'Wiederkehrende Benutzer',
    'templates.title': 'Wichtigste Templates',
    'templates.topNTitle': 'Wichtigste {{count}} Templates',
    'templates.allTitle': 'Alle Templates',
    'catalogEntities.title': 'Wichtigste Katalogelemente',
    'catalogEntities.topNTitle': 'Wichtigste {{count}} Katalogelemente',
    'catalogEntities.allTitle': 'Alle Katalogelemente',
    'plugins.title': 'Wichtigste Plugins',
    'plugins.topNTitle': 'Wichtigste {{count}} Plugins',
    'plugins.allTitle': 'Alle Plugins',
    'techDocs.title': 'Wichtigste TechDocs',
    'techDocs.topNTitle': 'Wichtigste {{count}} TechDocs',
    'techDocs.allTitle': 'Alle TechDocs',
    'searches.title': 'Wichtigste Suchanfragen',
    'searches.totalCount': '{{count}} Suchanfragen',
    'searches.averagePrefix':
      'Die durchschnittliche Anzahl der Suchanfragen betrug',
    'searches.averageText': '{{count}} pro {{period}}',
    'searches.averageSuffix': ' für diesen Zeitraum.',
    'searches.hour': 'Stunde',
    'searches.day': 'Tag',
    'searches.week': 'Woche',
    'searches.month': 'Monat',
    'users.title': 'Gesamtzahl Benutzer',
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
    'table.headers.views': 'Ansichten',
    'table.headers.executions': 'Ausführungen',
    'table.headers.trend': 'Trend',
    'table.headers.entity': 'Element',
    'table.pagination.topN': 'Wichtigste {{count}}',
    'filter.all': 'Alle',
    'filter.selectKind': 'Art auswählen',
    'common.noResults':
      'Für diesen Datumsbereich wurden keine Ergebnisse gefunden.',
    'common.readMore': 'Mehr lesen',
    'common.exportCSV': 'CSV exportieren',
    'common.downloading': 'Download läuft...',
    'common.today': 'Heute',
    'common.yesterday': 'Gestern',
    'common.numberOfSearches': 'Anzahl der Suchanfragen',
    'common.filteredBy': 'gefiltert nach',
    'common.invalidDateFormat': 'Ungültiges Datumsformat',
    'common.csvFilename': 'aktive_Benutzer',
    'permission.title': 'Fehlende Berechtigungen',
    'permission.description':
      "Wenn Sie das Plugin 'Adoption Insights' anzeigen möchten, wenden Sie sich an den Administrator, um die Berechtigung 'adoption-insights.events.read' zu erhalten.",
  },
});

export default adoptionInsightsTranslationDe;
