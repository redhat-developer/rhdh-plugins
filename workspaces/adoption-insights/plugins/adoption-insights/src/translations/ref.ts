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
 * @alpha
 */
export const adoptionInsightsMessages = {
  page: {
    title: 'Adoption Insights',
  },
  header: {
    title: 'Adoption Insights',
    dateRange: {
      today: 'Today',
      lastWeek: 'Last week',
      lastMonth: 'Last month',
      last28Days: 'Last 28 days',
      lastYear: 'Last year',
      dateRange: 'Date range...',
      cancel: 'Cancel',
      ok: 'OK',
      defaultLabel: 'Last 28 days',
      title: 'Date range',
      startDate: 'Start date',
      endDate: 'End date',
    },
  },
  activeUsers: {
    title: 'Active users',
    averagePrefix: 'Average peak active user count was',
    averageText: '{{count}} per {{period}}',
    averageSuffix: ' for this period.',
    hour: 'hour',
    day: 'day',
    week: 'week',
    month: 'month',
    legend: {
      newUsers: 'New users',
      returningUsers: 'Returning users',
    },
  },
  templates: {
    title: 'Top templates',
    topNTitle: 'Top {{count}} templates',
    allTitle: 'All templates',
  },
  catalogEntities: {
    title: 'Top catalog entities',
    topNTitle: 'Top {{count}} catalog entities',
    allTitle: 'All catalog entities',
  },
  plugins: {
    title: 'Top plugins',
    topNTitle: 'Top {{count}} plugins',
    allTitle: 'All plugins',
  },
  techDocs: {
    title: 'Top TechDocs',
    topNTitle: 'Top {{count}} TechDocs',
    allTitle: 'All TechDocs',
  },
  searches: {
    title: 'Top searches',
    totalCount: '{{count}} searches',
    averagePrefix: 'Average search count was',
    averageText: '{{count}} per {{period}}',
    averageSuffix: ' for this period.',
    hour: 'hour',
    day: 'day',
    week: 'week',
    month: 'month',
  },
  users: {
    title: 'Total number of users',
    haveLoggedIn: 'have logged in',
    loggedInUsers: 'Logged-in users',
    licensed: 'Licensed',
    licensedNotLoggedIn: 'Licensed (not logged in)',
    ofTotal: 'of {{total}}',
    tooltip: 'Set the number of licensed users in the app-config.yaml',
  },
  table: {
    headers: {
      name: 'Name',
      kind: 'Kind',
      lastUsed: 'Last used',
      views: 'Views',
      executions: 'Executions',
      trend: 'Trend',
      entity: 'Entity',
    },
    pagination: {
      topN: 'Top {{count}}',
    },
  },
  filter: {
    all: 'All',
    selectKind: 'Select kind',
  },
  common: {
    noResults: 'No results for this date range.',
    readMore: 'Read more',
    exportCSV: 'Export CSV',
    downloading: 'Downloading...',
    today: 'Today',
    yesterday: 'Yesterday',
    numberOfSearches: 'Number of searches',
    filteredBy: 'filtered by',
    invalidDateFormat: 'Invalid date format',
    csvFilename: 'active_users',
  },
  permission: {
    title: 'Missing permissions',
    description:
      'To view "Adoption Insights" plugin, contact your administrator to give the adoption-insights.events.read permissions.',
  },
};

/**
 * Reference translation for Adoption Insights.
 * Defines all the translation keys used in the plugin.
 * @alpha
 */
export const adoptionInsightsTranslationRef = createTranslationRef({
  id: 'plugin.adoption-insights',
  messages: adoptionInsightsMessages,
});
