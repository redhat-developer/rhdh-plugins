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

export const boostMessages = {
  catalog: {
    page: {
      title: 'AI Catalog',
      subtitle:
        'Browse, search, filter, and download AI skills, agents, and rules from your organization',
    },
    toolbar: {
      allPrefix: 'All',
      search: 'Search',
      viewGrid: 'Card view',
      viewTable: 'Table view',
    },
    filter: {
      type: 'Type',
      provider: 'Provider',
      owner: 'Owner',
      tag: 'Tag',
    },
    card: {
      summaryTitle: 'Summary',
      adoptionTitle: 'Get Started',
      versionTitle: 'Versions',
      versionCurrent: 'current',
      copyCommand: 'Copy',
      copied: 'Copied',
      copyAriaLabel: 'Copy command',
    },
    table: {
      name: 'Name',
      type: 'Type',
      owner: 'Owner',
      provider: 'Provider',
      description: 'Description',
    },
    tab: {
      usageTitle: 'Usage',
      usageDocumentation: 'Documentation',
      usageViewTechDocs: 'View TechDocs',
      usageExternalLinks: 'External Links',
      usageNoDocumentation:
        'No usage documentation available. Contact the owner for access.',
    },
    empty: {
      title: 'No AI assets available',
      description:
        'AI assets will appear here once they are published to the OCI registry or synced from your catalog.',
      learnMore: 'Learn How to Publish',
    },
    emptyFiltered: {
      title: 'No AI assets match your filters',
      description:
        'Try adjusting your search or filter criteria to find what you are looking for.',
      clearFilters: 'Clear filters',
    },
    error: {
      title: 'Failed to load AI assets',
      description:
        'There was a problem connecting to the catalog. Check your network connection and try again.',
      retry: 'Retry',
    },
  },
  nav: {
    aiCatalog: 'AI Catalog',
  },
};

/**
 * Translation reference for the Boost plugin.
 * @public
 */
export const boostTranslationRef = createTranslationRef({
  id: 'plugin.boost',
  messages: boostMessages,
});
