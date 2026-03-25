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
import type {
  EffectiveConfig as AdkEffectiveConfig,
  MCPServerConfig as AdkMCPServerConfig,
} from '@augment-adk/augment-adk';
import type {
  EffectiveConfig as PluginEffectiveConfig,
  MCPServerConfig as PluginMCPServerConfig,
} from '../../../types';

/**
 * Maps the plugin's EffectiveConfig to the ADK's EffectiveConfig.
 *
 * Uses destructuring to strip Backstage-specific fields (branding,
 * safety shields, evaluation config) that live in the application
 * layer, then forwards everything else via spread.
 *
 * The `satisfies` check ensures that if the ADK adds a new required
 * field, this file gets a compile error immediately.
 *
 * Plugin-only fields stripped:
 *   branding, safetyEnabled, inputShields, outputShields,
 *   evaluationEnabled, scoringFunctions, minScoreThreshold,
 *   safetyOnError, evaluationOnError
 */
export function toAdkEffectiveConfig(
  plugin: PluginEffectiveConfig,
): AdkEffectiveConfig {
  const {
    branding: _branding,
    safetyEnabled: _safetyEnabled,
    inputShields: _inputShields,
    outputShields: _outputShields,
    evaluationEnabled: _evaluationEnabled,
    scoringFunctions: _scoringFunctions,
    minScoreThreshold: _minScoreThreshold,
    safetyOnError: _safetyOnError,
    evaluationOnError: _evaluationOnError,
    mcpServers,
    agents,
    ...rest
  } = plugin;

  return {
    ...rest,
    mcpServers: mcpServers?.map(toAdkMcpServerConfig),
    agents: agents as AdkEffectiveConfig['agents'],
  } satisfies AdkEffectiveConfig;
}

/**
 * Maps a plugin MCPServerConfig to the ADK's MCPServerConfig.
 * Strips auth-related fields (authRef, oauth, serviceAccount)
 * which are resolved into `headers` before being passed here.
 */
export function toAdkMcpServerConfig(
  plugin: PluginMCPServerConfig,
): AdkMCPServerConfig {
  return {
    id: plugin.id,
    name: plugin.name,
    type: plugin.type,
    url: plugin.url,
    headers: plugin.headers,
    requireApproval:
      plugin.requireApproval as AdkMCPServerConfig['requireApproval'],
    allowedTools: plugin.allowedTools,
  };
}
