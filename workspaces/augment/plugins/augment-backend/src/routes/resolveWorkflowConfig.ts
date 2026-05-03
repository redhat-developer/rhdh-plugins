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

import type { ProviderType } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import type { AdminConfigService } from '../services/AdminConfigService';
import type { RouteContext } from './types';

/**
 * Resolve LlamaStack connection config at request time by reading admin DB
 * overrides first, falling back to YAML config values.
 */
export async function resolveLlamaStackConfig(
  ctx: RouteContext,
  adminConfig: AdminConfigService,
): Promise<{ url: string; model: string; skipTls: boolean }> {
  const providerId: ProviderType = 'llamastack';
  const dbUrl = await adminConfig.getScopedValue('baseUrl', providerId).catch(() => undefined);
  const dbModel = await adminConfig.getScopedValue('model', providerId).catch(() => undefined);

  const url = (typeof dbUrl === 'string' && dbUrl)
    || ctx.config.getOptionalString('augment.llamaStack.baseUrl')
    || 'http://localhost:8321';
  const model = (typeof dbModel === 'string' && dbModel)
    || ctx.config.getOptionalString('augment.llamaStack.model')
    || 'meta-llama/Llama-3.1-8B-Instruct';
  const skipTls = ctx.config.getOptionalBoolean('augment.llamaStack.skipTlsVerify') ?? false;

  return { url, model, skipTls };
}
