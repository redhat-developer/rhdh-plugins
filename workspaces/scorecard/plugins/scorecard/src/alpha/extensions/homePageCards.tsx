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

import { HomePageWidgetBlueprint } from '@backstage/plugin-home-react/alpha';
import { ScorecardHomepageCard } from '../../components/ScorecardHomepageSection';

const defaultCardLayout = {
  width: {
    minColumns: 3,
    maxColumns: 12,
    defaultColumns: 4,
  },
  height: {
    minRows: 5,
    maxRows: 12,
    defaultRows: 6,
  },
} as const;

function ScorecardHomepageContent() {
  return <ScorecardHomepageCard metricId="github.open_prs" />;
}

function ScorecardJiraHomepageContent() {
  return <ScorecardHomepageCard metricId="jira.open_issues" />;
}

/**
 * NFS widget: ScorecardHomepageCard.
 * @alpha
 */
export const scorecardHomepageWidget = HomePageWidgetBlueprint.make({
  name: 'scorecard-github-homepage',
  params: {
    name: 'ScorecardGithubHomepage',
    layout: defaultCardLayout,
    components: () =>
      Promise.resolve({
        Content: ScorecardHomepageContent,
      }),
  },
});

/**
 * NFS widget: ScorecardHomepageCard for Jira open blocking tickets.
 * @alpha
 */
export const scorecardJiraHomepageWidget = HomePageWidgetBlueprint.make({
  name: 'scorecard-jira-homepage',
  params: {
    name: 'ScorecardJiraHomepage',
    layout: defaultCardLayout,
    components: () =>
      Promise.resolve({
        Content: ScorecardJiraHomepageContent,
      }),
  },
});
