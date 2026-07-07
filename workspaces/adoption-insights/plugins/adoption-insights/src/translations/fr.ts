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
    'activeUsers.averagePrefix':
      "Le nombre moyen maximal d'utilisateurs actifs était de",
    'activeUsers.averageSuffix': ' pour cette période.',
    'activeUsers.averageText': '{{count}} par {{period}}',
    'activeUsers.day': 'derniers jours',
    'activeUsers.hour': 'heure',
    'activeUsers.legend.newUsers': 'Nouveaux utilisateurs',
    'activeUsers.legend.returningUsers': 'Utilisateurs de retour',
    'activeUsers.month': 'mois',
    'activeUsers.title': 'Utilisateurs actifs',
    'activeUsers.week': '1 semaine',
    'catalogEntities.allTitle': 'Toutes les entités du catalogue',
    'catalogEntities.title': 'Entités principales du catalogue',
    'catalogEntities.topNTitle': 'Entités de catalogue principales {{count}}',
    'common.csvFilename': 'Utilisateurs actifs',
    'common.downloading': 'Téléchargement',
    'common.exportCSV': 'Exporter au format CSV',
    'common.filteredBy': 'filtré par',
    'common.invalidDateFormat': 'Format de date invalide',
    'common.noResults': 'Aucun résultat pour cette période.',
    'common.numberOfSearches': 'Nombre de recherches',
    'common.readMore': 'En savoir plus',
    'common.today': "Aujourd'hui",
    'common.yesterday': 'Hier',
    'filter.all': 'Tous',
    'filter.selectKind': 'Sélectionnez le type',
    'header.dateRange.cancel': 'Annuler',
    'header.dateRange.dateRange': 'Période couverte',
    'header.dateRange.defaultLabel': 'Les 28 derniers jours',
    'header.dateRange.endDate': 'Date de fin',
    'header.dateRange.last28Days': 'Les 28 derniers jours',
    'header.dateRange.lastMonth': 'Mois dernier',
    'header.dateRange.lastWeek': 'La semaine dernière',
    'header.dateRange.lastYear': "L'année dernière",
    'header.dateRange.ok': 'OK',
    'header.dateRange.startDate': 'Date de début',
    'header.dateRange.title': 'Période couverte',
    'header.dateRange.today': "Aujourd'hui",
    'header.title': "Perspectives sur l'adoption",
    'page.title': "Perspectives sur l'adoption",
    'permission.description':
      "Pour consulter le plugin « Adoption Insights », contactez votre administrateur afin qu'il lui accorde les autorisations adoption-insights.events.read.",
    'permission.title': 'Autorisations manquantes',
    'plugins.allTitle': 'Tous les plugins',
    'plugins.title': 'Meilleurs plugins',
    'plugins.topNTitle': 'Meilleurs plugins {{count}}',
    'searches.averagePrefix': 'Le nombre moyen de recherches était',
    'searches.averageSuffix': ' pour cette période.',
    'searches.averageText': '{{count}} par {{period}}',
    'searches.day': 'derniers jours',
    'searches.hour': 'heure',
    'searches.month': 'mois',
    'searches.title': 'Recherches les plus populaires',
    'searches.totalCount': '{{count}} recherches',
    'searches.week': '1 semaine',
    'table.headers.entity': 'Entité',
    'table.headers.executions': 'Exécutions',
    'table.headers.estTimeSaved': 'Temps estimé économisé',
    'table.headers.kind': 'Type',
    'table.headers.lastUsed': 'Dernière utilisation',
    'table.headers.name': 'Nom',
    'table.headers.trend': "S'orienter",
    'table.headers.views': 'Vues',
    'table.pagination.topN': 'Top {{count}}',
    'techDocs.allTitle': 'Tous les documents techniques',
    'techDocs.title': 'Meilleurs documents techniques',
    'techDocs.topNTitle': 'Top {{count}} TechDocs',
    'templates.allTitle': 'Tous les modèles',
    'templates.title': 'Meilleurs modèles',
    'templates.topNTitle': 'Meilleurs modèles {{count}}',
    'users.haveLoggedIn': 'vous êtes connecté',
    'users.licensed': 'Autorisé',
    'users.licensedNotLoggedIn': 'Autorisé (non connecté)',
    'users.loggedInUsers': 'Utilisateurs connectés',
    'users.ofTotal': 'de {{total}}',
    'users.title': "Nombre total d'utilisateurs",
    'users.tooltip':
      "Définissez le nombre d'utilisateurs sous licence dans le fichier app-config.yaml.",
  },
});

export default adoptionInsightsTranslationFr;
