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

/**
 * Messages object containing all English translations.
 * This is our single source of truth for translations.
 * @public
 */
export const aiExperienceMessages = {
  page: {
    title: 'AI Experience',
    subtitle: 'Explore AI models, servers, news, and learning resources',
  },
  learn: {
    getStarted: {
      title: 'Get started',
      description: 'Learn about Red Hat Developer Hub.',
      cta: 'Go to Tech Docs',
    },
    explore: {
      title: 'Explore',
      description: 'Explore AI models, servers and templates.',
      cta: 'Go to Catalog',
    },
    learn: {
      title: 'Learn',
      description: 'Explore and develop new skills in AI.',
      cta: 'Go to Learning Paths',
    },
  },
  news: {
    pageTitle: 'AI News',
    fetchingRssFeed: 'Fetching RSS Feed',
    noContentAvailable: 'No content available',
    noContentDescription:
      "Looks like we couldn't get content from that RSS feed. You can double-check the URL or switch to a different source by updating the plugin config file.",
    noRssContent: 'No RSS Content',
  },
  modal: {
    title: {
      preview: 'Preview attachment',
      edit: 'Edit attachment',
    },
    edit: 'Edit',
    save: 'Save',
    close: 'Close',
    cancel: 'Cancel',
  },
  common: {
    viewMore: 'View more',
    guest: 'Guest',
    template: 'Template',
    latest: 'latest',
    more: 'more',
  },
  greeting: {
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',
  },
  sections: {
    exploreAiModels: 'Explore AI models',
    exploreAiTemplates: 'Explore AI templates',
    discoverModels:
      'Discover the AI models and services that are available in your organization',
    viewAllModels: 'View all {{count}} models',
    viewAllTemplates: 'View all {{count}} templates',
  },
  accessibility: {
    close: 'close',
    aiIllustration: 'AI illustration',
    aiModelsIllustration: 'AI models illustration',
  },
};

/**
 * Translation Reference for AI experience
 * @public
 **/
export const aiExperienceTranslationRef = createTranslationRef({
  id: 'plugin.ai-experience',
  messages: aiExperienceMessages,
});
