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
    'steps.title.setupAuthentication': "Configurer l'authentification",
    'steps.title.configureRbac': 'Configurer RBAC',
    'steps.title.configureGit': 'Configurer Git',
    'steps.title.managePlugins': 'Gérer les plugins',
    'steps.title.importApplication': 'Importer une application',
    'steps.title.learnAboutCatalog': 'Apprendre le Catalogue',
    'steps.title.exploreSelfServiceTemplates':
      'Explorer les modèles en libre-service',
    'steps.title.findAllLearningPaths':
      "Trouver tous les parcours d'apprentissage",
    'steps.description.setupAuthentication':
      "Configurez des identifiants de connexion sécurisés pour protéger votre compte contre l'accès non autorisé.",
    'steps.description.configureRbac':
      'Attribuez des rôles et des permissions pour contrôler qui peut voir, créer ou modifier des ressources, assurant une collaboration sécurisée et efficace.',
    'steps.description.configureGit':
      'Connectez vos fournisseurs Git, comme GitHub, pour gérer le code, automatiser les flux de travail et intégrer avec les fonctionnalités de la plateforme.',
    'steps.description.managePlugins':
      'Parcourez et installez des extensions pour ajouter des fonctionnalités, connecter avec des outils externes et personnaliser votre expérience.',
    'steps.description.importApplication':
      'Importez votre code et vos services existants dans le catalogue pour les organiser et y accéder via votre portail développeur.',
    'steps.description.learnAboutCatalog':
      'Découvrez tous les composants logiciels, services et API, et consultez leurs propriétaires et leur documentation.',
    'steps.description.exploreSelfServiceTemplates':
      'Utilisez nos modèles en libre-service pour configurer rapidement de nouveaux projets, services ou documentation.',
    'steps.description.findAllLearningPaths':
      "Intégrez l'e-learning sur mesure dans vos flux de travail avec des parcours d'apprentissage pour accélérer l'intégration, combler les lacunes de compétences et promouvoir les meilleures pratiques.",
    'steps.cta.learnMore': 'En savoir plus',
    'steps.cta.manageAccess': "Gérer l'accès",
    'steps.cta.explorePlugins': 'Explorer les plugins',
    'steps.cta.import': 'Importer',
    'steps.cta.viewCatalog': 'Voir le catalogue',
    'steps.cta.exploreTemplates': 'Explorer les modèles',
    'steps.cta.viewLearningPaths': "Voir les parcours d'apprentissage",
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
