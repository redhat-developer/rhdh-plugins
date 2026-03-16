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
  ProviderType,
  ProviderDescriptor,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

/**
 * Built-in provider descriptors shipped with the plugin.
 *
 * External providers are registered at runtime via the
 * {@link augmentProviderExtensionPoint} and stored in
 * `dynamicProviders` below.
 *
 * @internal
 */
const BUILT_IN_PROVIDERS: ReadonlyMap<string, ProviderDescriptor> = new Map<
  string,
  ProviderDescriptor
>([
  [
    'llamastack',
    {
      id: 'llamastack',
      displayName: 'Llama Stack',
      description:
        'Meta Llama Stack -- open-source AI inference and agentic platform',
      implemented: true,
      capabilities: {
        chat: true,
        rag: true,
        safety: true,
        evaluation: true,
        conversations: true,
        mcpTools: true,
      },
      configFields: [
        {
          key: 'model',
          label: 'Model',
          type: 'string',
          required: true,
          description: 'LLM model identifier on the inference server',
          placeholder: 'meta-llama/Llama-3.3-8B-Instruct',
        },
        {
          key: 'baseUrl',
          label: 'Server URL',
          type: 'string',
          required: true,
          description: 'Base URL of the Llama Stack server',
          placeholder: 'http://localhost:8321',
        },
        {
          key: 'toolChoice',
          label: 'Tool Choice',
          type: 'select',
          required: false,
          description: 'How the model should use tools',
          options: ['auto', 'required', 'none'],
        },
        {
          key: 'enableWebSearch',
          label: 'Web Search',
          type: 'boolean',
          required: false,
          description: 'Enable built-in web search tool',
        },
        {
          key: 'enableCodeInterpreter',
          label: 'Code Interpreter',
          type: 'boolean',
          required: false,
          description: 'Enable built-in code interpreter tool',
        },
      ],
    },
  ],
  [
    'googleadk',
    {
      id: 'googleadk',
      displayName: 'Google ADK',
      description:
        'Google Agent Development Kit -- build agents with Gemini models',
      implemented: false,
      capabilities: {
        chat: true,
        rag: false,
        safety: false,
        evaluation: false,
        conversations: true,
        mcpTools: true,
      },
      configFields: [],
    },
  ],
]);

/**
 * Dynamically registered provider descriptors from extension modules.
 * Populated at startup via {@link registerProvider}.
 */
const dynamicProviders = new Map<string, ProviderDescriptor>();

/**
 * Backwards-compatible alias for the combined registry.
 * Consumers that reference `PROVIDER_REGISTRY` continue to work.
 *
 * @internal
 */
export const PROVIDER_REGISTRY: ReadonlyMap<string, ProviderDescriptor> =
  BUILT_IN_PROVIDERS;

/**
 * Register an external provider descriptor.
 *
 * Called during plugin initialization by extension modules.
 * Throws if the provider ID conflicts with a built-in provider.
 *
 * @param descriptor - The provider descriptor to register
 * @internal
 */
export function registerProvider(descriptor: ProviderDescriptor): void {
  if (BUILT_IN_PROVIDERS.has(descriptor.id)) {
    throw new Error(
      `Cannot register provider "${descriptor.id}": conflicts with a built-in provider`,
    );
  }
  dynamicProviders.set(descriptor.id, descriptor);
}

/**
 * Get a provider descriptor by ID.
 *
 * Searches built-in providers first, then dynamically registered ones.
 *
 * @param id - The provider type identifier
 * @returns The descriptor, or `undefined` if not found
 * @internal
 */
export function getProviderDescriptor(
  id: ProviderType,
): ProviderDescriptor | undefined {
  return BUILT_IN_PROVIDERS.get(id) ?? dynamicProviders.get(id);
}

/**
 * Get all provider descriptors as an array, sorted by display name.
 *
 * Includes both built-in and dynamically registered providers.
 *
 * @returns All known provider descriptors
 * @internal
 */
export function getAllProviderDescriptors(): readonly ProviderDescriptor[] {
  return [...BUILT_IN_PROVIDERS.values(), ...dynamicProviders.values()].sort(
    (a, b) => a.displayName.localeCompare(b.displayName),
  );
}

/**
 * Check whether a provider type ID is valid (exists in the registry).
 *
 * @param id - The string to check
 * @returns `true` if the ID maps to a known provider
 * @internal
 */
export function isValidProviderType(id: string): id is ProviderType {
  return BUILT_IN_PROVIDERS.has(id) || dynamicProviders.has(id);
}
