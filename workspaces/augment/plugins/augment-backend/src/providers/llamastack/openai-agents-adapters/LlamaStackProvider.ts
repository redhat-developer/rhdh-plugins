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
import type { ModelProvider, Model } from '@openai/agents-core';
import type { ResponsesApiService } from '../../responses-api/chat/ResponsesApiService';
import type { ResponsesApiClient } from '../../responses-api/client/ResponsesApiClient';
import type { EffectiveConfig } from '../../../types';
import { LlamaStackModel } from './LlamaStackModel';

/**
 * ModelProvider that creates LlamaStackModel instances backed by the
 * existing ResponsesApiService + ResponsesApiClient HTTP layer.
 *
 * The agents-core Runner calls `getModel(name)` once per agent turn;
 * we return a LlamaStackModel configured with the current effective
 * config and HTTP client.
 */
export class LlamaStackProvider implements ModelProvider {
  constructor(
    private readonly chatService: ResponsesApiService,
    private readonly client: ResponsesApiClient,
    private readonly getEffectiveConfig: () => EffectiveConfig,
  ) {}

  getModel(modelName?: string): Model {
    const config = this.getEffectiveConfig();
    if (modelName && modelName !== config.model) {
      return new LlamaStackModel(
        this.chatService,
        this.client,
        { ...config, model: modelName },
      );
    }
    return new LlamaStackModel(
      this.chatService,
      this.client,
      config,
    );
  }
}
