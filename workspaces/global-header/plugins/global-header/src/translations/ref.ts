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

import { createTranslationRef } from '@backstage/core-plugin-api/alpha';

// Export messages separately for testing
export const globalHeaderMessages = {
  help: {
    tooltip: 'Help',
    noSupportLinks: 'No support links',
    noSupportLinksSubtitle: 'Your administrator needs to set up support links.',
    quickStart: 'Quick start',
    supportTitle: 'Support',
  },
  profile: {
    picture: 'Profile picture',
    settings: 'Settings',
    myProfile: 'My profile',
    signOut: 'Sign out',
  },
  search: {
    placeholder: 'Search...',
    noResults: 'No results found',
    errorFetching: 'Error fetching results',
  },
  applicationLauncher: {
    tooltip: 'Application launcher',
    noLinksTitle: 'No application links configured',
    noLinksSubtitle:
      'Configure application links in dynamic plugin config for quick access from here.',
    developerHub: 'Developer Hub',
    rhdhLocal: 'RHDH Local',
    sections: {
      documentation: 'Documentation',
      developerTools: 'Developer Tools',
    },
  },
  starred: {
    title: 'Your starred items',
    removeTooltip: 'Remove from list',
    noItemsTitle: 'No starred items yet',
    noItemsSubtitle:
      "Click the star icon next to an entity's name to save it here for quick access.",
  },
  notifications: {
    title: 'Notifications',
    unsupportedDismissOption:
      'Unsupported dismiss option "{{option}}", currently supported "none", "session" or "localstorage"!',
  },
  create: {
    title: 'Self-service',
    registerComponent: {
      title: 'Register a component',
      subtitle: 'Import it to the catalog page',
    },
    templates: {
      sectionTitle: 'Use a template',
      allTemplates: 'All templates',
      errorFetching: 'Error fetching templates',
      noTemplatesAvailable: 'No templates available',
    },
  },
};

/**
 * Translation reference for the global header plugin.
 *
 * @public
 */
export const globalHeaderTranslationRef = createTranslationRef({
  id: 'plugin.global-header',
  messages: globalHeaderMessages,
});
