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

import type { Entity } from '@backstage/catalog-model';

/**
 * An AI model server represented as a dedicated AiModelServerAPI entity
 * kind with spec.type: 'ai-model-server' as discriminant.
 *
 * The schema mirrors upstream backstage/backstage#34476 exactly. When
 * that PR lands and adds ai-model-server as a specType on the upstream
 * API kind, a migration processor can convert AiModelServerAPI entities
 * into API entities with spec.type: 'ai-model-server'.
 *
 * @public
 */
export interface AiModelServerApiEntity extends Entity {
  kind: 'AiModelServerAPI';
  spec: {
    /** Must be 'ai-model-server'. */
    type: 'ai-model-server';
    /** The lifecycle state of the AI model server. */
    lifecycle: string;
    /** An entity reference to the owner of the AI model server. */
    owner: string;
    /** An entity reference to the system that the AI model server belongs to. */
    system?: string;
    /** The API contract type of the model server (e.g. openai-v1, anthropic). */
    serverType: string;
    /** Base URL of the model server inference endpoint. */
    serverUrl: string;
    /** Whether consumers need an API key to access this server. */
    requiresApiKey?: boolean;
    /** An entity reference to an API entity describing the server's REST contract. */
    apiEntityRef?: string;
    /** Information about models available on this server. */
    models?: {
      /** Whether the server exposes a model listing endpoint. */
      discoverable?: boolean;
      /** Static list of model identifiers available on this server. */
      available?: string[];
      /** Recommended default model identifier. */
      default?: string;
    };
  };
}
