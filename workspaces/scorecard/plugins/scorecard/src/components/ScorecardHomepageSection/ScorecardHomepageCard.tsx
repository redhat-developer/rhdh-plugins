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

import type { AggregatedMetricResult } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { ScorecardHomepageCardComponent } from './ScorecardHomepageCardComponent';
import { EmptyStatePanel } from './EmptyStatePanel';
import { useAggregatedScorecard } from '../../hooks/useAggregatedScorecard';
import { useTranslation } from '../../hooks/useTranslation';

export const ScorecardHomepageCard = ({ metricId }: { metricId: string }) => {
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
    return <EmptyStatePanel error={error} metricId={metricId} />;
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
            <ScorecardHomepageCardComponent
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
