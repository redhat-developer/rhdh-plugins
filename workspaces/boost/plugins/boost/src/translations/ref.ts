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
    },
    toolbar: {
      allPrefix: 'All',
      search: 'Search',
      viewGrid: 'Card view',
      viewTable: 'Table view',
      filters: 'Filters',
    },
    filter: {
      title: 'Filters',
      all: 'All',
      type: 'Type',
      provider: 'Provider',
      owner: 'Owner',
      tag: 'Tag',
      clearAll: 'Clear all',
    },
    card: {
      assetDetailsTitle: 'AI asset details',
      usageTitle: 'Usage',
      versionLabel: 'Version',
      copyCommand: 'Copy',
      copied: 'Copied',
      copyFailed: 'Copy failed. Try again.',
      usageDownloadZip: 'Download ZIP',
      usageViewSource: 'View source',
      serverTypeLabel: 'Server type',
      apiKeyLabel: 'API key required',
      defaultModelLabel: 'Default model',
      rationaleLabel: 'Rationale',
      disciplinesLabel: 'Disciplines',
      categoriesLabel: 'Categories',
      relatedAgentsLabel: 'Related agents',
      ruleCategoryLabel: 'Rule category',
      toolsLabel: 'Tools',
      remotesLabel: 'Remote endpoints',
      definitionLabel: 'Definition',
      viewDefinition: 'View definition',
      modelsTitle: 'Models',
      modelsAvailableSuffix: 'available',
      modelsAvailableTitle: 'Available Models',
      modelTitle: 'Model',
      viewModels: 'View models',
      modelsDialogTitle: 'Available models',
      modelSearch: 'Search models',
      noModelsMatch: 'No models match your search.',
      instructionsTitle: 'Agent instructions',
      handoffDescriptionTitle: 'Handoff description',
      handoffTargetsTitle: 'Handoff targets',
      ragEnabledLabel: 'RAG Enabled',
      yes: 'Yes',
      no: 'No',
    },
    table: {
      name: 'Name',
      type: 'Type',
      owner: 'Owner',
      provider: 'Provider',
      description: 'Description',
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
