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
    'activeUsers.averagePrefix':
      "Le nombre moyen maximal d'utilisateurs actifs était de",
    'activeUsers.averageSuffix': ' pour cette période.',
    'activeUsers.averageText': '{{count}} par {{period}}',
    'activeUsers.day': 'jour',
    'activeUsers.hour': 'heure',
    'activeUsers.legend.newUsers': 'Nouveaux utilisateurs',
    'activeUsers.legend.returningUsers': 'Utilisateurs récurrents',
    'activeUsers.month': 'mois',
    'activeUsers.title': 'Utilisateurs actifs',
    'activeUsers.week': 'semaine',
    'catalogEntities.allTitle': 'Toutes les entités du catalogue',
    'catalogEntities.title': 'Principales entités du catalogue',
    'catalogEntities.topNTitle': 'Top {{count}} entités du catalogue',
    'common.csvFilename': 'utilisateurs_actifs',
    'common.downloading': 'Téléchargement...',
    'common.exportCSV': 'Exporter au format CSV',
    'common.filteredBy': 'filtré par',
    'common.invalidDateFormat': 'Format de date invalide',
    'common.noResults': 'Aucun résultat pour cette plage de dates.',
    'common.numberOfSearches': 'Nombre de recherches',
    'common.readMore': 'En savoir plus',
    'common.today': "Aujourd'hui",
    'common.yesterday': 'Hier',
    'filter.all': 'Tous',
    'filter.selectKind': 'Sélectionnez le type',
    'header.dateRange.cancel': 'Annuler',
    'header.dateRange.dateRange': 'Plage de dates...',
    'header.dateRange.defaultLabel': 'Les 28 derniers jours',
    'header.dateRange.last28Days': 'Les 28 derniers jours',
    'header.dateRange.lastMonth': 'Mois dernier',
    'header.dateRange.lastWeek': 'La semaine dernière',
    'header.dateRange.lastYear': "L'année dernière",
    'header.dateRange.ok': 'OK',
    'header.dateRange.today': "Aujourd'hui",
    'header.title': 'Adoption Insights',
    'page.title': 'Adoption Insights',
    'permission.description':
      'Pour afficher le plugin « Adoption Insights », contactez votre administrateur pour accorder les autorisations adoption-insights.events.read.',
    'permission.title': 'Autorisations manquantes',
    'plugins.allTitle': 'Tous les plugins',
    'plugins.title': 'Meilleurs plugins',
    'plugins.topNTitle': 'Meilleurs {{count}} plugins',
    'searches.averagePrefix': 'Le nombre moyen de recherches était de',
    'searches.averageSuffix': ' pour cette période.',
    'searches.averageText': '{{count}} par {{period}}',
    'searches.day': 'jour',
    'searches.hour': 'heure',
    'searches.month': 'mois',
    'searches.title': 'Recherches les plus fréquentes',
    'searches.totalCount': '{{count}} recherches',
    'searches.week': 'semaine',
    'table.headers.entity': 'Entité',
    'table.headers.executions': 'Exécutions',
    'table.headers.kind': 'Gentil',
    'table.headers.lastUsed': 'Dernière utilisation',
    'table.headers.name': 'Nom',
    'table.headers.trend': "S'orienter",
    'table.headers.views': 'Vues',
    'table.pagination.topN': 'Meilleurs {{count}}',
    'techDocs.allTitle': 'Tous les TechDocs',
    'techDocs.title': 'Top TechDocs',
    'techDocs.topNTitle': 'Meilleurs {{count}} TechDocs',
    'templates.allTitle': 'Tous les modèles',
    'templates.title': 'Meilleurs modèles',
    'templates.topNTitle': 'Meilleurs {{count}} modèles',
    'users.haveLoggedIn': 'se sont connectés',
    'users.licensed': 'Autorisé',
    'users.licensedNotLoggedIn': 'Sous licence (non connecté)',
    'users.loggedInUsers': 'Utilisateurs connectés',
    'users.ofTotal': 'de {{total}}',
    'users.title': "Nombre total d'utilisateurs",
    'users.tooltip':
      "Définissez le nombre d'utilisateurs sous licence dans le fichier app-config.yaml",
  },
});

export default adoptionInsightsTranslationFr;
