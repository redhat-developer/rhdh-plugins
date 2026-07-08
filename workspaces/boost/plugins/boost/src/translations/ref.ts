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
      subtitle: 'Discover AI agents, skills, MCP servers, models, and more.',
    },
    card: {
      summaryTitle: 'AI Asset Summary',
      summaryDescription:
        'Category, version, source, and lifecycle information.',
      downloadTitle: 'Download / Adopt',
      downloadDescription:
        'Download or adoption actions based on asset location type.',
      versionTitle: 'Versions',
      versionDescription: 'All versions of this asset.',
    },
    tab: {
      usageTitle: 'Usage',
      usageDescription:
        'Usage documentation, TechDocs content, or external links.',
    },
    empty: {
      title: 'No AI assets found',
      description: 'No AI assets match your current filters.',
      clearFilters: 'Clear filters',
    },
    error: {
      title: 'Failed to load AI assets',
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
