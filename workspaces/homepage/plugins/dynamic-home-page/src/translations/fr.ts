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
    'entities.close': 'fermer',
    'entities.description':
      'Parcourez les systèmes, les composants, les ressources et les API disponibles dans votre organisation.',
    'entities.empty': "Aucun catalogue de logiciels n'a encore été ajouté",
    'entities.emptyDescription':
      'Une fois les catalogues de logiciels ajoutés, cet espace présentera du contenu pertinent adapté à votre expérience.',
    'entities.error': 'Erreur inconnue',
    'entities.fetchError': 'Impossible de récupérer les données.',
    'entities.register': 'Enregistrer un composant',
    'entities.title': 'Explorez votre catalogue de logiciels',
    'entities.viewAll': 'Afficher toutes les {{count}} entités du catalogue',
    'featuredDocs.learnMore': ' En savoir plus',
    'header.local': 'Locale',
    'header.welcome': 'Content de vous revoir!',
    'header.welcomePersonalized': 'Bienvenue {{name}} !',
    'homePage.empty':
      "Aucune carte de page d'accueil (points de montage) configurée ou trouvée.",
    'onboarding.explore.ariaLabel': 'Accéder au catalogue',
    'onboarding.explore.buttonText': 'Accéder au catalogue',
    'onboarding.explore.description':
      'Explorez les composants, les API et les modèles.',
    'onboarding.explore.title': 'Explorez',
    'onboarding.getStarted.ariaLabel':
      "Lire la documentation (s'ouvre dans un nouvel onglet)",
    'onboarding.getStarted.buttonText': 'Lire la documentation',
    'onboarding.getStarted.description':
      'En savoir plus sur Red Hat Developer Hub.',
    'onboarding.getStarted.title': 'Commencer',
    'onboarding.greeting.goodAfternoon': 'Bon après-midi',
    'onboarding.greeting.goodEvening': 'Bonne soirée',
    'onboarding.greeting.goodMorning': 'Bonjour',
    'onboarding.guest': 'Invité',
    'onboarding.learn.ariaLabel': "Accéder aux parcours d'apprentissage",
    'onboarding.learn.buttonText': "Accéder aux parcours d'apprentissage",
    'onboarding.learn.description':
      'Explorer et développer de nouvelles compétences.',
    'onboarding.learn.title': 'Apprendre',
    'quickAccess.error': 'Erreur inconnue',
    'quickAccess.fetchError': 'Impossible de récupérer les données.',
    'quickAccess.title': 'Accès rapide',
    'search.placeholder': 'Rechercher',
    'templates.empty': 'Aucun modèle ajouté pour le moment',
    'templates.emptyDescription':
      'Une fois les modèles ajoutés, cet espace présentera du contenu pertinent adapté à votre expérience.',
    'templates.error': 'Erreur inconnue',
    'templates.fetchError': 'Impossible de récupérer les données.',
    'templates.register': 'Enregistrer un modèle',
    'templates.title': 'Explorer les modèles',
    'templates.viewAll': 'Afficher tous les {{count}} modèles',
  },
});

export default homepageTranslationFr;
