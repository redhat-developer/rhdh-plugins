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
 * fr translation for plugin.dynamic-home-page.
 * @public
 */
const homepageTranslationFr = createTranslationMessages({
  ref: homepageTranslationRef,
  messages: {
    'header.welcome': 'Content de vous revoir!',
    'header.welcomePersonalized': 'Bienvenue {{name}} !',
    'header.local': 'Locale',
    'homePage.empty':
      "Aucune carte de page d'accueil (points de montage) configurée ou trouvée.",
    'search.placeholder': 'Recherche',
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
    'templates.viewAll': 'Afficher tous les {{count}} modèles',
    'onboarding.greeting.goodMorning': 'Bonjour',
    'onboarding.greeting.goodAfternoon': 'Bon après-midi',
    'onboarding.greeting.goodEvening': 'Bonne soirée',
    'onboarding.guest': 'Invité',
    'onboarding.getStarted.title': 'Commencer',
    'onboarding.getStarted.description':
      'En savoir plus sur Red Hat Developer Hub.',
    'onboarding.getStarted.buttonText': 'Lire la documentation',
    'onboarding.getStarted.ariaLabel':
      "Lire la documentation (s'ouvre dans un nouvel onglet)",
    'onboarding.explore.title': 'Explorer',
    'onboarding.explore.description':
      'Explorer les composants, les API et les modèles.',
    'onboarding.explore.buttonText': 'Accéder au catalogue',
    'onboarding.explore.ariaLabel': 'Accéder au catalogue',
    'onboarding.learn.title': 'Apprendre',
    'onboarding.learn.description':
      'Explorer et développer de nouvelles compétences.',
    'onboarding.learn.buttonText': "Accéder aux parcours d'apprentissage",
    'onboarding.learn.ariaLabel': "Accéder aux parcours d'apprentissage",
    'entities.title': 'Explorer votre catalogue de logiciels',
    'entities.fetchError': 'Impossible de récupérer les données.',
    'entities.error': 'Erreur inconnue',
    'entities.description':
      'Parcourir les systèmes, les composants, les ressources et les API disponibles dans votre organisation.',
    'entities.close': 'fermer',
    'entities.empty': "Aucun catalogue de logiciels n'a encore été ajouté",
    'entities.emptyDescription':
      'Une fois les catalogues de logiciels ajoutés, cet espace présentera du contenu pertinent adapté à votre expérience.',
    'entities.register': 'Enregistrer un composant',
    'entities.viewAll': 'Afficher toutes les {{count}} entités du catalogue',
  },
});

export default homepageTranslationFr;
