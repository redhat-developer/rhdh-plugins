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
import { InputError } from '@backstage/errors';
import type { AdminConfigKey } from '@red-hat-developer-hub/backstage-plugin-augment-common';
import {
  MAX_BRANDING_FIELD_LENGTH,
  MAX_CONFIG_VALUE_SIZE,
  MAX_MODEL_LENGTH,
  MAX_SYSTEM_PROMPT_LENGTH,
} from '../../constants';
import { isPrivateUrl } from './SsrfGuard';

function assertSizeLimit(value: unknown, key: string): void {
  const serialized = JSON.stringify(value);
  if (serialized && serialized.length > MAX_CONFIG_VALUE_SIZE) {
    throw new InputError(
      `${key} value is too large (${serialized.length} chars, max ${MAX_CONFIG_VALUE_SIZE})`,
    );
  }
}

function validatePromptGroups(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new InputError('promptGroups must be an array');
  }
  for (const group of value) {
    if (!group || typeof group !== 'object' || Array.isArray(group)) {
      throw new InputError('Each prompt group must be an object');
    }
    const g = group as Record<string, unknown>;
    if (typeof g.id !== 'string' || g.id.trim().length === 0) {
      throw new InputError('Each prompt group must have a non-empty id');
    }
    if (typeof g.title !== 'string' || g.title.trim().length === 0) {
      throw new InputError('Each prompt group must have a non-empty title');
    }
    if (!Array.isArray(g.cards)) {
      throw new InputError(`Prompt group "${g.id}" must have a cards array`);
    }
    for (const card of g.cards as unknown[]) {
      if (!card || typeof card !== 'object' || Array.isArray(card)) {
        throw new InputError(
          `Each card in prompt group "${g.id}" must be an object`,
        );
      }
      const c = card as Record<string, unknown>;
      if (typeof c.title !== 'string' || c.title.trim().length === 0) {
        throw new InputError(
          `Each card in prompt group "${g.id}" must have a non-empty title`,
        );
      }
      if (typeof c.prompt !== 'string') {
        throw new InputError(
          `Each card in prompt group "${g.id}" must have a prompt string`,
        );
      }
    }
  }
  assertSizeLimit(value, 'promptGroups');
}

function validateAgents(value: unknown): void {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new InputError('agents must be a non-null object');
  }
  const agents = value as Record<string, unknown>;
  for (const [key, agentVal] of Object.entries(agents)) {
    if (
      typeof agentVal !== 'object' ||
      agentVal === null ||
      Array.isArray(agentVal)
    ) {
      throw new InputError(`Agent "${key}" must be a non-null object`);
    }
    const agent = agentVal as Record<string, unknown>;
    if (typeof agent.name !== 'string' || agent.name.trim().length === 0) {
      throw new InputError(`Agent "${key}" must have a non-empty name`);
    }
    if (
      typeof agent.instructions !== 'string' ||
      agent.instructions.trim().length === 0
    ) {
      throw new InputError(`Agent "${key}" must have non-empty instructions`);
    }
    const arrayFields = [
      'handoffs',
      'asTools',
      'mcpServers',
      'vectorStoreIds',
    ] as const;
    for (const field of arrayFields) {
      if (agent[field] !== undefined) {
        if (!Array.isArray(agent[field])) {
          throw new InputError(`Agent "${key}".${field} must be an array`);
        }
        for (const item of agent[field] as unknown[]) {
          if (typeof item !== 'string') {
            throw new InputError(
              `Agent "${key}".${field} must contain only strings`,
            );
          }
        }
      }
    }
    const boolFields = [
      'enableRAG',
      'enableWebSearch',
      'enableCodeInterpreter',
    ] as const;
    for (const field of boolFields) {
      if (agent[field] !== undefined && typeof agent[field] !== 'boolean') {
        throw new InputError(`Agent "${key}".${field} must be a boolean`);
      }
    }
  }

  // Graph-level validation: handoff/asTools targets must reference
  // agents that exist within the same save payload.
  const keys = new Set(Object.keys(agents));
  for (const [key, agentVal] of Object.entries(agents)) {
    const agent = agentVal as Record<string, unknown>;

    if (Array.isArray(agent.handoffs)) {
      for (const target of agent.handoffs as string[]) {
        if (!keys.has(target)) {
          throw new InputError(
            `Agent "${key}" has handoff to "${target}" which does not exist ` +
              `in the saved agents. Available: [${[...keys].join(', ')}]`,
          );
        }
      }
    }

    if (Array.isArray(agent.asTools)) {
      for (const target of agent.asTools as string[]) {
        if (!keys.has(target)) {
          throw new InputError(
            `Agent "${key}" has asTools reference to "${target}" which does ` +
              `not exist in the saved agents. Available: [${[...keys].join(', ')}]`,
          );
        }
      }
    }
  }

  assertSizeLimit(value, 'agents');
}

const VALIDATORS: Partial<Record<AdminConfigKey, (value: unknown) => void>> = {
  agents: validateAgents,
  promptGroups: validatePromptGroups,

  baseUrl: value => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new InputError('baseUrl must be a non-empty string');
    }
    try {
      const url = new URL(value);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new InputError('baseUrl must start with http:// or https://');
      }
    } catch (err) {
      if (err instanceof InputError) throw err;
      throw new InputError(`baseUrl must be a valid URL: ${value}`);
    }
    const ssrfReason = isPrivateUrl(value);
    if (ssrfReason) {
      throw new InputError(
        `baseUrl must not point to a private/internal address (${ssrfReason})`,
      );
    }
  },

  model: value => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new InputError('model must be a non-empty string');
    }
    if (value.length > MAX_MODEL_LENGTH) {
      throw new InputError(
        `model must be at most ${MAX_MODEL_LENGTH} characters`,
      );
    }
  },

  systemPrompt: value => {
    if (typeof value !== 'string') {
      throw new InputError('systemPrompt must be a string');
    }
    if (value.length > MAX_SYSTEM_PROMPT_LENGTH) {
      throw new InputError(
        `systemPrompt must be at most ${MAX_SYSTEM_PROMPT_LENGTH} characters`,
      );
    }
  },

  toolChoice: value => {
    if (typeof value === 'string') {
      if (!['auto', 'required', 'none'].includes(value)) {
        throw new InputError(
          'toolChoice must be "auto", "required", "none", or a {type, name} object',
        );
      }
      return;
    }
    if (typeof value === 'object' && value !== null) {
      const obj = value as Record<string, unknown>;
      if (obj.type === 'function' && typeof obj.name === 'string') {
        return;
      }
      if (obj.type === 'allowed_tools' && Array.isArray(obj.tools)) {
        return;
      }
    }
    throw new InputError(
      'toolChoice must be "auto", "required", "none", or a valid tool choice object',
    );
  },

  enableWebSearch: value => {
    if (typeof value !== 'boolean') {
      throw new InputError('enableWebSearch must be a boolean');
    }
  },

  enableCodeInterpreter: value => {
    if (typeof value !== 'boolean') {
      throw new InputError('enableCodeInterpreter must be a boolean');
    }
  },

  branding: value => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new InputError('branding must be a non-null object');
    }
    const b = value as Record<string, unknown>;

    const HEX = /^#[0-9a-fA-F]{6}$/;
    const colorFields = [
      'primaryColor',
      'secondaryColor',
      'successColor',
      'warningColor',
      'errorColor',
      'infoColor',
    ];
    for (const field of colorFields) {
      if (b[field] !== undefined) {
        if (typeof b[field] !== 'string' || !HEX.test(b[field] as string)) {
          throw new InputError(
            `branding.${field} must be a valid hex color (e.g. #1e40af)`,
          );
        }
      }
    }

    const stringFields = [
      'appName',
      'tagline',
      'inputPlaceholder',
      'logoUrl',
      'faviconUrl',
      'themePreset',
    ];
    for (const field of stringFields) {
      if (b[field] !== undefined) {
        if (typeof b[field] !== 'string') {
          throw new InputError(`branding.${field} must be a string`);
        }
        if ((b[field] as string).length > MAX_BRANDING_FIELD_LENGTH) {
          throw new InputError(
            `branding.${field} must be at most ${MAX_BRANDING_FIELD_LENGTH} characters`,
          );
        }
      }
    }

    const urlFields = ['logoUrl', 'faviconUrl'] as const;
    for (const field of urlFields) {
      if (b[field] !== undefined && typeof b[field] === 'string') {
        const url = b[field] as string;
        if (url.length > 0) {
          try {
            const parsed = new URL(url);
            if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
              throw new InputError(
                `branding.${field} must use http:// or https:// protocol`,
              );
            }
          } catch (err) {
            if (err instanceof InputError) throw err;
            throw new InputError(
              `branding.${field} must be a valid URL: ${url}`,
            );
          }
        }
      }
    }

    const allowedKeys = new Set([...colorFields, ...stringFields]);
    for (const key of Object.keys(b)) {
      if (!allowedKeys.has(key)) {
        throw new InputError(`branding contains unknown key: "${key}"`);
      }
    }

    assertSizeLimit(value, 'branding');
  },

  safetyPatterns: value => {
    if (!Array.isArray(value)) {
      throw new InputError('safetyPatterns must be an array of strings');
    }
    for (const item of value) {
      if (typeof item !== 'string') {
        throw new InputError('Each safety pattern must be a string');
      }
    }
  },

  safetyEnabled: value => {
    if (typeof value !== 'boolean') {
      throw new InputError('safetyEnabled must be a boolean');
    }
  },

  inputShields: value => {
    if (!Array.isArray(value)) {
      throw new InputError('inputShields must be an array of strings');
    }
    for (const item of value) {
      if (typeof item !== 'string' || item.trim().length === 0) {
        throw new InputError('Each input shield must be a non-empty string');
      }
    }
  },

  outputShields: value => {
    if (!Array.isArray(value)) {
      throw new InputError('outputShields must be an array of strings');
    }
    for (const item of value) {
      if (typeof item !== 'string' || item.trim().length === 0) {
        throw new InputError('Each output shield must be a non-empty string');
      }
    }
  },

  evaluationEnabled: value => {
    if (typeof value !== 'boolean') {
      throw new InputError('evaluationEnabled must be a boolean');
    }
  },

  scoringFunctions: value => {
    if (!Array.isArray(value)) {
      throw new InputError('scoringFunctions must be an array of strings');
    }
    for (const item of value) {
      if (typeof item !== 'string' || item.trim().length === 0) {
        throw new InputError(
          'Each scoring function must be a non-empty string',
        );
      }
    }
  },

  minScoreThreshold: value => {
    if (typeof value !== 'number') {
      throw new InputError('minScoreThreshold must be a number');
    }
    if (value < 0 || value > 1) {
      throw new InputError('minScoreThreshold must be between 0 and 1');
    }
  },

  safetyOnError: value => {
    if (value !== 'allow' && value !== 'block') {
      throw new InputError('safetyOnError must be "allow" or "block"');
    }
  },

  evaluationOnError: value => {
    if (value !== 'skip' && value !== 'fail') {
      throw new InputError('evaluationOnError must be "skip" or "fail"');
    }
  },

  vectorStoreConfig: value => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new InputError('vectorStoreConfig must be a non-null object');
    }
    const v = value as Record<string, unknown>;
    if (v.embeddingModel !== undefined) {
      if (typeof v.embeddingModel !== 'string') {
        throw new InputError(
          'vectorStoreConfig.embeddingModel must be a string',
        );
      }
      if (v.embeddingModel.trim().length === 0) {
        throw new InputError(
          'vectorStoreConfig.embeddingModel must be a non-empty string',
        );
      }
    }
    if (v.embeddingDimension !== undefined) {
      if (
        typeof v.embeddingDimension !== 'number' ||
        !Number.isFinite(v.embeddingDimension)
      ) {
        throw new InputError(
          'vectorStoreConfig.embeddingDimension must be a finite number',
        );
      }
      if (v.embeddingDimension <= 0) {
        throw new InputError(
          'vectorStoreConfig.embeddingDimension must be a positive number',
        );
      }
    }
    if (
      v.searchMode !== undefined &&
      v.searchMode !== 'semantic' &&
      v.searchMode !== 'keyword' &&
      v.searchMode !== 'hybrid'
    ) {
      throw new InputError(
        'vectorStoreConfig.searchMode must be "semantic", "keyword", or "hybrid"',
      );
    }
    if (
      v.chunkingStrategy !== undefined &&
      v.chunkingStrategy !== 'auto' &&
      v.chunkingStrategy !== 'static'
    ) {
      throw new InputError(
        'vectorStoreConfig.chunkingStrategy must be "auto" or "static"',
      );
    }
    const numericFields: Array<{
      name: string;
      min?: number;
      max?: number;
    }> = [
      { name: 'bm25Weight', min: 0, max: 1 },
      { name: 'semanticWeight', min: 0, max: 1 },
      { name: 'maxChunkSizeTokens', min: 1 },
      { name: 'chunkOverlapTokens', min: 0 },
      { name: 'fileSearchMaxResults', min: 1 },
      { name: 'fileSearchScoreThreshold', min: 0, max: 1 },
    ];
    for (const { name, min, max } of numericFields) {
      if (v[name] !== undefined) {
        if (typeof v[name] !== 'number') {
          throw new InputError(`vectorStoreConfig.${name} must be a number`);
        }
        const num = v[name] as number;
        if (min !== undefined && num < min) {
          throw new InputError(
            `vectorStoreConfig.${name} must be at least ${min}`,
          );
        }
        if (max !== undefined && num > max) {
          throw new InputError(
            `vectorStoreConfig.${name} must be at most ${max}`,
          );
        }
      }
    }
    if (v.vectorStoreName !== undefined) {
      if (typeof v.vectorStoreName !== 'string') {
        throw new InputError(
          'vectorStoreConfig.vectorStoreName must be a string',
        );
      }
      if (v.vectorStoreName.trim().length === 0) {
        throw new InputError(
          'vectorStoreConfig.vectorStoreName must be a non-empty string',
        );
      }
    }
  },

  activeVectorStoreIds: value => {
    if (!Array.isArray(value)) {
      throw new InputError('activeVectorStoreIds must be an array of strings');
    }
    for (const item of value) {
      if (typeof item !== 'string' || item.trim().length === 0) {
        throw new InputError(
          'Each activeVectorStoreIds entry must be a non-empty string',
        );
      }
    }
  },

  disabledMcpServerIds: value => {
    if (!Array.isArray(value)) {
      throw new InputError('disabledMcpServerIds must be an array');
    }
    for (const item of value) {
      if (typeof item !== 'string' || item.trim().length === 0) {
        throw new InputError(
          'Each disabledMcpServerIds entry must be a non-empty string',
        );
      }
    }
    const unique = new Set(value);
    if (unique.size !== value.length) {
      throw new InputError('disabledMcpServerIds must not contain duplicates');
    }
  },

  mcpServers: value => {
    if (!Array.isArray(value)) {
      throw new InputError('mcpServers must be an array');
    }
    const seenIds = new Set<string>();
    for (const server of value) {
      if (!server || typeof server !== 'object') {
        throw new InputError('Each MCP server must be an object');
      }
      const s = server as Record<string, unknown>;
      if (typeof s.id !== 'string' || s.id.trim().length === 0) {
        throw new InputError('Each MCP server must have a non-empty id');
      }
      if (seenIds.has(s.id)) {
        throw new InputError(`Duplicate MCP server id: "${s.id}"`);
      }
      seenIds.add(s.id);
      if (typeof s.name !== 'string' || s.name.trim().length === 0) {
        throw new InputError('Each MCP server must have a non-empty name');
      }
      if (typeof s.url !== 'string' || s.url.trim().length === 0) {
        throw new InputError('Each MCP server must have a non-empty url');
      }
      try {
        const parsed = new URL(s.url);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          throw new InputError(
            `MCP server "${s.id}" url must start with http:// or https://`,
          );
        }
      } catch (err) {
        if (err instanceof InputError) throw err;
        throw new InputError(
          `MCP server "${s.id}" url must be a valid URL: ${s.url}`,
        );
      }
      const ssrfReason = isPrivateUrl(s.url as string);
      if (ssrfReason) {
        throw new InputError(
          `MCP server "${s.id}" url must not point to a private/internal address (${ssrfReason})`,
        );
      }
      if (
        s.requireApproval !== undefined &&
        s.requireApproval !== 'always' &&
        s.requireApproval !== 'never'
      ) {
        throw new InputError(
          `MCP server "${s.id}" requireApproval must be "always" or "never"`,
        );
      }
    }

    assertSizeLimit(value, 'mcpServers');
  },
};

/**
 * Validates values before they are persisted via AdminConfigService.
 * Returns normally on success, throws InputError on failure.
 */
export function validateAdminConfigValue(
  key: AdminConfigKey,
  value: unknown,
): void {
  const validator = VALIDATORS[key];
  if (validator) {
    validator(value);
  }
}
