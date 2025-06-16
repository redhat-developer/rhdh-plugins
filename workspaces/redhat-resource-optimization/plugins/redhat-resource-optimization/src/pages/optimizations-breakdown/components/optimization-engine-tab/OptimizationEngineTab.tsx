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
import { Button, Grid } from '@material-ui/core';
import { RecommendationType } from '../../models/ChartEnums';
import { ChartInfoCard } from './components/chart-info-card/ChartInfoCard';
import { CodeInfoCard } from './components/CodeInfoCard';
import { ContainerInfoCard } from './components/ContainerInfoCard';

type ContainerInfoCardProps = Parameters<typeof ContainerInfoCard>[0];
type CodeInfoCardProps = Parameters<typeof CodeInfoCard>[0];
type ChartInfoCardProps = Parameters<typeof ChartInfoCard>[0];

interface OptimizationEngineTabProps extends ContainerInfoCardProps {
  currentConfiguration: CodeInfoCardProps['yamlCodeData'];
  recommendedConfiguration: CodeInfoCardProps['yamlCodeData'];
  chartData: ChartInfoCardProps['chartData'];
  optimizationType: ChartInfoCardProps['optimizationType'];
  onApplyRecommendation?: React.MouseEventHandler<HTMLButtonElement>;
  workflowId?: string;
}

export const OptimizationEngineTab = (props: OptimizationEngineTabProps) => {
  return (
    <Grid container>
      <Grid item xs={12}>
        <ContainerInfoCard
          containerData={props.containerData}
          recommendationTerm={props.recommendationTerm}
          onRecommendationTermChange={props.onRecommendationTermChange}
        />
      </Grid>

      <Grid item xs={6}>
        <CodeInfoCard
          cardTitle="Current configuration"
          yamlCodeData={props.currentConfiguration}
        />
      </Grid>
      <Grid item xs={6}>
        <CodeInfoCard
          cardTitle="Recommended configuration"
          showCopyCodeButton
          yamlCodeData={props.recommendedConfiguration}
          action={
            <Button
              variant="contained"
              color="primary"
              onClick={props.onApplyRecommendation}
              disabled={!props.workflowId}
            >
              Apply recommendation
            </Button>
          }
        />
      </Grid>

      <Grid item xs={6}>
        <ChartInfoCard
          title="CPU utilization"
          chartData={props.chartData}
          recommendationTerm={props.recommendationTerm}
          optimizationType={props.optimizationType}
          resourceType={RecommendationType.cpu}
        />
      </Grid>
      <Grid item xs={6}>
        <ChartInfoCard
          title="Memory utilization"
          chartData={props.chartData}
          recommendationTerm={props.recommendationTerm}
          optimizationType={props.optimizationType}
          resourceType={RecommendationType.memory}
        />
      </Grid>
    </Grid>
  );
};
OptimizationEngineTab.displayName = 'OptimizationEngineTab';
