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
import { homepageTranslationRef } from './ref';

/**
 * French translation for Homepage.
 * @public
 */
const homepageTranslationFr = createTranslationMessages({
  ref: homepageTranslationRef,
  messages: {
    'header.welcome': 'Bon retour !',
    'header.welcomePersonalized': 'Bon retour, {{name}} !',
    'header.local': 'Local',
    'homePage.empty':
      "Aucune carte de page d'accueil (points de montage) configurée ou trouvée.",
    'search.placeholder': 'Rechercher',
    'quickAccess.title': 'Accès rapide',
    'quickAccess.fetchError': 'Impossible de récupérer les données.',
    'quickAccess.error': 'Erreur inconnue',
    'featuredDocs.learnMore': ' En savoir plus',
    'templates.title': 'Explorer les modèles',
    'templates.fetchError': 'Impossible de récupérer les données.',
    'templates.error': 'Erreur inconnue',
    'templates.empty': 'Aucun modèle ajouté pour le moment',
    'templates.emptyDescription':
      'Une fois les modèles ajoutés, cet espace présentera du contenu pertinent adapté à votre expérience.',
    'templates.register': 'Enregistrer un modèle',
    'templates.viewAll': 'Voir tous les {{count}} modèles',
    'onboarding.greeting.goodMorning': 'Bonjour',
    'onboarding.greeting.goodAfternoon': 'Bon après-midi',
    'onboarding.greeting.goodEvening': 'Bonsoir',
    'onboarding.guest': 'Invité',
    'onboarding.getStarted.title': 'Commencer',
    'onboarding.getStarted.description': 'Découvrez Red Hat Developer Hub.',
    'onboarding.getStarted.buttonText': 'Lire la documentation',
    'onboarding.getStarted.ariaLabel':
      'Lire la documentation (ouvre dans un nouvel onglet)',
    'onboarding.explore.title': 'Explorer',
    'onboarding.explore.description':
      'Explorez les composants, APIs et modèles.',
    'onboarding.explore.buttonText': 'Aller au catalogue',
    'onboarding.explore.ariaLabel': 'Aller au catalogue',
    'onboarding.learn.title': 'Apprendre',
    'onboarding.learn.description':
      'Explorez et développez de nouvelles compétences.',
    'onboarding.learn.buttonText': "Aller aux parcours d'apprentissage",
    'onboarding.learn.ariaLabel': "Aller aux parcours d'apprentissage",
    'entities.title': 'Explorez votre catalogue logiciel',
    'entities.fetchError': 'Impossible de récupérer les données.',
    'entities.error': 'Erreur inconnue',
    'entities.description':
      'Parcourez les systèmes, composants, ressources et APIs disponibles dans votre organisation.',
    'entities.close': 'fermer',
    'entities.empty': 'Aucun catalogue logiciel ajouté pour le moment',
    'entities.emptyDescription':
      'Une fois les catalogues logiciels ajoutés, cet espace présentera du contenu pertinent adapté à votre expérience.',
    'entities.register': 'Enregistrer un composant',
    'entities.viewAll': 'Voir toutes les {{count}} entités du catalogue',
  },
});

export default homepageTranslationFr;
