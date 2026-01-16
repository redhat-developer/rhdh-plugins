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

/**
 * fr translation for plugin.quickstart.
 * @public
 */
const quickstartTranslationFr = createTranslationMessages({
  ref: quickstartTranslationRef,
  messages: {
    'header.title': 'Commençons par vous familiariser avec Developer Hub',
    'header.subtitle': 'Nous vous guiderons à travers quelques étapes rapides',
    'steps.setupAuthentication.title': "Configurer l'authentification",
    'steps.setupAuthentication.description':
      'Configurez des informations de connexion sécurisées pour protéger votre compte contre tout accès non autorisé.',
    'steps.setupAuthentication.ctaTitle': 'En savoir plus',
    'steps.configureRbac.title': 'Configurer RBAC',
    'steps.configureRbac.description':
      'Attribuez des rôles et des autorisations pour contrôler qui peut afficher, créer ou modifier des ressources, garantissant ainsi une collaboration sécurisée et efficace.',
    'steps.configureRbac.ctaTitle': "Gérer l'accès",
    'steps.configureGit.title': 'Configurer Git',
    'steps.configureGit.description':
      'Connectez vos fournisseurs Git, tels que GitHub pour gérer le code, automatiser les flux de travail et intégrer les fonctionnalités de la plateforme.',
    'steps.configureGit.ctaTitle': 'En savoir plus',
    'steps.managePlugins.title': 'Gérer les plugins',
    'steps.managePlugins.description':
      'Parcourez et installez des extensions pour ajouter des fonctionnalités, vous connecter à des outils externes et personnaliser votre expérience.',
    'steps.managePlugins.ctaTitle': 'Explorer les plugins',
    'steps.importApplication.title': "Demande d'importation",
    'steps.importApplication.description':
      'Importez votre code et vos services existants dans le catalogue pour les organiser et y accéder via votre portail de développeur.',
    'steps.importApplication.ctaTitle': 'Importer',
    'steps.learnAboutCatalog.title': 'En savoir plus sur le catalogue',
    'steps.learnAboutCatalog.description':
      'Découvrir tous les composants logiciels, services et API, et affichez leurs propriétaires et leur documentation.',
    'steps.learnAboutCatalog.ctaTitle': 'Voir le catalogue',
    'steps.exploreSelfServiceTemplates.title':
      'Explorer les modèles en libre-service',
    'steps.exploreSelfServiceTemplates.description':
      'Utiliser nos modèles en libre-service pour configurer rapidement de nouveaux projets, services ou documentations.',
    'steps.exploreSelfServiceTemplates.ctaTitle': 'Explorer les modèles',
    'steps.findAllLearningPaths.title': 'Trouver tous les Learning Paths',
    'steps.findAllLearningPaths.description':
      'Intégrez l’apprentissage en ligne personnalisé dans vos flux de travail avec Learning Paths pour accélérer l’intégration, combler les lacunes en matière de compétences et promouvoir les meilleures pratiques.',
    'steps.findAllLearningPaths.ctaTitle': 'Voir Learning Paths',
    'button.quickstart': 'Démarrage rapide',
    'button.openQuickstartGuide': 'Ouvrir le guide de démarrage rapide',
    'button.closeDrawer': 'Fermer le tiroir',
    'button.gotIt': "J'ai compris!",
    'footer.progress': '{{progress}}% de progrès',
    'footer.notStarted': 'Non démarré',
    'footer.hide': 'Cacher',
    'content.emptyState.title':
      "Le contenu de démarrage rapide n'est pas disponible pour votre rôle.",
    'item.expandAriaLabel': 'Développer les détails de {{title}}',
    'item.collapseAriaLabel': 'Réduire les détails de {{title}}',
    'item.expandButtonAriaLabel': "Développer l'élément",
    'item.collapseButtonAriaLabel': "Réduire l'élément",
    'dev.pageTitle': 'Page de test du plugin de démarrage rapide',
    'dev.pageDescription':
      'Ceci est une page de test pour le plugin Quickstart. Utilisez les boutons ci-dessous pour interagir avec le tiroir de démarrage rapide.',
    'dev.drawerControls': 'Commandes des tiroirs',
    'dev.currentState': 'État actuel du tiroir : {{state}}',
    'dev.stateOpen': 'Ouvrir',
    'dev.stateClosed': 'Fermé',
    'dev.instructions': 'Instructions',
    'dev.step1':
      '1. Cliquez sur « Ouvrir le guide de démarrage rapide » pour ouvrir le tiroir',
    'dev.step2': '2. Parcourez les étapes de démarrage rapide',
    'dev.step3':
      '3. Testez le suivi de la progression en complétant les étapes',
    'dev.step4':
      "4. Le tiroir peut être fermé à l'aide du bouton de fermeture ou des commandes du tiroir",
    'dev.step5':
      '5. La progression est automatiquement enregistrée dans le stockage local',
  },
});

export default quickstartTranslationFr;
