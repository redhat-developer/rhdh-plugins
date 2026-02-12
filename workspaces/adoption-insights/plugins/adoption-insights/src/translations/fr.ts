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
 * fr translation for plugin.adoption-insights.
 * @alpha
 */
const adoptionInsightsTranslationFr = createTranslationMessages({
  ref: adoptionInsightsTranslationRef,
  messages: {
    'page.title': 'Adoption Insights',
    'header.title': 'Adoption Insights',
    'header.dateRange.today': "Aujourd'hui",
    'header.dateRange.lastWeek': 'La semaine dernière',
    'header.dateRange.lastMonth': 'Mois dernier',
    'header.dateRange.last28Days': 'Les 28 derniers jours',
    'header.dateRange.lastYear': "L'année dernière",
    'header.dateRange.dateRange': 'Plage de dates...',
    'header.dateRange.cancel': 'Annuler',
    'header.dateRange.ok': 'OK',
    'header.dateRange.defaultLabel': 'Les 28 derniers jours',
    'header.dateRange.title': 'Intervalle de temps',
    'header.dateRange.startDate': 'Date de départ',
    'header.dateRange.endDate': 'Date de fin',
    'activeUsers.title': 'Utilisateurs actifs',
    'activeUsers.averagePrefix':
      "Le nombre moyen maximal d'utilisateurs actifs était de",
    'activeUsers.averageText': '{{count}} par {{period}}',
    'activeUsers.averageSuffix': ' pour cette période.',
    'activeUsers.hour': 'heure',
    'activeUsers.day': 'jour',
    'activeUsers.week': 'semaine',
    'activeUsers.month': 'mois',
    'activeUsers.legend.newUsers': 'Nouveaux utilisateurs',
    'activeUsers.legend.returningUsers': 'Utilisateurs récurrents',
    'templates.title': 'Meilleurs modèles',
    'templates.topNTitle': 'Meilleurs {{count}} modèles',
    'templates.allTitle': 'Tous les modèles',
    'catalogEntities.title': 'Principales entités du catalogue',
    'catalogEntities.topNTitle': 'Top {{count}} entités du catalogue',
    'catalogEntities.allTitle': 'Toutes les entités du catalogue',
    'plugins.title': 'Meilleurs plugins',
    'plugins.topNTitle': 'Meilleurs {{count}} plugins',
    'plugins.allTitle': 'Tous les plugins',
    'techDocs.title': 'Top TechDocs',
    'techDocs.topNTitle': 'Meilleurs {{count}} TechDocs',
    'techDocs.allTitle': 'Tous les TechDocs',
    'searches.title': 'Recherches les plus fréquentes',
    'searches.totalCount': '{{count}} recherches',
    'searches.averagePrefix': 'Le nombre moyen de recherches était de',
    'searches.averageText': '{{count}} par {{period}}',
    'searches.averageSuffix': ' pour cette période.',
    'searches.hour': 'heure',
    'searches.day': 'jour',
    'searches.week': 'semaine',
    'searches.month': 'mois',
    'users.title': "Nombre total d'utilisateurs",
    'users.haveLoggedIn': 'se sont connectés',
    'users.loggedInUsers': 'Utilisateurs connectés',
    'users.licensed': 'Autorisé',
    'users.licensedNotLoggedIn': 'Sous licence (non connecté)',
    'users.ofTotal': 'de {{total}}',
    'users.tooltip':
      "Définissez le nombre d'utilisateurs sous licence dans le fichier app-config.yaml",
    'table.headers.name': 'Nom',
    'table.headers.kind': 'Type',
    'table.headers.lastUsed': 'Dernière utilisation',
    'table.headers.views': 'Vues',
    'table.headers.executions': 'Exécutions',
    'table.headers.trend': "S'orienter",
    'table.headers.entity': 'Entité',
    'table.pagination.topN': 'Top {{count}}',
    'filter.all': 'Tous',
    'filter.selectKind': 'Sélectionnez le type',
    'common.noResults': 'Aucun résultat pour cette plage de dates.',
    'common.readMore': 'En savoir plus',
    'common.exportCSV': 'Exporter au format CSV',
    'common.downloading': 'Téléchargement...',
    'common.today': "Aujourd'hui",
    'common.yesterday': 'Hier',
    'common.numberOfSearches': 'Nombre de recherches',
    'common.filteredBy': 'filtré par',
    'common.invalidDateFormat': 'Format de date invalide',
    'common.csvFilename': 'utilisateurs_actifs',
    'permission.title': 'Autorisations manquantes',
    'permission.description':
      'Pour afficher le plugin « Adoption Insights », contactez votre administrateur pour accorder les autorisations adoption-insights.events.read.',
  },
});

export default adoptionInsightsTranslationFr;
