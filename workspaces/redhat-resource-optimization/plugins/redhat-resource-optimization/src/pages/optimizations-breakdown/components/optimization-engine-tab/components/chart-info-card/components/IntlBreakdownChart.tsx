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

import React from 'react';
import { IntlProvider } from 'react-intl';
import { RecommendationBoxPlots } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/models';
import {
  Interval,
  OptimizationType,
  RecommendationType,
  ResourceType,
  UsageType,
} from '../../../../../models/ChartEnums';
import {
  createRecommendationDatum,
  createUsageDatum,
} from './intl-breakdown-chart/components/optimizations-breakdown-chart/components/optimizations-breakdown-chart/utils/chart-data-format';
import { OptimizationsBreakdownChart } from './intl-breakdown-chart/components/optimizations-breakdown-chart/components/optimizations-breakdown-chart/OptimizationsBreakdownChart';
import messagesData from './intl-breakdown-chart/components/optimizations-breakdown-chart/components/optimizations-breakdown-chart/i18n/data.json';

export const IntlBreakdownChart = (props: {
  usageType: UsageType;
  recommendationType: RecommendationType;
  optimizationType: OptimizationType;
  recommendationTerm: Interval;
  value: RecommendationBoxPlots;
}) => {
  const {
    usageType,
    recommendationType,
    optimizationType,
    recommendationTerm,
    value,
  } = props;

  const usageDatum = createUsageDatum(
    usageType,
    recommendationTerm,
    value.recommendations,
  );

  const limitDatum = createRecommendationDatum(
    recommendationTerm,
    usageDatum,
    recommendationType,
    ResourceType.limits,
    optimizationType,
    value.recommendations,
  );

  const requestDatum = createRecommendationDatum(
    recommendationTerm,
    usageDatum,
    recommendationType,
    ResourceType.requests,
    optimizationType,
    value.recommendations,
  );

  return (
    <IntlProvider locale="en" messages={messagesData.en}>
      <OptimizationsBreakdownChart
        baseHeight={350}
        name={`utilization-${usageType}`}
        limitData={limitDatum}
        requestData={requestDatum}
        usageData={usageDatum}
      />
    </IntlProvider>
  );
};
IntlBreakdownChart.displayName = 'IntlBreakdownChart';
