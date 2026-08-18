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
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import type { ResponsesApiClient } from '../ResponsesApiClient';
import type { EvaluationConfig, ScoringFunctionInfo } from '../../../types';
import { toErrorMessage } from '../../../services/utils';

export type EvalClientAccessor = () => ResponsesApiClient;

export function loadEvaluationConfig(
  config: RootConfigService,
  logger: LoggerService,
): EvaluationConfig | null {
  try {
    const evalConfig = config.getOptionalConfig('augment.evaluation');
    if (!evalConfig) {
      return { enabled: false };
    }

    const onErrorValue = evalConfig.getOptionalString('onError');
    const onError: 'skip' | 'fail' = onErrorValue === 'fail' ? 'fail' : 'skip';

    return {
      enabled: evalConfig.getOptionalBoolean('enabled') ?? false,
      scoringFunctions: evalConfig.getOptionalStringArray('scoringFunctions'),
      minScoreThreshold:
        evalConfig.getOptionalNumber('minScoreThreshold') ?? 0.7,
      onError,
    };
  } catch (error) {
    logger.debug('No evaluation configuration found');
    return { enabled: false };
  }
}

export async function loadAvailableScoringFunctions(
  getClient: EvalClientAccessor,
  logger: LoggerService,
): Promise<ScoringFunctionInfo[]> {
  try {
    const client = getClient();
    const response = await client.request<
      { data?: ScoringFunctionInfo[] } | ScoringFunctionInfo[]
    >('/v1/scoring-functions', { method: 'GET' });

    const functions = Array.isArray(response) ? response : response.data || [];

    if (functions.length > 0) {
      logger.info(
        `Scoring functions available: ${functions
          .map(s => s.identifier)
          .join(', ')}`,
      );
    } else {
      logger.debug('No scoring functions available on this Llama Stack server');
    }

    return functions;
  } catch (error) {
    logger.warn(`Could not load scoring functions: ${toErrorMessage(error)}`);
    return [];
  }
}

export function getQualityLevel(
  score: number,
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 0.9) return 'excellent';
  if (score >= 0.7) return 'good';
  if (score >= 0.5) return 'fair';
  return 'poor';
}
