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

import * as yaml from 'js-yaml';
import {
  KonfluxClusterConfig,
  KonfluxConfig,
  SubcomponentClusterConfig,
} from './types';
import { Config } from '@backstage/config';

// entity Annotation Parsing Logic
export const parseEntityKonfluxConfig = <T>(
  annotation: string | null | undefined,
): T | null => {
  if (!annotation) return null;
  try {
    const clustersParsedYaml = yaml.load(annotation) as T;
    return clustersParsedYaml;
  } catch {
    // YAML parsing failed, return null to indicate invalid configuration
    return null;
  }
};

/**
 * Parse subcomponent cluster configurations from KonfluxConfig into flattened array.
 *
 * @param konfluxConfig - The Konflux configuration object
 * @param subcomponentNames - Array of subcomponent names to extract configs for
 * @returns Flattened array of subcomponent cluster configurations
 */
export const parseSubcomponentClusterConfigurations = (
  konfluxConfig: KonfluxConfig | undefined,
  subcomponentNames: string[],
): SubcomponentClusterConfig[] => {
  if (!konfluxConfig?.subcomponentConfigs) {
    return [];
  }

  // filter configs to only includ those matching the requested subcomponent names
  return konfluxConfig.subcomponentConfigs.filter(config =>
    subcomponentNames.includes(config.subcomponent),
  );
};

//
export const parseClusterConfigs = (
  clustersConfig: Config | undefined,
): Record<string, KonfluxClusterConfig> | null => {
  if (!clustersConfig) return null;
  try {
    const clusters: Record<string, KonfluxClusterConfig> = {};
    for (const clusterName of clustersConfig.keys()) {
      const clusterConfig = clustersConfig.getConfig(clusterName);
      clusters[clusterName] = {
        uiUrl: clusterConfig.getOptionalString('uiUrl'),
        apiUrl: clusterConfig.getOptionalString('apiUrl'),
        kubearchiveApiUrl: clusterConfig.getOptionalString('kubearchiveApiUrl'),
        serviceAccountToken: clusterConfig.getOptionalString(
          'serviceAccountToken',
        ),
      };
    }
    return clusters;
  } catch {
    // Configuration parsing failed, return null to indicate failure
    return null;
  }
};

/**
 * Parse authProvider from KonfluxConfig
 */
export const parseAuthProviderConfig = (
  clustersConfig: Config | undefined,
): KonfluxConfig['authProvider'] => {
  if (!clustersConfig) {
    return 'oidc';
  }

  const authProvider =
    clustersConfig.getOptionalString('authProvider') || 'oidc';

  return authProvider as KonfluxConfig['authProvider'];
};
