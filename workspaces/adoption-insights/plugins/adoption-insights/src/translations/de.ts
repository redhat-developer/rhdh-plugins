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
      'Durchschnittliche max. Anzahl aktiver Benutzer:',
    'activeUsers.averageText': '{{count}} pro {{period}}',
    'activeUsers.day': 'Tag',
    'activeUsers.week': 'Woche',
    'activeUsers.month': 'Monat',
    'activeUsers.legend.newUsers': 'Neue Benutzer',
    'activeUsers.legend.returningUsers': 'Wiederkehrende Benutzer',
    'templates.title': 'Häufigste Vorlagen',
    'templates.topNTitle': 'Häufigste {{count}} Vorlagen',
    'templates.allTitle': 'Alle Vorlagen',
    'catalogEntities.title': 'Häufigste Katalog-Entitys',
    'catalogEntities.topNTitle': 'Häufigste {{count}} Katalog-Entitys',
    'catalogEntities.allTitle': 'Alle Katalog-Entitys',
    'plugins.title': 'Häufigste Plugins',
    'plugins.topNTitle': 'Häufigste {{count}} Plugins',
    'plugins.allTitle': 'Alle Plugins',
    'techDocs.title': 'Häufigste TechDocs',
    'techDocs.topNTitle': 'Häufigste {{count}} TechDocs',
    'techDocs.allTitle': 'Alle TechDocs',
    'searches.title': 'Häufigste-Suchanfragen',
    'searches.totalCount': '{{count}} Suchanfragen',
    'searches.averagePrefix': 'Durchschn. Anzahl Suchanfragen:',
    'searches.averageText': '{{count}} pro {{period}}',
    'searches.day': 'Tag',
    'searches.week': 'Woche',
    'searches.month': 'Monat',
    'users.title': 'Gesamtzahl der Benutzer',
    'users.haveLoggedIn': 'haben sich angemeldet',
    'users.loggedInUsers': 'Angemeldete Benutzer',
    'users.licensed': 'Lizenziert',
    'users.licensedNotLoggedIn': 'Lizenziert (nicht angemeldet)',
    'users.ofTotal': 'von {{total}}',
    'table.headers.name': 'Name',
    'table.headers.kind': 'Art',
    'table.headers.lastUsed': 'Zuletzt verwendet',
    'table.headers.views': 'Ansichten',
    'table.headers.executions': 'Ausführungen',
    'table.headers.trend': 'Trend',
    'table.headers.entity': 'Entity',
    'table.pagination.topN': 'Häufigste {{count}}',
    'common.noResults': 'Für diesen Zeitraum wurden keine Ergebnisse gefunden.',
    'common.readMore': 'Weitere Informationen',
    'common.exportCSV': 'CSV exportieren',
    'common.downloading': 'Download...',
    'common.today': 'Heute',
    'common.yesterday': 'Gestern',
    'common.numberOfSearches': 'Anzahl der Suchanfragen',
    'common.filteredBy': 'gefiltert nach',
    'common.invalidDateFormat': 'Ungültiges Datumsformat',
    'common.csvFilename': 'active_users',
    'permission.title': 'Fehlende Berechtigungen',
    'permission.description':
      'Um das Plugin „Adoption Insights“ anzuzeigen, wenden Sie sich an den Administrator, um die Berechtigung „adoption-insights.events.read“ zu erhalten.',
  },
});

export default adoptionInsightsTranslationDe;
