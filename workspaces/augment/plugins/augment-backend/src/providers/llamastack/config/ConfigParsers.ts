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
import type { Config } from '@backstage/config';
import type {
  LlamaStackConfig,
  ReasoningConfig,
  ToolScopingConfig,
  AllowedToolSpec,
  DocumentSource,
} from '../../../types';

export function parseTruncation(
  value: string | undefined,
): 'auto' | 'disabled' | undefined {
  if (value === 'auto' || value === 'disabled') return value;
  return undefined;
}

export function parseToolChoiceConfig(
  config: Config,
): LlamaStackConfig['toolChoice'] {
  const toolChoiceConfig = config.getOptional('toolChoice');
  if (!toolChoiceConfig) return undefined;
  if (typeof toolChoiceConfig === 'string')
    return toolChoiceConfig as 'auto' | 'required' | 'none';
  if (typeof toolChoiceConfig === 'object' && toolChoiceConfig !== null) {
    const configObj = toolChoiceConfig as Record<string, unknown>;
    if (configObj.type === 'function' && typeof configObj.name === 'string')
      return { type: 'function', name: configObj.name };
    if (configObj.type === 'allowed_tools' && Array.isArray(configObj.tools))
      return {
        type: 'allowed_tools',
        mode: (configObj.mode as 'auto' | 'required') || 'auto',
        tools: configObj.tools as AllowedToolSpec[],
      };
  }
  return undefined;
}

export function parseReasoningConfig(
  config: Config,
  logger: LoggerService,
): ReasoningConfig | undefined {
  const raw = config.getOptional('reasoning');
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    const effort = raw as ReasoningConfig['effort'];
    if (effort === 'low' || effort === 'medium' || effort === 'high')
      return { effort };
    logger.warn(`Invalid reasoning effort value: "${raw}", ignoring`);
    return undefined;
  }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const result: ReasoningConfig = {};
    const effort = obj.effort as string | undefined;
    if (effort === 'low' || effort === 'medium' || effort === 'high')
      result.effort = effort;
    const summary = obj.summary as string | undefined;
    if (
      summary === 'auto' ||
      summary === 'concise' ||
      summary === 'detailed' ||
      summary === 'none'
    )
      result.summary = summary;
    if (Object.keys(result).length > 0) {
      logger.info(
        `Reasoning config: effort=${result.effort ?? 'default'}, summary=${result.summary ?? 'default'}`,
      );
      return result;
    }
  }
  return undefined;
}

export function parseToolScopingConfig(
  config: Config,
  logger: LoggerService,
): ToolScopingConfig | undefined {
  const raw = config.getOptional('toolScoping');
  if (!raw || typeof raw !== 'object') return undefined;
  const obj = raw as Record<string, unknown>;
  const enabled = typeof obj.enabled === 'boolean' ? obj.enabled : false;
  const maxToolsPerTurn =
    typeof obj.maxToolsPerTurn === 'number'
      ? obj.maxToolsPerTurn
      : Number.MAX_SAFE_INTEGER;
  const activationThreshold =
    typeof obj.activationThreshold === 'number' ? obj.activationThreshold : 10;
  const minScore = typeof obj.minScore === 'number' ? obj.minScore : 0.1;
  if (enabled)
    logger.info(
      `Tool scoping enabled: maxToolsPerTurn=${maxToolsPerTurn}, activationThreshold=${activationThreshold}, minScore=${minScore}`,
    );
  return { enabled, maxToolsPerTurn, activationThreshold, minScore };
}

export function parseHybridSearchConfig(
  config: Config,
  logger: LoggerService,
): {
  searchMode: 'semantic' | 'keyword' | 'hybrid' | undefined;
  bm25Weight: number | undefined;
  semanticWeight: number | undefined;
} {
  const searchMode = config.getOptionalString('searchMode') as
    | 'semantic'
    | 'keyword'
    | 'hybrid'
    | undefined;
  const bm25Weight = config.getOptionalNumber('bm25Weight');
  const semanticWeight = config.getOptionalNumber('semanticWeight');
  if (searchMode === 'hybrid')
    logger.info(
      `Hybrid search enabled: bm25Weight=${bm25Weight ?? 0.5}, semanticWeight=${semanticWeight ?? 0.5}`,
    );
  return { searchMode, bm25Weight, semanticWeight };
}

export function parseDocumentSources(
  sourcesConfig: Config[],
  logger: LoggerService,
): DocumentSource[] {
  const sources: DocumentSource[] = [];
  for (const sourceConfig of sourcesConfig) {
    const type = sourceConfig.getString('type') as
      | 'directory'
      | 'url'
      | 'github';
    switch (type) {
      case 'directory':
        sources.push({
          type: 'directory',
          path: sourceConfig.getString('path'),
          patterns: sourceConfig.getOptionalStringArray('patterns'),
        });
        break;
      case 'url':
        sources.push({
          type: 'url',
          urls: sourceConfig.getStringArray('urls'),
          headers: sourceConfig.getOptional('headers') as
            | Record<string, string>
            | undefined,
        });
        break;
      case 'github':
        sources.push({
          type: 'github',
          repo: sourceConfig.getString('repo'),
          branch: sourceConfig.getOptionalString('branch'),
          path: sourceConfig.getOptionalString('path'),
          patterns: sourceConfig.getOptionalStringArray('patterns'),
          token: sourceConfig.getOptionalString('token'),
        });
        break;
      default:
        logger.warn(`Unknown document source type: ${type}`);
    }
  }
  return sources;
}
