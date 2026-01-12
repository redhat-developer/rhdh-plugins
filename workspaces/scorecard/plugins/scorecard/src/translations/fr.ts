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

const scorecardTranslationFr = createTranslationMessages({
  ref: scorecardTranslationRef,
  full: true,
  messages: {
    // Empty state
    'emptyState.title': 'Aucune scorecard ajoutée pour le moment',
    'emptyState.description':
      "Les scorecards vous aident à surveiller la santé des composants en un coup d'œil. Pour commencer, explorez notre documentation pour les directives de configuration.",
    'emptyState.button': 'Voir la documentation',
    'emptyState.altText': 'Aucune scorecard',

    // Permission required state
    'permissionRequired.title': 'Permission manquante',
    'permissionRequired.description':
      'Pour voir le plugin Scorecard, contactez votre administrateur pour donner la {{permission}} permission.',
    'permissionRequired.button': 'Lire plus',
    'permissionRequired.altText': 'Permission requise',

    // Error messages
    'errors.entityMissingProperties':
      'Entité manque de propriétés requises pour la recherche de scorecard',
    'errors.invalidApiResponse':
      "Format de réponse invalide de l'API scorecard",
    'errors.fetchError':
      'Erreur lors de la récupération des scorecards : {{error}}',
    'errors.metricDataUnavailable': 'Données de métrique indisponibles',
    'errors.invalidThresholds': 'Seuils invalides',

    // Metric translations
    'metric.github.open_prs.title': 'GitHub PRs ouvertes',
    'metric.github.open_prs.description':
      'Nombre actuel de Pull Requests ouvertes pour un dépôt GitHub donné.',
    'metric.jira.open_issues.title': 'Jira tickets bloquants ouverts',
    'metric.jira.open_issues.description':
      'Met en évidence le nombre de problèmes critiques et bloquants actuellement ouverts dans Jira.',

    // Threshold translations
    'thresholds.success': 'Succès',
    'thresholds.warning': 'Avertissement',
    'thresholds.error': 'Erreur',
  },
});

export default scorecardTranslationFr;
