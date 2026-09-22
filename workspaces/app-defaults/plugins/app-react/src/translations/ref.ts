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

import { createTranslationRef } from '@backstage/frontend-plugin-api';

/**
 * Translation ref for the catalog entity page tab and group titles rendered by
 * the localized entity header layout. Keyed by the English title so titles can
 * be looked up dynamically (see `LocalizedEntityHeaderLayout` in
 * `@red-hat-developer-hub/backstage-plugin-app-defaults`).
 *
 * @public
 */
export const appReactTranslationRef = createTranslationRef({
  id: 'plugin.app-react',
  messages: {
    // Common page / sidebar item titles, keyed by the English title so the
    // sidebar can look them up dynamically (see `AppSidebar` in
    // `@red-hat-developer-hub/backstage-plugin-app-defaults`). Titles without a
    // matching entry fall through to their original English label.
    pages: {
      Home: 'Home',
      Catalog: 'Catalog',
      APIs: 'APIs',
      Create: 'Create',
      Docs: 'Docs',
      'Learning Paths': 'Learning Paths',
      Settings: 'Settings',
      Notifications: 'Notifications',
      Search: 'Search',
      'Catalog Graph': 'Catalog Graph',
      Administration: 'Administration',
      RBAC: 'RBAC',
      Plugins: 'Plugins',
    },
    catalog: {
      // Catalog entity page group titles, keyed by the English group title.
      entityTabGroups: {
        Overview: 'Overview',
        Documentation: 'Documentation',
        Development: 'Development',
        Deployment: 'Deployment',
        Operation: 'Operation',
        Observability: 'Observability',
      },
      // Catalog entity page tab titles, keyed by the English tab title. Add a
      // new entry here (and in each locale) to localize a new tab title.
      entityTabs: {
        Overview: 'Overview',
        Docs: 'Docs',
        API: 'API',
        Dependencies: 'Dependencies',
        Definition: 'Definition',
        APIs: 'APIs',
        TechDocs: 'TechDocs',
        'Deployment Lifecycle': 'Deployment Lifecycle',
        'Deployment Summary': 'Deployment Summary',
        Pipelines: 'Pipelines',
        'Pull Requests': 'Pull Requests',
        Bookmarks: 'Bookmarks',
        'CI/CD': 'CI/CD',
        'CI/CD Statistics': 'CI/CD Statistics',
        'Code Coverage': 'Code Coverage',
        Feedback: 'Feedback',
        'GitHub Actions': 'GitHub Actions',
        'GitHub Issues': 'GitHub Issues',
        'CI/CD Security': 'CI/CD Security',
        'Build Artifacts': 'Build Artifacts',
        Todo: 'Todo',
        Topology: 'Topology',
        Workflows: 'Workflows',
      },
    },
  },
});
