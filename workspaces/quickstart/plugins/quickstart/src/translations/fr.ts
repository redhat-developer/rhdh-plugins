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

    // New keys https://github.com/redhat-developer/rhdh-plugins/pull/1514
    'button.gotIt': 'Compris !',
    'steps.setupAuthentication.title': "Configurer l'authentification",
    'steps.setupAuthentication.description':
      "Configurez des identifiants de connexion sécurisés pour protéger votre compte contre l'accès non autorisé.",
    'steps.setupAuthentication.ctaTitle': 'En savoir plus',
    'steps.configureRbac.title': 'Configurer RBAC',
    'steps.configureRbac.description':
      'Attribuez des rôles et des permissions pour contrôler qui peut voir, créer ou modifier des ressources, assurant une collaboration sécurisée et efficace.',
    'steps.configureRbac.ctaTitle': "Gérer l'accès",
    'steps.configureGit.title': 'Configurer Git',
    'steps.configureGit.description':
      'Connectez vos fournisseurs Git, comme GitHub, pour gérer le code, automatiser les flux de travail et intégrer avec les fonctionnalités de la plateforme.',
    'steps.configureGit.ctaTitle': 'En savoir plus',
    'steps.managePlugins.title': 'Gérer les plugins',
    'steps.managePlugins.description':
      'Parcourez et installez des extensions pour ajouter des fonctionnalités, connecter avec des outils externes et personnaliser votre expérience.',
    'steps.managePlugins.ctaTitle': 'Explorer les plugins',
    'steps.importApplication.title': 'Importer une application',
    'steps.importApplication.description':
      'Importez votre code et vos services existants dans le catalogue pour les organiser et y accéder via votre portail développeur.',
    'steps.importApplication.ctaTitle': 'Importer',
    'steps.learnAboutCatalog.title': 'Apprendre le Catalogue',
    'steps.learnAboutCatalog.description':
      'Découvrez tous les composants logiciels, services et API, et consultez leurs propriétaires et leur documentation.',
    'steps.learnAboutCatalog.ctaTitle': 'Voir le catalogue',
    'steps.exploreSelfServiceTemplates.title':
      'Explorer les modèles en libre-service',
    'steps.exploreSelfServiceTemplates.description':
      'Utilisez nos modèles en libre-service pour configurer rapidement de nouveaux projets, services ou documentation.',
    'steps.exploreSelfServiceTemplates.ctaTitle': 'Explorer les modèles',
    'steps.findAllLearningPaths.title':
      "Trouver tous les parcours d'apprentissage",
    'steps.findAllLearningPaths.description':
      "Intégrez l'e-learning sur mesure dans vos flux de travail avec des parcours d'apprentissage pour accélérer l'intégration, combler les lacunes de compétences et promouvoir les meilleures pratiques.",
    'steps.findAllLearningPaths.ctaTitle': "Voir les parcours d'apprentissage",
  },
});

export default quickstartTranslationFr;
