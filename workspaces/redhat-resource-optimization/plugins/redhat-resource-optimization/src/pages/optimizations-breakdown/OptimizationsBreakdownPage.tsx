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

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import useAsync from 'react-use/esm/useAsync';
import {
  TabbedLayout,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import type { RecommendationBoxPlots } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/models';
import type { WorkflowUnavailableReason } from '@red-hat-developer-hub/plugin-redhat-resource-optimization-common/clients';
import { getTimeFromNow } from '../../utils/dates';
import { BasePage } from '../../components/BasePage';
import { type Interval, OptimizationType } from './models/ChartEnums';
import { OptimizationEngineTab } from './components/optimization-engine-tab/OptimizationEngineTab';
import {
  getCurrentYAMLCodeData,
  getRecommendedYAMLCodeData,
} from './models/YamlCodeData';
import { optimizationsApiRef, orchestratorSlimApiRef } from '../../apis';
import type { WorkflowInputDataSchema } from './models/WorkflowInputDataSchema';

const getContainerData = (value: RecommendationBoxPlots) => [
  { key: 'Cluster', value: value?.clusterAlias },
  { key: 'Project', value: value?.project },
  { key: 'Workload', value: value?.workload },
  { key: 'Type', value: value?.workloadType },
  {
    key: 'Last reported',
    value: getTimeFromNow(value?.lastReported?.toString()),
  },
];

/**
 * Adapts recommendation data into the input schema required for the optimization workflow.
 *
 * This function extracts and transforms resource recommendations (CPU/memory, limits/requests)
 * from the provided `RecommendationBoxPlots` data structure, mapping them into a
 * `WorkflowInputDataSchema` object suitable for workflow consumption.
 *
 * - Converts memory values from mebibytes to bytes where necessary.
 * - Populates cluster, namespace, workload, and container information if available.
 * - Handles both `limits` and `requests` for CPU and memory resources.
 *
 * @param recommendationData - The recommendation data containing resource suggestions and metadata.
 * @param timeRange - The interval term for which recommendations are being adapted.
 * @param optimizationType - The type of optimization engine to use for extracting recommendations.
 * @param type - Specifies the 'limits' or 'requests' resource values.
 * @param resource - Specifies the resource type, either 'cpu' or 'memory'.
 * @returns A `WorkflowInputDataSchema` object populated with the adapted recommendation data.
 */
const adaptRecommendationsDataToWorkflowInputData = (
  recommendationData: RecommendationBoxPlots,
  timeRange: Interval,
  optimizationType: OptimizationType,
): WorkflowInputDataSchema => {
  if (
    !recommendationData.clusterAlias ||
    !recommendationData.project ||
    !recommendationData.workloadType ||
    !recommendationData.workload ||
    !recommendationData.container
  ) {
    throw new Error('Invalid recommendation data');
  }

  const workflowInputData: WorkflowInputDataSchema = {
    clusterName: recommendationData.clusterAlias,
    resourceType: recommendationData.workloadType.toLocaleLowerCase(
      'en-US',
    ) as WorkflowInputDataSchema['resourceType'],
    resourceNamespace: recommendationData.project,
    resourceName: recommendationData.workload,
    containerName: recommendationData.container,
    containerResources: {},
  };

  const config =
    recommendationData.recommendations?.recommendationTerms?.[timeRange]
      ?.recommendationEngines?.[optimizationType]?.config;

  if (config && config.limits) {
    workflowInputData.containerResources.limits = {};
    if (config.limits.cpu) {
      workflowInputData.containerResources.limits.cpu =
        config.limits.cpu.amount;
    }

    if (
      config.limits.memory &&
      typeof config.limits.memory.amount === 'number'
    ) {
      workflowInputData.containerResources.limits.memory = Math.round(
        config.limits.memory.amount * 1024 * 1024,
      );
    }
  }

  if (config && config.requests) {
    workflowInputData.containerResources.requests = {};
    if (config.requests.cpu) {
      workflowInputData.containerResources.requests.cpu =
        config.requests.cpu.amount;
    }

    if (
      config.requests.memory &&
      typeof config.requests.memory.amount === 'number'
    ) {
      workflowInputData.containerResources.requests.memory = Math.round(
        config.requests.memory.amount * 1024 * 1024,
      );
    }
  }

  return workflowInputData;
};

export const OptimizationsBreakdownPage = () => {
  const [recommendationTerm, setRecommendationTerm] =
    useState<Interval>('shortTerm');
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const configApi = useApi(configApiRef);
  const workflowIdRef = useRef<string>(
    configApi.getOptionalString('costManagement.optimizationWorkflowId') ?? '',
  );
  const workflowUnavailableReasonRef = useRef<
    WorkflowUnavailableReason | undefined
  >(undefined);
  const workflowErrorMessageRef = useRef<string | undefined>(undefined);
  const orchestratorSlimApi = useApi(orchestratorSlimApiRef);
  const optimizationsApi = useApi(optimizationsApiRef);
  const {
    value: recommendationsData,
    loading,
    error,
  } = useAsync(async () => {
    const availabilityResult =
      await orchestratorSlimApi.checkWorkflowAvailability(
        workflowIdRef.current,
      );
    if (availabilityResult.available) {
      workflowUnavailableReasonRef.current = undefined;
      workflowErrorMessageRef.current = undefined;
    } else {
      workflowIdRef.current = '';
      workflowUnavailableReasonRef.current = availabilityResult.reason;
      workflowErrorMessageRef.current = availabilityResult.errorMessage;
    }

    const apiQuery = {
      path: {
        recommendationId: id!,
      },
      query: {},
    };

    const response = await optimizationsApi.getRecommendationById(apiQuery);
    return await response.json();
  }, []);

  const optimizationType = useMemo(() => {
    return location.pathname.endsWith('performance')
      ? OptimizationType.performance
      : OptimizationType.cost;
  }, [location.pathname]);

  const recommendedConfiguration = useMemo(
    () =>
      getRecommendedYAMLCodeData(
        recommendationsData!,
        recommendationTerm,
        optimizationType,
      ),
    [recommendationsData, recommendationTerm, optimizationType],
  );

  const currentConfiguration = useMemo(
    () => getCurrentYAMLCodeData(recommendationsData!),
    [recommendationsData],
  );

  const handleApplyRecommendation = useCallback(() => {
    if (!recommendationsData) {
      return;
    }

    try {
      const workflowId = workflowIdRef.current;
      const data = adaptRecommendationsDataToWorkflowInputData(
        recommendationsData,
        recommendationTerm,
        optimizationType,
      );
      orchestratorSlimApi
        .executeWorkflow(workflowId, { inputData: data })
        .then(response => {
          navigate(`/orchestrator/instances/${response.id}`);
        })
        // eslint-disable-next-line no-console
        .catch(console.error);
    } catch {
      return;
    }
  }, [
    navigate,
    optimizationType,
    orchestratorSlimApi,
    recommendationTerm,
    recommendationsData,
  ]);

  const handleRecommendationTermChange = useCallback(
    (
      event: React.ChangeEvent<{
        name?: string;
        value: unknown;
      }>,
    ) => {
      setRecommendationTerm(event.target.value as Interval);
    },
    [],
  );

  const containerData = useMemo(
    () => getContainerData(recommendationsData!),
    [recommendationsData],
  );

  if (loading) {
    return <Progress />;
  }

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <BasePage
      pageThemeId="tool"
      pageTitle={recommendationsData!.container!}
      pageType="Optimizations"
      pageTypeLink="/redhat-resource-optimization"
    >
      <TabbedLayout>
        <TabbedLayout.Route path="/cost?" title="Cost optimizations">
          <OptimizationEngineTab
            optimizationType={OptimizationType.cost}
            chartData={recommendationsData!}
            containerData={containerData}
            recommendationTerm={recommendationTerm}
            currentConfiguration={currentConfiguration}
            recommendedConfiguration={recommendedConfiguration}
            onRecommendationTermChange={handleRecommendationTermChange}
            onApplyRecommendation={handleApplyRecommendation}
            workflowId={workflowIdRef.current}
            workflowUnavailableReason={workflowUnavailableReasonRef.current}
            workflowErrorMessage={workflowErrorMessageRef.current}
          />
        </TabbedLayout.Route>

        <TabbedLayout.Route
          path="/performance"
          title="Performance optimizations"
        >
          <OptimizationEngineTab
            optimizationType={OptimizationType.performance}
            chartData={recommendationsData!}
            containerData={containerData}
            recommendationTerm={recommendationTerm}
            currentConfiguration={currentConfiguration}
            recommendedConfiguration={recommendedConfiguration}
            onRecommendationTermChange={handleRecommendationTermChange}
            onApplyRecommendation={handleApplyRecommendation}
            workflowId={workflowIdRef.current}
            workflowUnavailableReason={workflowUnavailableReasonRef.current}
            workflowErrorMessage={workflowErrorMessageRef.current}
          />
        </TabbedLayout.Route>
      </TabbedLayout>
    </BasePage>
  );
};
OptimizationsBreakdownPage.displayName = 'OptimizationsBreakdownPage';
