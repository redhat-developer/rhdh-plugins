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
    'pages.Home': 'Home',
    'pages.Catalog': 'Catalogo',
    'pages.APIs': 'API',
    'pages.Create': 'Crea',
    'pages.Docs': 'Documentazione',
    'pages.Learning Paths': 'Learning Path',
    'pages.Settings': 'Impostazioni',
    'pages.Notifications': 'Notifiche',
    'pages.Search': 'Ricerca',
    'pages.Catalog Graph': 'Grafo del catalogo',
    'pages.Administration': 'Amministrazione',
    'pages.RBAC': 'RBAC',
    'pages.Plugins': 'Plugin',
    'catalog.entityTabGroups.Overview': 'Panoramica',
    'catalog.entityTabGroups.Documentation': 'Documentazione',
    'catalog.entityTabGroups.Development': 'Sviluppo',
    'catalog.entityTabGroups.Deployment': 'Deployment',
    'catalog.entityTabGroups.Operation': 'Operatività',
    'catalog.entityTabGroups.Observability': 'Osservabilità',
    'catalog.entityTabs.Overview': 'Panoramica',
    'catalog.entityTabs.Docs': 'Documentazione',
    'catalog.entityTabs.API': 'API',
    'catalog.entityTabs.Dependencies': 'Dipendenze',
    'catalog.entityTabs.Definition': 'Definizione',
    'catalog.entityTabs.APIs': 'API',
    'catalog.entityTabs.TechDocs': 'TechDocs',
    'catalog.entityTabs.Deployment Lifecycle': 'Ciclo di vita del deployment',
    'catalog.entityTabs.Deployment Summary': 'Riepilogo del deployment',
    'catalog.entityTabs.Pipelines': 'Pipeline',
    'catalog.entityTabs.Pull Requests': 'Pull Request',
    'catalog.entityTabs.Bookmarks': 'Segnalibri',
    'catalog.entityTabs.CI/CD': 'CI/CD',
    'catalog.entityTabs.CI/CD Statistics': 'Statistiche CI/CD',
    'catalog.entityTabs.Code Coverage': 'Copertura del codice',
    'catalog.entityTabs.Feedback': 'Feedback',
    'catalog.entityTabs.GitHub Actions': 'GitHub Actions',
    'catalog.entityTabs.GitHub Issues': 'GitHub Issues',
    'catalog.entityTabs.CI/CD Security': 'Sicurezza CI/CD',
    'catalog.entityTabs.Build Artifacts': 'Artefatti di build',
    'catalog.entityTabs.Todo': 'Da fare',
    'catalog.entityTabs.Topology': 'Topologia',
    'catalog.entityTabs.Workflows': 'Workflow',
  },
});
