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

import { ScorecardHomepageCardComponent } from './ScorecardHomepageCardComponent';
import { useAggregatedScorecard } from '../../hooks/useAggregatedScorecard';
import { useTranslation } from '../../hooks/useTranslation';
import { ErrorStatePanel } from './ErrorStatePanel';
import { EmptyStatePanel } from './EmptyStatePanel';
import { CardLoading } from '../CardLoading';
import { useMetricDisplayLabels } from '../../hooks/useMetricDisplayLabels';
import { MetricsDetails } from '@red-hat-developer-hub/backstage-plugin-scorecard-common';

export const ScorecardHomepageCard = ({ metricId }: { metricId: string }) => {
  const { t } = useTranslation();

  const { aggregatedScorecard, loadingData, error } = useAggregatedScorecard({
    metricId,
  });

  const { title, description } = useMetricDisplayLabels(
    aggregatedScorecard?.metadata as MetricsDetails,
  );

  if (loadingData) {
    return <CardLoading />;
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
        cardTitle={title}
        cardDescription={description}
        label={t('errors.noDataFound')}
        tooltipContent={t('errors.noDataFoundMessage')}
      />
    );
  }

  return (
    <ScorecardHomepageCardComponent
      key={aggregatedScorecard.id}
      cardTitle={title}
      description={description}
      scorecard={aggregatedScorecard}
    />
  );
};
