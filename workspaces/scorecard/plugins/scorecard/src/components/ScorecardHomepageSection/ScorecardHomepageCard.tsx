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

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

import { ScorecardHomepageCardComponent } from './ScorecardHomepageCardComponent';
import { useAggregatedScorecard } from '../../hooks/useAggregatedScorecard';
import { useTranslation } from '../../hooks/useTranslation';
import { ErrorStatePanel } from './ErrorStatePanel';
import { EmptyStatePanel } from './EmptyStatePanel';

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
    return <ErrorStatePanel error={error} metricId={metricId} />;
  }

  if (!aggregatedScorecard) {
    return null;
  }

  if (aggregatedScorecard.result?.total === 0) {
    return (
      <EmptyStatePanel
        metricId={metricId}
        label={t('errors.noDataToAggregate')}
        tooltipContent={t('errors.noDataToAggregateMessage')}
      />
    );
  }

  const titleKey = `metric.${aggregatedScorecard.id}.title`;
  const descriptionKey = `metric.${aggregatedScorecard.id}.description`;

  const title = t(titleKey as any, {});
  const description = t(descriptionKey as any, {});

  const finalTitle =
    title === titleKey ? aggregatedScorecard.metadata.title : title;
  const finalDescription =
    description === descriptionKey
      ? aggregatedScorecard.metadata.description
      : description;

  return (
    <ScorecardHomepageCardComponent
      key={aggregatedScorecard.id}
      cardTitle={finalTitle}
      description={finalDescription}
      scorecard={aggregatedScorecard}
    />
  );
};
