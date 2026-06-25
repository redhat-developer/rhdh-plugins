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

import type { LoggerService } from '@backstage/backend-plugin-api';
import type { ResponsesApiCoordinator } from './ResponsesApiCoordinator';
import type { PromptCapabilities } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import {
  DEFAULT_EMBEDDING_DIMENSION,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_MODEL,
} from '../../constants';
import { buildMetaPrompt } from './promptGeneration';

export interface ModelsCache {
  data: Array<{ id: string; owned_by?: string; model_type?: string }>;
  expiresAt: number;
}

export const MODELS_CACHE_TTL_MS = 60_000;

export async function listModels(
  orchestrator: ResponsesApiCoordinator,
  cache: { current: ModelsCache | null },
): Promise<Array<{ id: string; owned_by?: string; model_type?: string }>> {
  if (cache.current && Date.now() < cache.current.expiresAt) {
    return cache.current.data;
  }

  const client = orchestrator.getClientManager().getExistingClient();
  const response = await client.request<{
    data: Array<{
      id: string;
      object?: string;
      owned_by?: string;
      model_type?: string;
      custom_metadata?: Record<string, unknown>;
    }>;
  }>('/v1/models', { method: 'GET' });

  const models = (response.data || [])
    .filter(m => typeof m.id === 'string' && m.id.length > 0)
    .map(m => {
      const modelType =
        m.model_type ?? (m.custom_metadata?.model_type as string | undefined);
      return {
        id: m.id,
        ...(m.owned_by ? { owned_by: m.owned_by } : {}),
        ...(modelType ? { model_type: modelType } : {}),
      };
    });

  cache.current = {
    data: models,
    expiresAt: Date.now() + MODELS_CACHE_TTL_MS,
  };

  return models;
}

export async function testModel(
  orchestrator: ResponsesApiCoordinator,
  modelOverride?: string,
): Promise<{
  connected: boolean;
  modelFound: boolean;
  canGenerate: boolean;
  error?: string;
}> {
  let models: Array<{ id: string }>;
  try {
    const client = orchestrator.getClientManager().getExistingClient();
    const response = await client.request<{
      data: Array<{ id: string }>;
    }>('/v1/models', { method: 'GET' });
    models = response.data || [];
  } catch (err) {
    return {
      connected: false,
      modelFound: false,
      canGenerate: false,
      error: err instanceof Error ? err.message : 'Connection failed',
    };
  }

  const resolver = orchestrator.getResolver();
  const config = resolver ? await resolver.resolve() : null;
  const targetModel = modelOverride || config?.model;

  if (!targetModel) {
    return {
      connected: true,
      modelFound: false,
      canGenerate: false,
      error: 'No model configured',
    };
  }

  const modelFound = models.some(m => m.id === targetModel);
  if (!modelFound) {
    return {
      connected: true,
      modelFound: false,
      canGenerate: false,
      error: `Model "${targetModel}" not found on server`,
    };
  }

  const inferenceResult = await runMinimalInference(orchestrator, targetModel);
  return {
    connected: true,
    modelFound: true,
    canGenerate: inferenceResult.canGenerate,
    ...(inferenceResult.error ? { error: inferenceResult.error } : {}),
  };
}

async function runMinimalInference(
  orchestrator: ResponsesApiCoordinator,
  model: string,
): Promise<{ canGenerate: boolean; error?: string }> {
  const client = orchestrator.getClientManager().getExistingClient();
  try {
    const response = await client.request<{
      output: Array<{
        type: string;
        content?: Array<{ type: string; text?: string }>;
      }>;
      usage?: { output_tokens?: number };
    }>('/v1/responses', {
      method: 'POST',
      body: JSON.stringify({ input: 'Hi', model, store: false }),
    });

    const outputTokens = response.usage?.output_tokens ?? 0;
    const hasText = response.output?.some(
      item =>
        item.type === 'message' &&
        item.content?.some(b => b.type === 'output_text' && b.text),
    );

    return {
      canGenerate: hasText || outputTokens > 0,
      ...(!hasText && outputTokens === 0
        ? { error: 'Model returned 0 output tokens' }
        : {}),
    };
  } catch (err) {
    return {
      canGenerate: false,
      error: err instanceof Error ? err.message : 'Inference failed',
    };
  }
}

export async function generateSystemPrompt(
  orchestrator: ResponsesApiCoordinator,
  description: string,
  modelOverride?: string,
  capabilities?: PromptCapabilities,
  _logger?: LoggerService,
): Promise<string> {
  const resolver = orchestrator.getResolver();
  const config = resolver ? await resolver.resolve() : null;

  const { instructions, input } = buildMetaPrompt(
    description,
    config ?? {
      model: 'unknown',
      baseUrl: '',
      systemPrompt: '',
      vectorStoreIds: [],
      vectorStoreName: 'default-vector-store',
      embeddingModel: DEFAULT_EMBEDDING_MODEL,
      embeddingDimension: DEFAULT_EMBEDDING_DIMENSION,
      chunkingStrategy: 'auto',
      maxChunkSizeTokens: DEFAULT_CHUNK_SIZE,
      chunkOverlapTokens: 50,
      enableWebSearch: false,
      enableCodeInterpreter: false,
      skipTlsVerify: false,
      zdrMode: false,
      verboseStreamLogging: false,
    },
    capabilities,
  );

  const client = orchestrator.getClientManager().getExistingClient();
  const model = modelOverride || config?.model || DEFAULT_MODEL;

  const response = await client.request<{
    output: Array<{
      type: string;
      content?: Array<{ type: string; text?: string }>;
    }>;
  }>('/v1/responses', {
    method: 'POST',
    body: JSON.stringify({
      input,
      instructions,
      model,
      store: false,
    }),
  });

  for (const item of response.output) {
    if (item.type === 'message' && item.content) {
      for (const block of item.content) {
        if (block.type === 'output_text' && block.text) {
          return block.text.trim();
        }
      }
    }
  }

  throw new Error('LLM returned no text in the response');
}
