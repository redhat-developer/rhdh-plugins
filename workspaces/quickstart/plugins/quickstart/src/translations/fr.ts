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
import { quickstartTranslationRef } from './ref';

const quickstartTranslationFr = createTranslationMessages({
  ref: quickstartTranslationRef,
  messages: {
    'button.closeDrawer': 'Fermer le tiroir',
    'button.openQuickstartGuide': 'Ouvrir le guide de démarrage rapide',
    'button.quickstart': 'Démarrage rapide',
    'content.emptyState.title':
      "Le contenu de démarrage rapide n'est pas disponible pour votre rôle.",
    'dev.currentState': 'État actuel du tiroir : {{state}}',
    'dev.drawerControls': 'Commandes des tiroirs',
    'dev.instructions': 'Instructions',
    'dev.pageDescription':
      'Ceci est une page de test pour le plugin Quickstart. Utilisez les boutons ci-dessous pour interagir avec le tiroir de démarrage rapide.',
    'dev.pageTitle': 'Page de test du plugin de démarrage rapide',
    'dev.stateClosed': 'Fermé',
    'dev.stateOpen': 'Ouvrir',
    'dev.step1':
      '1. Cliquez sur « Ouvrir le guide de démarrage rapide » pour ouvrir le tiroir',
    'dev.step2': '2. Parcourez les étapes de démarrage rapide',
    'dev.step3':
      '3. Testez le suivi de la progression en complétant les étapes',
    'dev.step4':
      "4. Le tiroir peut être fermé à l'aide du bouton de fermeture ou des commandes du tiroir",
    'dev.step5':
      '5. La progression est automatiquement enregistrée dans le stockage local',
    'footer.hide': 'Cacher',
    'footer.notStarted': 'Non démarré',
    'footer.progress': '{{progress}}% de progrès',
    'header.subtitle': 'Nous vous guiderons à travers quelques étapes rapides',
    'header.title': 'Commençons par vous familiariser avec Developer Hub',
    'item.collapseAriaLabel': 'Réduire les détails de {{title}}',
    'item.collapseButtonAriaLabel': "Réduire l'élément",
    'item.expandAriaLabel': 'Développer les détails de {{title}}',
    'item.expandButtonAriaLabel': "Développer l'élément",
  },
});

export default quickstartTranslationFr;
