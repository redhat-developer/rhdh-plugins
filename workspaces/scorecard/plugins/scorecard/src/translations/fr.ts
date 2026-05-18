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
    'emptyState.title': 'Aucune fiche de score ajoutée pour le moment',
    'emptyState.description':
      "Les tableaux de bord vous permettent de surveiller l'état des composants en un coup d'œil. Pour commencer, consultez notre documentation pour obtenir des instructions d'installation.",
    'emptyState.altText': 'Pas de tableaux de score',
    'notFound.title': "Nous n'avons pas pu trouver cette page.",
    'notFound.description':
      "Essayez d'ajouter un fichier {{indexFile}} à la racine du répertoire docs de ce référentiel.",
    'notFound.goBack': 'Retour',
    'notFound.contactSupport': "Contactez l'assistance",
    'notFound.altText': 'Page introuvable',
    'permissionRequired.title': 'Autorisation manquante',
    'permissionRequired.description':
      "Pour afficher le plugin Scorecard, contactez votre administrateur pour lui accorder l'autorisation {{permission}}.",
    'permissionRequired.altText': 'Autorisation requise',
    'common.loading': 'Chargement',
    'errors.entityMissingProperties':
      'Entité ne possédant pas les propriétés requises pour la recherche dans le tableau de bord.',
    'errors.missingAggregationId':
      "Tableau de bord mal configuré, l'identifiant d'agrégation (ou l'identifiant de la métrique) n'est pas fourni.",
    'errors.invalidApiResponse':
      "Format de réponse invalide de l'API de scorecard",
    'errors.fetchError':
      'Erreur lors de la récupération des fiches de score : {{error}}',
    'errors.invalidThresholds': 'Seuils invalides',
    'errors.missingPermission': 'Autorisation manquante',
    'errors.noDataFound': 'Aucune donnée trouvée',
    'errors.authenticationError': 'Erreur d’authentification',
    'errors.missingPermissionMessage':
      "Pour consulter les indicateurs du tableau de bord, votre administrateur doit vous accorder l'autorisation requise.",
    'thresholds.success': 'Succès',
    'thresholds.warning': 'Avertissement',
    'thresholds.error': 'Erreur',
    'thresholds.exist': 'Exister',
    'thresholds.missing': 'Manquant',
    'thresholds.noEntities': "Aucune entité dans l'état {{category}}",
    'thresholds.entities_one': 'entité {{count}}',
    'thresholds.entities_other': '{{count}} entités',
    'entitiesPage.unknownMetric': 'Métrique inconnue',
    'entitiesPage.noDataFound':
      'Pour que vos données apparaissent ici, vérifiez que vos entités communiquent bien des valeurs relatives à cette métrique.',
  },
});

export default scorecardTranslationFr;
