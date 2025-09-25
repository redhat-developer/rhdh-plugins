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
    'header.title': 'Commençons avec le Hub Développeur',
    'header.subtitle': 'Nous vous guiderons à travers quelques étapes rapides',
    'button.quickstart': 'Démarrage rapide',
    'footer.progress': '{{progress}}% de progression',
    'footer.notStarted': 'Pas encore commencé',
    'footer.hide': 'Masquer',
    'content.emptyState.title':
      "Le contenu de démarrage rapide n'est pas disponible pour votre rôle.",
    'item.expandAriaLabel': 'Développer les détails de {{title}}',
    'item.collapseAriaLabel': 'Réduire les détails de {{title}}',
    'item.expandButtonAriaLabel': "Développer l'élément",
    'item.collapseButtonAriaLabel': "Réduire l'élément",
    'button.openQuickstartGuide': 'Ouvrir le guide de démarrage rapide',
    'button.closeDrawer': 'Fermer le tiroir',
    'dev.pageTitle': 'Page de test du plugin Quickstart',
    'dev.pageDescription':
      'Ceci est une page de test pour le plugin Quickstart. Utilisez les boutons ci-dessous pour interagir avec le tiroir de démarrage rapide.',
    'dev.drawerControls': 'Contrôles du tiroir',
    'dev.currentState': 'État actuel du tiroir : {{state}}',
    'dev.stateOpen': 'Ouvert',
    'dev.stateClosed': 'Fermé',
    'dev.instructions': 'Instructions',
    'dev.step1':
      '1. Cliquez sur "Ouvrir le guide de démarrage rapide" pour ouvrir le tiroir',
    'dev.step2': '2. Naviguez à travers les étapes de démarrage rapide',
    'dev.step3': '3. Testez le suivi de progression en complétant les étapes',
    'dev.step4':
      '4. Le tiroir peut être fermé en utilisant le bouton de fermeture ou les contrôles propres du tiroir',
    'dev.step5':
      '5. La progression est automatiquement sauvegardée dans localStorage',
  },
});

export default quickstartTranslationFr;
