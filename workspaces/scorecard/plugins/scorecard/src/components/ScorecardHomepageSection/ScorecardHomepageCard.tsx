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

import type { ComponentProps } from 'react';

import { ScorecardQueryProvider } from '../../api';
import { ScorecardHomepageCardComponent } from './ScorecardHomepageCardComponent';
import { useAggregatedScorecard } from '../../hooks/useAggregatedScorecard';
import { useTranslation } from '../../hooks/useTranslation';
import { ErrorStatePanel } from './ErrorStatePanel';
import { EmptyStatePanel } from './EmptyStatePanel';
import { Metric } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';
import { useMetricDisplayLabels } from '../../hooks/useMetricDisplayLabels';
import { CardLoading } from '../Common/CardLoading';

export const ScorecardHomepageCard = ({
  metricId,
  aggregationId,
  showSubheader = true,
  showInfo = true,
}: {
  metricId?: string;
  aggregationId?: string;
  showSubheader?: boolean;
  showInfo?: boolean;
}) => {
  const { t } = useTranslation();

  // Deprecated logic to support both metricId and aggregationId. Only aggregationId will be used in the future.
  const resolvedScorecardId = aggregationId || metricId || '';

  const { data, isLoading, error } =
    useAggregatedScorecard(resolvedScorecardId);

  const aggregatedMetricDetails = data
    ? ({
        id: resolvedScorecardId,
        title: data.metadata.title,
        description: data.metadata.description,
      } as Pick<Metric, 'id' | 'title' | 'description'>)
    : undefined;

  const { title, description } = useMetricDisplayLabels(
    aggregatedMetricDetails,
  );

  const cardDataTestId = `scorecard-homepage-card-${resolvedScorecardId}`;

  if (isLoading) {
    return <CardLoading dataTestId={cardDataTestId} />;
  }

  if (error) {
    return (
      <ErrorStatePanel
        error={error}
        showSubheader={showSubheader}
        aggregationId={resolvedScorecardId}
        cardDataTestId={cardDataTestId}
      />
    );
  }

  if (!data) {
    return null;
  }

  if (data.result?.total === 0) {
    return (
      <EmptyStatePanel
        showSubheader={showSubheader}
        cardTitle={title}
        cardDescription={description}
        label={t('errors.noDataFound')}
        tooltipContent={t('errors.noDataFoundMessage')}
        dataTestId={cardDataTestId}
      />
    );
  }

  return (
    <ScorecardHomepageCardComponent
      key={data.id}
      showSubheader={showSubheader}
      showInfo={showInfo}
      cardTitle={title}
      description={description}
      scorecard={data}
      aggregationId={resolvedScorecardId}
      dataTestId={cardDataTestId}
    />
  );
};

/**
 * ScorecardHomepageCard wrapped with QueryClientProvider so it works
 * when rendered outside a tree that already has a provider (e.g. on the homepage).
 */
export const ScorecardHomepageCardWithProvider = (
  props: ComponentProps<typeof ScorecardHomepageCard>,
) => (
  <ScorecardQueryProvider>
    <ScorecardHomepageCard {...props} />
  </ScorecardQueryProvider>
);
