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

import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Tooltip,
} from '@material-ui/core';
import type { WorkflowUnavailableReason } from '@red-hat-developer-hub/plugin-cost-management-common/clients';
import { RecommendationType } from '../../models/ChartEnums';
import { ChartInfoCard } from './components/chart-info-card/ChartInfoCard';
import { CodeInfoCard } from './components/CodeInfoCard';
import { ContainerInfoCard } from './components/ContainerInfoCard';

type ContainerInfoCardProps = Parameters<typeof ContainerInfoCard>[0];
type CodeInfoCardProps = Parameters<typeof CodeInfoCard>[0];
type ChartInfoCardProps = Parameters<typeof ChartInfoCard>[0];

const DEFAULT_WORKFLOW_MESSAGES: Record<WorkflowUnavailableReason, string> = {
  not_configured: 'No workflow configured to apply recommendations',
  not_found: 'Workflow not found',
  access_denied: 'You do not have permission to access this workflow',
  service_unavailable: 'Workflow service is currently unavailable',
};

interface OptimizationEngineTabProps extends ContainerInfoCardProps {
  currentConfiguration: CodeInfoCardProps['yamlCodeData'];
  recommendedConfiguration: CodeInfoCardProps['yamlCodeData'];
  chartData: ChartInfoCardProps['chartData'];
  optimizationType: ChartInfoCardProps['optimizationType'];
  onApplyRecommendation?: React.MouseEventHandler<HTMLButtonElement>;
  workflowId?: string;
  workflowUnavailableReason?: WorkflowUnavailableReason;
  workflowErrorMessage?: string;
}

export const OptimizationEngineTab = ({
  workflowId,
  workflowErrorMessage,
  workflowUnavailableReason,
  onApplyRecommendation,
  ...restProps
}: OptimizationEngineTabProps) => {
  const isWorkflowAvailable = !!workflowId;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const tooltipMessage = useMemo(() => {
    if (isWorkflowAvailable) {
      return '';
    }
    if (workflowErrorMessage) {
      return workflowErrorMessage;
    }
    if (workflowUnavailableReason) {
      return DEFAULT_WORKFLOW_MESSAGES[workflowUnavailableReason];
    }
    return DEFAULT_WORKFLOW_MESSAGES.not_configured;
  }, [isWorkflowAvailable, workflowErrorMessage, workflowUnavailableReason]);

  const handleApplyClick = useCallback(() => {
    setConfirmOpen(true);
  }, []);

  const handleConfirmCancel = useCallback(() => {
    setConfirmOpen(false);
  }, []);

  const handleConfirmApply = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setConfirmOpen(false);
      onApplyRecommendation?.(event);
    },
    [onApplyRecommendation],
  );

  return (
    <Grid container>
      <Grid item xs={12}>
        <ContainerInfoCard
          containerData={restProps.containerData}
          recommendationTerm={restProps.recommendationTerm}
          onRecommendationTermChange={restProps.onRecommendationTermChange}
        />
      </Grid>

      <Grid item xs={6}>
        <CodeInfoCard
          cardTitle="Current configuration"
          yamlCodeData={restProps.currentConfiguration}
        />
      </Grid>
      <Grid item xs={6}>
        <CodeInfoCard
          cardTitle="Recommended configuration"
          showCopyCodeButton
          yamlCodeData={restProps.recommendedConfiguration}
          action={
            <Tooltip
              title={tooltipMessage}
              disableHoverListener={isWorkflowAvailable}
              disableFocusListener={isWorkflowAvailable}
              disableTouchListener={isWorkflowAvailable}
            >
              <Box component="span" display="inline-block">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleApplyClick}
                  disabled={!isWorkflowAvailable}
                >
                  Apply recommendation
                </Button>
              </Box>
            </Tooltip>
          }
        />
      </Grid>

      <Grid item xs={6}>
        <ChartInfoCard
          title="CPU utilization"
          chartData={restProps.chartData}
          recommendationTerm={restProps.recommendationTerm}
          optimizationType={restProps.optimizationType}
          resourceType={RecommendationType.cpu}
        />
      </Grid>
      <Grid item xs={6}>
        <ChartInfoCard
          title="Memory utilization"
          chartData={restProps.chartData}
          recommendationTerm={restProps.recommendationTerm}
          optimizationType={restProps.optimizationType}
          resourceType={RecommendationType.memory}
        />
      </Grid>

      <Dialog open={confirmOpen} onClose={handleConfirmCancel}>
        <DialogTitle>Apply recommendation?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will execute a workflow to modify the resource configuration on
            the target cluster. This action cannot be easily undone. Are you
            sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmCancel} color="default">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmApply}
            color="primary"
            variant="contained"
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};
OptimizationEngineTab.displayName = 'OptimizationEngineTab';
