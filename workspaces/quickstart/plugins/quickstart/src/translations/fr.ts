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
    'button.closeDrawer': 'Fermer le tiroir',
    'button.gotIt': "J'ai compris",
    'button.openQuickstartGuide': 'Ouvrir le guide de démarrage rapide',
    'button.quickstart': 'Démarrage rapide',
    'content.emptyState.title':
      "Le contenu de démarrage rapide n'est pas disponible pour votre rôle.",
    'dev.currentState': 'État actuel du tiroir : {{state}}',
    'dev.drawerControls': 'Commandes de tiroir',
    'dev.instructions': 'Instructions',
    'dev.pageDescription':
      "Ceci est une page de test pour l'extension Quickstart. Utilisez les boutons ci-dessous pour interagir avec le tiroir de démarrage rapide.",
    'dev.pageTitle': 'Page de test du plugin Quickstart',
    'dev.stateClosed': 'Fermé',
    'dev.stateOpen': 'Ouvrir',
    'dev.step1':
      '1. Cliquez sur « Ouvrir le guide de démarrage rapide » pour ouvrir le tiroir',
    'dev.step2': '2. Suivez les étapes de démarrage rapide',
    'dev.step3': '3. Testez le suivi des progrès en complétant les étapes',
    'dev.step4':
      "4. Le tiroir peut être fermé à l'aide du bouton de fermeture ou des commandes intégrées au tiroir.",
    'dev.step5':
      '5. La progression est automatiquement enregistrée dans le stockage local.',
    'footer.hide': 'Masquer',
    'footer.notStarted': 'Non démarré',
    'footer.progress': '{{progress}}% de progression',
    'header.subtitle':
      'Nous allons vous guider à travers quelques étapes rapides.',
    'header.title': 'Commençons par le Developer Hub',
    'item.collapseAriaLabel': 'Réduire les détails de {{title}}',
    'item.collapseButtonAriaLabel': "Réduire l'élément",
    'item.expandAriaLabel': 'Développer les détails de {{title}}',
    'item.expandButtonAriaLabel': "Développer l'élément",
    'snackbar.helpPrompt':
      "Besoin d'aide ? Consultez le guide de démarrage rapide en cliquant sur cette icône (?) dans l'en-tête !",
    'steps.configureGit.ctaTitle': 'En savoir plus',
    'steps.configureGit.description':
      'Connectez vos fournisseurs Git, tels que GitHub, pour gérer le code, automatiser les flux de travail et vous intégrer aux fonctionnalités de la plateforme.',
    'steps.configureGit.title': 'Configurer Git',
    'steps.configureRbac.ctaTitle': "Gérer l'accès",
    'steps.configureRbac.description':
      'Attribuez des rôles et des autorisations pour contrôler qui peut consulter, créer ou modifier des ressources, garantissant ainsi une collaboration sécurisée et efficace.',
    'steps.configureRbac.title':
      "Configurer le contrôle d'accès basé sur les rôles (RBAC)",
    'steps.exploreSelfServiceTemplates.ctaTitle': 'Explorez les modèles',
    'steps.exploreSelfServiceTemplates.description':
      'Utilisez nos modèles en libre-service pour configurer rapidement de nouveaux projets, services ou documents.',
    'steps.exploreSelfServiceTemplates.title':
      'Explorez les modèles en libre-service',
    'steps.findAllLearningPaths.ctaTitle':
      "Consulter les parcours d'apprentissage",
    'steps.findAllLearningPaths.description':
      "Intégrez des formations en ligne personnalisées à vos flux de travail grâce aux parcours d'apprentissage pour accélérer l'intégration, combler les lacunes en compétences et promouvoir les meilleures pratiques.",
    'steps.findAllLearningPaths.title':
      "Trouver tous les parcours d'apprentissage",
    'steps.getStartedWithLightspeed.ctaTitle': 'En savoir plus',
    'steps.getStartedWithLightspeed.description':
      "Résolvez les problèmes, générez du code et découvrez les ressources de la plateforme grâce à un chat basé sur l'IA.",
    'steps.getStartedWithLightspeed.title': 'Démarrez avec Lightspeed',
    'steps.importApplication.ctaTitle': 'Importer',
    'steps.importApplication.description':
      'Importez votre code et vos services existants dans le catalogue pour les organiser et y accéder via votre portail développeur.',
    'steps.importApplication.title': "Application d'importation",
    'steps.learnAboutCatalog.ctaTitle': 'Voir le catalogue',
    'steps.learnAboutCatalog.description':
      'Découvrez tous les composants logiciels, services et API, et consultez leurs propriétaires et leur documentation.',
    'steps.learnAboutCatalog.title': 'Découvrez le catalogue',
    'steps.managePlugins.ctaTitle': 'Explorer les plugins',
    'steps.managePlugins.description':
      'Parcourez et installez des extensions pour ajouter des fonctionnalités, vous connecter à des outils externes et personnaliser votre expérience.',
    'steps.managePlugins.title': 'Gérer les plugins',
    'steps.setupAuthentication.ctaTitle': 'En savoir plus',
    'steps.setupAuthentication.description':
      'Configurez des identifiants de connexion sécurisés pour protéger votre compte contre tout accès non autorisé.',
    'steps.setupAuthentication.title': "Configurer l'authentification",
    'steps.setupLightspeed.ctaTitle': 'En savoir plus',
    'steps.setupLightspeed.description':
      "Connectez Lightspeed à un modèle de langage étendu (LLM) pris en charge et configurez les autorisations pour fournir votre assistance basée sur l'IA à vos développeurs.",
    'steps.setupLightspeed.title': 'Configurer à la vitesse de la lumière',
  },
});

export default quickstartTranslationFr;
