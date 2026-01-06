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

import { Fragment } from 'react';

import { ResponseErrorPanel } from '@backstage/core-components';
import type { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { ScorecardHomepageCard } from './ScorecardHomepageCard';
import { PermissionRequiredHomepageCard } from './PermissionRequiredHomepageCard';
import { useAggregatedScorecard } from '../../hooks/useAggregatedScorecard';
import { useTranslation } from '../../hooks/useTranslation';

interface ScorecardHomepageWrapperProps {
  metricId: string;
}

const ScorecardHomepageWrapper = ({
  metricId,
}: ScorecardHomepageWrapperProps) => {
  const { t } = useTranslation();

  const { aggregatedScorecard, loadingData, error } = useAggregatedScorecard({
    metricId,
  });

  if (loadingData) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    if (error.message?.includes('NotAllowedError')) {
      return <PermissionRequiredHomepageCard metricId={metricId} />;
    }
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <Fragment>
      {aggregatedScorecard
        ?.slice(0, 1)
        .map((metric: AggregatedMetricResult) => {
          const titleKey = `metric.${metric.id}.title`;
          const descriptionKey = `metric.${metric.id}.description`;

          const title = t(titleKey as any, {});
          const description = t(descriptionKey as any, {});

          const finalTitle = title === titleKey ? metric.metadata.title : title;
          const finalDescription =
            description === descriptionKey
              ? metric.metadata.description
              : description;

          return (
            <ScorecardHomepageCard
              key={metric.id}
              cardTitle={finalTitle}
              description={finalDescription}
              scorecard={metric}
            />
          );
        })}
    </Fragment>
  );
};

export const ScorecardJiraHomepageCard = () => (
  <ScorecardHomepageWrapper metricId="jira.open_issues" />
);

export const ScorecardGitHubHomepageCard = () => (
  <ScorecardHomepageWrapper metricId="github.open_prs" />
);
