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
    'page.title': 'Perspectives sur l\'adoption',
    'header.title': 'Perspectives sur l\'adoption',
    'header.dateRange.today': 'Aujourd\'hui',
    'header.dateRange.lastWeek': 'La semaine dernière',
    'header.dateRange.lastMonth': 'Mois dernier',
    'header.dateRange.last28Days': 'Les 28 derniers jours',
    'header.dateRange.lastYear': 'L\'année dernière',
    'header.dateRange.dateRange': 'Période couverte',
    'header.dateRange.cancel': 'Annuler',
    'header.dateRange.ok': 'OK',
    'header.dateRange.defaultLabel': 'Les 28 derniers jours',
    'header.dateRange.title': 'Période couverte',
    'header.dateRange.startDate': 'Date de début',
    'header.dateRange.endDate': 'Date de fin',
    'activeUsers.title': 'Utilisateurs actifs',
    'activeUsers.averagePrefix': 'Le nombre moyen maximal d\'utilisateurs actifs était de',
    'activeUsers.averageText': '{{count}} par {{period}}',
    'activeUsers.day': 'derniers jours',
    'activeUsers.week': '1 semaine',
    'activeUsers.month': 'mois',
    'activeUsers.legend.newUsers': 'Nouveaux utilisateurs',
    'activeUsers.legend.returningUsers': 'Utilisateurs de retour',
    'templates.title': 'Meilleurs modèles',
    'templates.topNTitle': 'Meilleurs modèles {{count}}',
    'templates.allTitle': 'Tous les modèles',
    'catalogEntities.title': 'Entités principales du catalogue',
    'catalogEntities.topNTitle': 'Entités de catalogue principales {{count}}',
    'catalogEntities.allTitle': 'Toutes les entités du catalogue',
    'plugins.title': 'Meilleurs plugins',
    'plugins.topNTitle': 'Meilleurs plugins {{count}}',
    'plugins.allTitle': 'Tous les plugins',
    'techDocs.title': 'Meilleurs documents techniques',
    'techDocs.topNTitle': 'Top {{count}} TechDocs',
    'techDocs.allTitle': 'Tous les documents techniques',
    'searches.title': 'Recherches les plus populaires',
    'searches.totalCount': '{{count}} recherches',
    'searches.averagePrefix': 'Le nombre moyen de recherches était',
    'searches.averageText': '{{count}} par {{period}}',
    'searches.day': 'derniers jours',
    'searches.week': '1 semaine',
    'searches.month': 'mois',
    'users.title': 'Nombre total d\'utilisateurs',
    'users.haveLoggedIn': 'vous êtes connecté',
    'users.loggedInUsers': 'Utilisateurs connectés',
    'users.licensed': 'Autorisé',
    'users.licensedNotLoggedIn': 'Autorisé (non connecté)',
    'users.ofTotal': 'de {{total}}',
    'table.headers.name': 'Nom',
    'table.headers.kind': 'Type',
    'table.headers.lastUsed': 'Dernière utilisation',
    'table.headers.views': 'Vues',
    'table.headers.executions': 'Exécutions',
    'table.headers.trend': 'S\'orienter',
    'table.headers.entity': 'Entité',
    'table.pagination.topN': 'Top {{count}}',
    'common.noResults': 'Aucun résultat pour cette période.',
    'common.readMore': 'En savoir plus',
    'common.exportCSV': 'Exporter au format CSV',
    'common.downloading': 'Téléchargement',
    'common.today': 'Aujourd\'hui',
    'common.yesterday': 'Hier',
    'common.numberOfSearches': 'Nombre de recherches',
    'common.filteredBy': 'filtré par',
    'common.invalidDateFormat': 'Format de date invalide',
    'common.csvFilename': 'Utilisateurs actifs',
    'permission.title': 'Autorisations manquantes',
    'permission.description': 'Pour consulter le plugin « Adoption Insights », contactez votre administrateur afin qu\'il lui accorde les autorisations adoption-insights.events.read.',
  },
});

export default adoptionInsightsTranslationFr;
