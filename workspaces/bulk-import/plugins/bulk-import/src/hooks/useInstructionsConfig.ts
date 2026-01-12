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

import { configApiRef, useApi } from '@backstage/core-plugin-api';

export interface InstructionsStep {
  id: string;
  text: string;
  icon?: string;
}

export interface InstructionsConfig {
  enabled: boolean;
  defaultExpanded: boolean;
  steps: InstructionsStep[];
}

/**
 * Hook to get instructions configuration from app-config.yaml
 */
export function useInstructionsConfig(): InstructionsConfig {
  const configApi = useApi(configApiRef);
  const bulkImportConfig = configApi.getOptionalConfig('bulkImport');
  const instructionsEnabled =
    configApi.getOptionalBoolean('bulkImport.instructionsEnabled') ?? true;
  const instructionsDefaultExpanded =
    configApi.getOptionalBoolean('bulkImport.instructionsDefaultExpanded') ??
    true;
  let instructionsSteps =
    configApi.getOptionalConfigArray('bulkImport.instructionsSteps') ?? [];

  if (instructionsSteps.length === 0 && bulkImportConfig) {
    instructionsSteps =
      bulkImportConfig.getOptionalConfigArray('instructionsSteps') ?? [];

    // If still empty, try accessing the raw data (bypass schema validation)
    if (instructionsSteps.length === 0) {
      try {
        const rawData = (bulkImportConfig as any).data;
        if (
          rawData &&
          rawData.instructionsSteps &&
          Array.isArray(rawData.instructionsSteps)
        ) {
          // Convert raw data to InstructionsStep format
          instructionsSteps = rawData.instructionsSteps.map((step: any) => ({
            id: step.id,
            text: step.text,
            icon: step.icon
              ? {
                  type: step.icon.type as 'builtin' | 'url',
                  source: step.icon.source,
                }
              : undefined,
          }));
        }
      } catch (error) {
        // Silently handle config access errors
      }
    }
  }

  // Use the flat config values
  const enabled = instructionsEnabled;
  const defaultExpanded = instructionsDefaultExpanded;
  let stepsConfig = instructionsSteps;

  // Legacy fallback approach (no longer needed with current config structure)
  if (stepsConfig.length === 0) {
    // Try accessing via bulkImport config object
    const legacyBulkImportConfig = configApi.getOptionalConfig('bulkImport');
    if (legacyBulkImportConfig) {
      const instructionsConfig =
        legacyBulkImportConfig.getOptionalConfig('instructions');
      if (instructionsConfig) {
        stepsConfig = instructionsConfig.getOptionalConfigArray('steps') ?? [];
      }
    }
  }

  const steps: InstructionsStep[] =
    stepsConfig.length > 0
      ? stepsConfig.map(stepConfig => ({
          id: stepConfig.getString('id'),
          text: stepConfig.getString('text'),
          icon: stepConfig.has('icon')
            ? stepConfig.getString('icon')
            : undefined,
        }))
      : []; // No fallback needed - config should work now

  // Use config steps directly - no hardcoded fallback
  const finalSteps = steps;

  return {
    enabled,
    defaultExpanded,
    steps: finalSteps,
  };
}
