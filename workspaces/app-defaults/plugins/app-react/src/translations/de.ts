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
    'catalog.entityTabGroups.Overview': 'Übersicht',
    'catalog.entityTabGroups.Documentation': 'Dokumentation',
    'catalog.entityTabGroups.Development': 'Entwicklung',
    'catalog.entityTabGroups.Deployment': 'Deployment',
    'catalog.entityTabGroups.Operation': 'Betrieb',
    'catalog.entityTabGroups.Observability': 'Observability',
    'catalog.entityTabs.Overview': 'Übersicht',
    'catalog.entityTabs.Docs': 'Dokumentation',
    'catalog.entityTabs.API': 'API',
    'catalog.entityTabs.Dependencies': 'Abhängigkeiten',
    'catalog.entityTabs.Definition': 'Definition',
    'catalog.entityTabs.APIs': 'APIs',
    'catalog.entityTabs.TechDocs': 'TechDocs',
    'catalog.entityTabs.Deployment Lifecycle': 'Deployment-Lebenszyklus',
    'catalog.entityTabs.Deployment Summary': 'Deployment-Übersicht',
    'catalog.entityTabs.Pipelines': 'Pipelines',
    'catalog.entityTabs.Pull Requests': 'Pull Requests',
    'catalog.entityTabs.Bookmarks': 'Lesezeichen',
    'catalog.entityTabs.CI/CD': 'CI/CD',
    'catalog.entityTabs.CI/CD Statistics': 'CI/CD-Statistiken',
    'catalog.entityTabs.Code Coverage': 'Code-Coverage',
    'catalog.entityTabs.Feedback': 'Feedback',
    'catalog.entityTabs.GitHub Actions': 'GitHub Actions',
    'catalog.entityTabs.GitHub Issues': 'GitHub Issues',
    'catalog.entityTabs.CI/CD Security': 'CI/CD-Sicherheit',
    'catalog.entityTabs.Build Artifacts': 'Build-Artefakte',
    'catalog.entityTabs.Todo': 'To-do',
    'catalog.entityTabs.Topology': 'Topologie',
    'catalog.entityTabs.Workflows': 'Workflows',
  },
});
