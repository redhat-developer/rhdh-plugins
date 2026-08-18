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
import type {
  SafetyConfig,
  ShieldInfo,
  SafetyViolation,
  RunShieldResponse,
} from '../../../types';
import { toErrorMessage } from '../../../services/utils';
import { loadSafetyConfig, loadAvailableShields } from './safetyConfigLoader';

export type { SafetyClientAccessor } from './safetyConfigLoader';
import type { SafetyClientAccessor } from './safetyConfigLoader';

export class SafetyService {
  private readonly logger: LoggerService;
  private readonly config: RootConfigService;
  private readonly getClient?: SafetyClientAccessor;
  private safetyConfig: SafetyConfig | null = null;
  private availableShields: ShieldInfo[] = [];
  private initialized = false;

  constructor(options: {
    logger: LoggerService;
    config: RootConfigService;
    getClient?: SafetyClientAccessor;
  }) {
    this.logger = options.logger;
    this.config = options.config;
    this.getClient = options.getClient;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      const llamaStackConfig =
        this.config.getOptionalConfig('augment.llamaStack');
      if (!llamaStackConfig) {
        this.logger.info(
          'augment.llamaStack not configured, safety service disabled',
        );
        this.initialized = true;
        return;
      }

      this.safetyConfig = loadSafetyConfig(this.config, this.logger);

      if (!this.safetyConfig?.enabled) {
        this.logger.info('Safety guardrails are disabled');
        this.initialized = true;
        return;
      }

      if (!this.getClient) {
        this.logger.warn(
          'Safety enabled but no ResponsesApiClient accessor provided, shield API calls will fail',
        );
        this.initialized = true;
        return;
      }

      this.availableShields = await loadAvailableShields(
        this.getClient,
        this.safetyConfig,
        this.logger,
      );

      this.logger.info(
        `Safety service initialized with ${this.availableShields.length} shield(s) available`,
      );
      this.initialized = true;
    } catch (error) {
      this.logger.warn(
        `Failed to initialize safety service: ${toErrorMessage(
          error,
        )}. Safety checks will be skipped.`,
      );
      this.safetyConfig = null;
      this.initialized = true;
    }
  }

  private dynamicOverrides?: {
    enabled?: boolean;
    inputShields?: string[];
    outputShields?: string[];
    onError?: 'allow' | 'block';
  };

  applyDynamicOverrides(overrides: {
    safetyEnabled?: boolean;
    inputShields?: string[];
    outputShields?: string[];
    safetyOnError?: 'allow' | 'block';
  }): void {
    if (
      overrides.safetyEnabled !== undefined ||
      overrides.inputShields !== undefined ||
      overrides.outputShields !== undefined ||
      overrides.safetyOnError !== undefined
    ) {
      this.dynamicOverrides = {
        enabled: overrides.safetyEnabled,
        inputShields: overrides.inputShields,
        outputShields: overrides.outputShields,
        onError: overrides.safetyOnError,
      };
    }
  }

  private isEffectivelyEnabled(): boolean {
    if (this.dynamicOverrides?.enabled !== undefined) {
      return this.dynamicOverrides.enabled;
    }
    return this.safetyConfig?.enabled ?? false;
  }

  private getEffectiveInputShields(): string[] | undefined {
    return (
      this.dynamicOverrides?.inputShields ?? this.safetyConfig?.inputShields
    );
  }

  private getEffectiveOutputShields(): string[] | undefined {
    return (
      this.dynamicOverrides?.outputShields ?? this.safetyConfig?.outputShields
    );
  }

  isEnabled(): boolean {
    return this.isEffectivelyEnabled();
  }

  getAvailableShields(): ShieldInfo[] {
    return this.availableShields;
  }

  async checkInput(userMessage: string): Promise<SafetyViolation | undefined> {
    if (!this.isEffectivelyEnabled()) {
      return undefined;
    }

    const inputShields = this.getEffectiveInputShields();
    if (!inputShields || inputShields.length === 0) {
      if (this.availableShields.length === 0) {
        return undefined;
      }
      return this.runShield(this.availableShields[0].identifier, userMessage);
    }

    const results = await Promise.all(
      inputShields.map(shieldId => this.runShield(shieldId, userMessage)),
    );
    for (let i = 0; i < results.length; i++) {
      if (results[i]) {
        this.logger.info(
          `Input blocked by shield ${inputShields[i]}: ${results[i]!.user_message}`,
        );
        return results[i];
      }
    }

    return undefined;
  }

  async checkOutput(aiResponse: string): Promise<SafetyViolation | undefined> {
    if (!this.isEffectivelyEnabled()) {
      return undefined;
    }

    const outputShields = this.getEffectiveOutputShields();
    if (!outputShields || outputShields.length === 0) {
      return undefined;
    }

    const results = await Promise.all(
      outputShields.map(shieldId => this.runShield(shieldId, aiResponse)),
    );
    for (let i = 0; i < results.length; i++) {
      if (results[i]) {
        this.logger.info(
          `Output blocked by shield ${outputShields[i]}: ${results[i]!.user_message}`,
        );
        return results[i];
      }
    }

    return undefined;
  }

  private static readonly SHIELD_TIMEOUT_MS = 5_000;

  private async runShield(
    shieldId: string,
    content: string,
  ): Promise<SafetyViolation | undefined> {
    if (!this.getClient) {
      this.logger.warn(
        `Cannot run shield ${shieldId}: no ResponsesApiClient accessor`,
      );
      return this.handleShieldError(
        shieldId,
        'No ResponsesApiClient accessor available',
      );
    }

    try {
      const client = this.getClient();
      const response = await Promise.race([
        client.request<RunShieldResponse>('/v1/safety/run-shield', {
          method: 'POST',
          body: {
            shield_id: shieldId,
            messages: [{ role: 'user', content }],
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Shield ${shieldId} timed out`)),
            SafetyService.SHIELD_TIMEOUT_MS,
          ),
        ),
      ]);

      return response.violation ?? undefined;
    } catch (error) {
      const errorMsg = toErrorMessage(error);
      this.logger.warn(`Failed to run shield ${shieldId}: ${errorMsg}`);
      return this.handleShieldError(shieldId, errorMsg);
    }
  }

  private getEffectiveOnError(): 'allow' | 'block' {
    return (
      this.dynamicOverrides?.onError ?? this.safetyConfig?.onError ?? 'block'
    );
  }

  private handleShieldError(
    shieldId: string,
    errorMsg: string,
  ): SafetyViolation | undefined {
    const onError = this.getEffectiveOnError();

    if (onError === 'block') {
      this.logger.warn(
        `Safety check failed for shield ${shieldId} - blocking message (onError: block)`,
      );
      return {
        violation_level: 'error',
        user_message: `Safety check unavailable. Message blocked for security. (Shield: ${shieldId})`,
        metadata: { error: errorMsg, shield_id: shieldId },
      };
    }

    this.logger.warn(
      `Safety check failed for shield ${shieldId} - allowing message (onError: allow)`,
    );
    return undefined;
  }
}
