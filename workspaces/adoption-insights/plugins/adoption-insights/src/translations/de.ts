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
    'activeUsers.averagePrefix':
      'Durchschnittliche max. Anzahl aktiver Benutzer:',
    'activeUsers.averageSuffix': ' für diesen Zeitraum.',
    'activeUsers.averageText': '{{count}} pro {{period}}',
    'activeUsers.day': 'Tag',
    'activeUsers.hour': 'Stunde',
    'activeUsers.legend.newUsers': 'Neue Benutzer',
    'activeUsers.legend.returningUsers': 'Wiederkehrende Benutzer',
    'activeUsers.month': 'Monat',
    'activeUsers.title': 'Aktive Benutzer',
    'activeUsers.week': 'Woche',
    'catalogEntities.allTitle': 'Alle Katalog-Entitys',
    'catalogEntities.title': 'Häufigste Katalog-Entitys',
    'catalogEntities.topNTitle': 'Häufigste {{count}} Katalog-Entitys',
    'common.csvFilename': 'active_users',
    'common.downloading': 'Download...',
    'common.loading': 'Laden',
    'common.exportCSV': 'CSV exportieren',
    'common.filteredBy': 'gefiltert nach',
    'common.invalidDateFormat': 'Ungültiges Datumsformat',
    'common.noResults': 'Für diesen Zeitraum wurden keine Ergebnisse gefunden.',
    'common.numberOfSearches': 'Anzahl der Suchanfragen',
    'common.readMore': 'Weitere Informationen',
    'common.today': 'Heute',
    'common.yesterday': 'Gestern',
    'filter.all': 'Alle',
    'filter.selectKind': 'Art auswählen',
    'header.dateRange.cancel': 'Abbrechen',
    'header.dateRange.dateRange': 'Datumsbereich...',
    'header.dateRange.defaultLabel': 'Letzte 28 Tage',
    'header.dateRange.endDate': 'Enddatum',
    'header.dateRange.last28Days': 'Letzte 28 Tage',
    'header.dateRange.lastMonth': 'Letzten Monat',
    'header.dateRange.lastWeek': 'Letzte Woche',
    'header.dateRange.lastYear': 'Letztes Jahr',
    'header.dateRange.ok': 'OK',
    'header.dateRange.startDate': 'Startdatum',
    'header.dateRange.title': 'Datumsbereich',
    'header.dateRange.today': 'Heute',
    'header.title': 'Adoption Insights',
    'page.title': 'Adoption Insights',
    'permission.description':
      'Um das Plugin „Adoption Insights“ anzuzeigen, wenden Sie sich an den Administrator, um die Berechtigung „adoption-insights.events.read“ zu erhalten.',
    'permission.title': 'Fehlende Berechtigungen',
    'plugins.allTitle': 'Alle Plugins',
    'plugins.title': 'Häufigste Plugins',
    'plugins.topNTitle': 'Häufigste {{count}} Plugins',
    'searches.averagePrefix': 'Durchschn. Anzahl Suchanfragen:',
    'searches.averageSuffix': ' für diesen Zeitraum.',
    'searches.averageText': '{{count}} pro {{period}}',
    'searches.day': 'Tag',
    'searches.hour': 'Stunde',
    'searches.month': 'Monat',
    'searches.title': 'Häufigste-Suchanfragen',
    'searches.totalCount': '{{count}} Suchanfragen',
    'searches.week': 'Woche',
    'table.headers.entity': 'Entity',
    'table.headers.executions': 'Ausführungen',
    'table.headers.kind': 'Art',
    'table.headers.lastUsed': 'Zuletzt verwendet',
    'table.headers.name': 'Name',
    'table.headers.trend': 'Trend',
    'table.headers.views': 'Ansichten',
    'table.pagination.topN': 'Häufigste {{count}}',
    'techDocs.allTitle': 'Alle TechDocs',
    'techDocs.title': 'Häufigste TechDocs',
    'techDocs.topNTitle': 'Häufigste {{count}} TechDocs',
    'templates.allTitle': 'Alle Vorlagen',
    'templates.title': 'Häufigste Vorlagen',
    'templates.topNTitle': 'Häufigste {{count}} Vorlagen',
    'users.haveLoggedIn': 'haben sich angemeldet',
    'users.licensed': 'Lizenziert',
    'users.licensedNotLoggedIn': 'Lizenziert (nicht angemeldet)',
    'users.loggedInUsers': 'Angemeldete Benutzer',
    'users.ofTotal': 'von {{total}}',
    'users.title': 'Gesamtzahl der Benutzer',
    'users.tooltip':
      'Legen Sie die Anzahl der lizenzierten Benutzer in der Datei „app-config.yaml“ fest.',
  },
});

export default adoptionInsightsTranslationDe;
