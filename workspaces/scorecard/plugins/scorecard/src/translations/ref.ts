/*
 * Copyright The Backstage Authors
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
export const scorecardMessages = {
  // Empty state
  emptyState: {
    title: 'No scorecards added yet',
    description:
      'Scorecards help you monitor component health at a glance. To begin, explore our documentation for setup guidelines.',
    button: 'View documentation',
    altText: 'No scorecards',
  },

  // Error messages
  errors: {
    entityMissingProperties:
      'Entity missing required properties for scorecard lookup',
    invalidApiResponse: 'Invalid response format from scorecard API',
    fetchError: 'Error fetching scorecards: {{error}}',
    metricDataUnavailable: 'Metric data unavailable',
    invalidThresholds: 'Invalid thresholds',
  },

  // Metric translations
  metric: {
    'github.open-prs': {
      title: 'GitHub Open Pull Requests',
      description:
        'Current count of open Pull Requests for a given GitHub repository',
    },
    'jira.open-issues': {
      title: 'Jira Open Blocking Tickets',
      description:
        'Highlights the number of critical, blocking issues that are currently open in Jira',
    },
  },

  // Threshold translations
  thresholds: {
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
  },
};

/**
 * Translation reference for scorecard plugin
 * @public
 */
export const scorecardTranslationRef = createTranslationRef({
  id: 'plugin.scorecard',
  messages: scorecardMessages,
});
