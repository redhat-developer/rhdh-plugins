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
export const homepageMessages = {
  header: {
    welcome: 'Welcome back!',
    welcomePersonalized: 'Welcome back, {{name}}!',
    local: 'Local',
  },
  homePage: {
    empty: 'No home page cards (mount points) configured or found.',
  },
  search: {
    placeholder: 'Search',
  },
  quickAccess: {
    title: 'Quick Access',
    fetchError: 'Could not fetch data.',
    error: 'Unknown error',
  },
  featuredDocs: {
    learnMore: ' Learn more',
  },
  templates: {
    title: 'Explore Templates',
    fetchError: 'Could not fetch data.',
    error: 'Unknown error',
    empty: 'No templates added yet',
    emptyDescription:
      'Once templates are added, this space will showcase relevant content tailored to your experience.',
    register: 'Register a template',
    viewAll: 'View all {{count}} templates',
  },
  onboarding: {
    greeting: {
      goodMorning: 'Good morning',
      goodAfternoon: 'Good afternoon',
      goodEvening: 'Good evening',
    },
    guest: 'Guest',
    getStarted: {
      title: 'Get started',
      description: 'Learn about Red Hat Developer Hub.',
      buttonText: 'Read documentation',
      ariaLabel: 'Read documentation (opens in a new tab)',
    },
    explore: {
      title: 'Explore',
      description: 'Explore components, APIs and templates.',
      buttonText: 'Go to Catalog',
      ariaLabel: 'Go to Catalog',
    },
    learn: {
      title: 'Learn',
      description: 'Explore and develop new skills.',
      buttonText: 'Go to Learning Paths',
      ariaLabel: 'Go to Learning Paths',
    },
  },
  entities: {
    title: 'Explore Your Software Catalog',
    fetchError: 'Could not fetch data.',
    error: 'Unknown error',
    description:
      'Browse the Systems, Components, Resources, and APIs that are available in your organization.',
    close: 'close',
    empty: 'No software catalog added yet',
    emptyDescription:
      'Once software catalogs are added, this space will showcase relevant content tailored to your experience.',
    register: 'Register a component',
    viewAll: 'View all {{count}} catalog entities',
  },
};

/**
 * Reference translation for Homepage.
 * Defines all the translation keys used in the plugin.
 * @public
 */
export const homepageTranslationRef = createTranslationRef({
  id: 'plugin.homepage',
  messages: homepageMessages,
});
