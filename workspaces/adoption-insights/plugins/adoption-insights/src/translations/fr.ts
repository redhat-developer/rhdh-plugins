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
 * French translation for Adoption Insights.
 * @public
 */
const adoptionInsightsTranslationFr = createTranslationMessages({
  ref: adoptionInsightsTranslationRef,
  messages: {
    'page.title': 'Adoption Insights',
    'header.title': 'Adoption Insights',
    'header.dateRange.today': "Aujourd'hui",
    'header.dateRange.lastWeek': 'La semaine dernière',
    'header.dateRange.lastMonth': 'Le mois dernier',
    'header.dateRange.last28Days': 'Les 28 derniers jours',
    'header.dateRange.lastYear': "L'année dernière",
    'header.dateRange.dateRange': 'Plage de dates...',
    'header.dateRange.cancel': 'Annuler',
    'header.dateRange.ok': 'OK',
    'header.dateRange.defaultLabel': 'Les 28 derniers jours',
    'activeUsers.title': 'Utilisateurs Actifs',
    'activeUsers.averagePrefix':
      "Le nombre moyen d'utilisateurs actifs en pointe était",
    'activeUsers.averageText': '{{count}} par {{period}}',
    'activeUsers.averageSuffix': ' pour cette période.',
    'activeUsers.hour': 'heure',
    'activeUsers.day': 'jour',
    'activeUsers.week': 'semaine',
    'activeUsers.month': 'mois',
    'activeUsers.legend.newUsers': 'Nouveaux utilisateurs',
    'activeUsers.legend.returningUsers': 'Utilisateurs récurrents',
    'templates.title': 'Top modèles',
    'templates.topNTitle': 'Top {{count}} modèles',
    'templates.allTitle': 'Tous les modèles',
    'catalogEntities.title': 'Top entités du catalogue',
    'catalogEntities.topNTitle': 'Top {{count}} entités du catalogue',
    'catalogEntities.allTitle': 'Toutes les entités du catalogue',
    'plugins.title': 'Top plugins',
    'plugins.topNTitle': 'Top {{count}} plugins',
    'plugins.allTitle': 'Tous les plugins',
    'techDocs.title': 'Top TechDocs',
    'techDocs.topNTitle': 'Top {{count}} TechDocs',
    'techDocs.allTitle': 'Tous les TechDocs',
    'searches.title': 'Top recherches',
    'searches.totalCount': '{{count}} recherches',
    'searches.averagePrefix': 'Le nombre moyen de recherches était',
    'searches.averageText': '{{count}} par {{period}}',
    'searches.averageSuffix': ' pour cette période.',
    'searches.hour': 'heure',
    'searches.day': 'jour',
    'searches.week': 'semaine',
    'searches.month': 'mois',
    'users.title': "Nombre total d'utilisateurs",
    'users.haveLoggedIn': 'se sont connectés',
    'users.loggedInUsers': 'Utilisateurs connectés',
    'users.licensed': 'Utilisateurs sous licence',
    'users.licensedNotLoggedIn': 'Sous licence (non connectés)',
    'users.ofTotal': 'sur {{total}}',
    'users.tooltip':
      "Définissez le nombre d'utilisateurs sous licence dans le fichier de configuration app-config.yaml",
    'table.headers.name': 'Nom',
    'table.headers.kind': 'Type',
    'table.headers.lastUsed': 'Dernière utilisation',
    'table.headers.views': 'Vues',
    'table.headers.executions': 'Exécutions',
    'table.headers.trend': 'Tendance',
    'table.headers.entity': 'Entité',
    'table.pagination.topN': 'Top {{count}}',
    'filter.all': 'Tous',
    'filter.selectKind': 'Sélectionner le type',
    'common.noResults': 'Aucun résultat pour cette plage de dates.',
    'common.readMore': 'En savoir plus',
    'common.exportCSV': 'Exporter CSV',
    'common.downloading': 'Téléchargement...',
    'common.today': "Aujourd'hui",
    'common.yesterday': 'Hier',
    'common.numberOfSearches': 'Nombre de recherches',
    'common.filteredBy': 'filtré par',
    'common.invalidDateFormat': 'Format de date invalide',
    'common.csvFilename': 'utilisateurs_actifs',
    'permission.title': 'Permissions manquantes',
    'permission.description':
      'Pour voir le plugin « Adoption Insights », contactez votre administrateur pour obtenir les permissions adoption-insights.events.read.',
  },
});

export default adoptionInsightsTranslationFr;
