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

/**
 * Maps NFS homepage widget extension names (`params.name`) to translation keys
 * for title and description shown in the Add widget dialog.
 */
export const widgetTranslationKeysByName: Record<
  string,
  {
    titleKey: string;
    descriptionKey?: string;
    /** Title is for the Add widget dialog only, not shown on the card. */
    hideTitleOnCard?: boolean;
  }
> = {
  'Red Hat Developer Hub - Onboarding': {
    titleKey: 'onboarding.title',
    hideTitleOnCard: true,
  },
  'Red Hat Developer Hub - Software Catalog': {
    titleKey: 'entities.title',
    descriptionKey: 'entities.description',
  },
  'Red Hat Developer Hub - Explore templates': {
    titleKey: 'templates.title',
  },
  'Quick Access Card': { titleKey: 'quickAccess.title' },
  Search: {
    titleKey: 'search.title',
    hideTitleOnCard: true,
  },
  'Featured docs': { titleKey: 'featuredDocs.title' },
  CatalogStarred: { titleKey: 'starredEntities.title' },
  'Your Starred Entities': { titleKey: 'starredEntities.title' },
  'Recently visited': {
    titleKey: 'recentlyVisited.title',
    descriptionKey: 'recentlyVisited.description',
  },
  'Top visited': {
    titleKey: 'topVisited.title',
    descriptionKey: 'topVisited.description',
  },
  HomePageRandomJoke: {
    titleKey: 'randomJoke.title',
    descriptionKey: 'randomJoke.description',
  },
};
