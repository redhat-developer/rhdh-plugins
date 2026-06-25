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
import type {
  SafetyConfig,
  ShieldInfo,
  ShieldRegistration,
} from '../../../types';
import { toErrorMessage } from '../../../services/utils';

export type SafetyClientAccessor = () => ResponsesApiClient;

export function loadSafetyConfig(
  config: RootConfigService,
  logger: LoggerService,
): SafetyConfig | null {
  try {
    const safetyConfig = config.getOptionalConfig('augment.safety');
    if (!safetyConfig) {
      return { enabled: false };
    }

    const registerShieldsConfig =
      safetyConfig.getOptionalConfigArray('registerShields');
    const registerShields: ShieldRegistration[] = [];

    if (registerShieldsConfig) {
      for (const shieldConfig of registerShieldsConfig) {
        registerShields.push({
          shieldId: shieldConfig.getString('shieldId'),
          providerId: shieldConfig.getString('providerId'),
          providerShieldId: shieldConfig.getString('providerShieldId'),
        });
      }
    }

    const onErrorValue = safetyConfig.getOptionalString('onError');
    const onError: 'allow' | 'block' =
      onErrorValue === 'allow' ? 'allow' : 'block';

    return {
      enabled: safetyConfig.getOptionalBoolean('enabled') ?? false,
      inputShields: safetyConfig.getOptionalStringArray('inputShields'),
      outputShields: safetyConfig.getOptionalStringArray('outputShields'),
      registerShields: registerShields.length > 0 ? registerShields : undefined,
      onError,
    };
  } catch (error) {
    logger.debug('No safety configuration found');
    return { enabled: false };
  }
}

export async function loadAvailableShields(
  getClient: SafetyClientAccessor,
  safetyConfig: SafetyConfig | null,
  logger: LoggerService,
): Promise<ShieldInfo[]> {
  try {
    const client = getClient();
    const response = await client.request<
      { data?: ShieldInfo[] } | ShieldInfo[]
    >('/v1/shields', { method: 'GET' });

    let shields = Array.isArray(response) ? response : response.data || [];

    logger.debug(`Found ${shields.length} existing shields`);

    if (shields.length === 0) {
      logger.info(
        'No shields found, attempting to register configured shields...',
      );
      await registerConfiguredShields(getClient, safetyConfig, logger);

      const reloadResponse = await client.request<
        { data?: ShieldInfo[] } | ShieldInfo[]
      >('/v1/shields', { method: 'GET' });
      shields = Array.isArray(reloadResponse)
        ? reloadResponse
        : reloadResponse.data || [];
    }

    if (shields.length > 0) {
      logger.info(
        `Safety shields available: ${shields
          .map(s => s.identifier)
          .join(', ')}`,
      );
    }

    return shields;
  } catch (error) {
    logger.warn(`Could not load shields: ${toErrorMessage(error)}`);
    return [];
  }
}

export async function registerConfiguredShields(
  getClient: SafetyClientAccessor,
  safetyConfig: SafetyConfig | null,
  logger: LoggerService,
): Promise<void> {
  const shieldsToRegister = safetyConfig?.registerShields;

  if (!shieldsToRegister || shieldsToRegister.length === 0) {
    logger.info(
      'No shields configured for registration (augment.safety.registerShields). ' +
        'Safety checks will only work with pre-existing shields on the server.',
    );
    return;
  }

  logger.info(
    `Attempting to register ${shieldsToRegister.length} configured shield(s)...`,
  );

  const client = getClient();

  for (const shield of shieldsToRegister) {
    try {
      await client.request('/v1/shields/register', {
        method: 'POST',
        body: {
          shield_id: shield.shieldId,
          provider_id: shield.providerId,
          provider_shield_id: shield.providerShieldId,
        },
      });
      logger.info(
        `Registered shield: ${shield.shieldId} (provider: ${shield.providerId})`,
      );
    } catch (error) {
      const errorMsg = toErrorMessage(error);
      logger.warn(
        `Could not register shield "${shield.shieldId}": ${errorMsg}`,
      );
      logger.info(
        `  Make sure the "${shield.providerId}" provider is configured on your Llama Stack server`,
      );
    }
  }
}
