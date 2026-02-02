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
import { scorecardTranslationRef } from './ref';

/**
 * fr translation for plugin.scorecard.
 * @public
 */
const scorecardTranslationFr = createTranslationMessages({
  ref: scorecardTranslationRef,
  messages: {
    'emptyState.title': "Aucune carte de score n'a encore été ajoutée",
    'emptyState.description':
      'Les tableaux de bord vous aident à surveiller l’état des composants en un coup d’œil. Pour commencer, explorez notre documentation pour obtenir des instructions de configuration.',
    'emptyState.button': 'Voir la documentation',
    'emptyState.altText': 'Pas de tableau de bord',
    'permissionRequired.title': 'Autorisations manquantes',
    'permissionRequired.description':
      "Pour afficher le plugin Scorecard, contactez votre administrateur pour lui accorder l'autorisation {{permission}}.",
    'permissionRequired.button': 'En savoir plus',
    'permissionRequired.altText': 'Autorisation requise',
    'errors.entityMissingProperties':
      "Entité manquant les propriétés requises pour la recherche dans la fiche d'évaluation",
    'errors.invalidApiResponse':
      "Format de réponse non valide de l'API de scorecard",
    'errors.fetchError':
      'Erreur lors de la récupération des tableaux de bord : {{error}}',
    'errors.metricDataUnavailable': 'Données métriques indisponibles',
    'errors.invalidThresholds': 'Seuils invalides',
    'errors.missingPermission': 'Permission manquante',
    'errors.noDataFound': 'Aucune donnée trouvée',
    'errors.authenticationError': "Erreur d'authentification",
    'errors.missingPermissionMessage':
      'Pour voir les métriques de scorecard, votre administrateur doit vous donner la permission requise.',
    'errors.userNotFoundInCatalogMessage':
      'Entité utilisateur non trouvée dans le catalogue',
    'errors.noDataFoundMessage':
      'Pour voir vos données ici, vérifiez que vos entités communiquent les valeurs liées à cet indicateur.',
    'errors.authenticationErrorMessage':
      'Veuillez vous connecter pour afficher vos données.',
    // Metric translations
    'metric.github.open_prs.title': 'GitHub ouvre des PR',
    'metric.github.open_prs.description':
      "Nombre actuel de requêtes d'extraction ouvertes pour un référentiel GitHub donné.",
    'metric.jira.open_issues.title': 'Jira ouvre des tickets bloquants',
    'metric.jira.open_issues.description':
      'Met en évidence le nombre de problèmes critiques et bloquants actuellement ouverts dans Jira.',
    'thresholds.success': 'Succès',
    'thresholds.warning': 'Attention',
    'thresholds.error': 'Erreur',
    'thresholds.noEntities': "Aucune entité dans l'état {{category}}",
    'thresholds.entities_one': '{{count}} entité',
    'thresholds.entities_other': '{{count}} entités',
  },
});

export default scorecardTranslationFr;
