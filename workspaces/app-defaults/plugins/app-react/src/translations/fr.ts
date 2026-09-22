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

import { createTranslationMessages } from '@backstage/frontend-plugin-api';
import { appReactTranslationRef } from './ref';

/**
 * @internal
 */
export default createTranslationMessages({
  ref: appReactTranslationRef,
  full: true,
  messages: {
    'pages.Home': 'Accueil',
    'pages.Catalog': 'Catalogue',
    'pages.APIs': 'APIs',
    'pages.Create': 'Libre-service',
    'pages.Docs': 'Documentation',
    'pages.Learning Paths': "Parcours d'apprentissage",
    'pages.Settings': 'Paramètres',
    'pages.Notifications': 'Notifications',
    'pages.Search': 'Recherche',
    'pages.Catalog Graph': 'Graphe du catalogue',
    'pages.Administration': 'Administration',
    'pages.RBAC': 'RBAC',
    'pages.Plugins': 'Plugins',
    'catalog.entityTabGroups.Overview': 'Aperçu',
    'catalog.entityTabGroups.Documentation': 'Documentation',
    'catalog.entityTabGroups.Development': 'Développement',
    'catalog.entityTabGroups.Deployment': 'Déploiement',
    'catalog.entityTabGroups.Operation': 'Exploitation',
    'catalog.entityTabGroups.Observability': 'Observabilité',
    'catalog.entityTabs.Overview': 'Aperçu',
    'catalog.entityTabs.Docs': 'Documentation',
    'catalog.entityTabs.API': 'API',
    'catalog.entityTabs.Dependencies': 'Dépendances',
    'catalog.entityTabs.Definition': 'Définition',
    'catalog.entityTabs.APIs': 'APIs',
    'catalog.entityTabs.TechDocs': 'TechDocs',
    'catalog.entityTabs.Deployment Lifecycle': 'Cycle de vie du déploiement',
    'catalog.entityTabs.Deployment Summary': 'Résumé du déploiement',
    'catalog.entityTabs.Pipelines': 'Pipelines',
    'catalog.entityTabs.Pull Requests': 'Pull Requests',
    'catalog.entityTabs.Bookmarks': 'Favoris',
    'catalog.entityTabs.CI/CD': 'CI/CD',
    'catalog.entityTabs.CI/CD Statistics': 'Statistiques CI/CD',
    'catalog.entityTabs.Code Coverage': 'Couverture de code',
    'catalog.entityTabs.Feedback': 'Retours',
    'catalog.entityTabs.GitHub Actions': 'GitHub Actions',
    'catalog.entityTabs.GitHub Issues': 'GitHub Issues',
    'catalog.entityTabs.CI/CD Security': 'Sécurité CI/CD',
    'catalog.entityTabs.Build Artifacts': 'Artefacts de build',
    'catalog.entityTabs.Todo': 'À faire',
    'catalog.entityTabs.Topology': 'Topologie',
    'catalog.entityTabs.Workflows': 'Workflows',
  },
});
