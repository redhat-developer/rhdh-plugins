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
import {
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { toErrorMessage } from '../../../services/utils';
import {
  DEFAULT_CHUNK_OVERLAP,
  DEFAULT_CHUNK_SIZE,
  DEFAULT_EMBEDDING_DIMENSION,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_VECTOR_STORE_NAME,
} from '../../../constants';
import { loadBrandingOverrides as loadBrandingOverridesFromModule } from './BrandingConfigLoader';
import {
  loadMcpAuthConfigs as loadMcpAuthConfigsFromModule,
  loadMcpServerConfigs as loadMcpServerConfigsFromModule,
} from './McpConfigLoader';
import {
  AgentConfig,
  LlamaStackConfig,
  DocumentsConfig,
  MCPAuthConfig,
  MCPServerConfig,
  SecurityConfig,
  SecurityMode,
  OAuthClientConfig,
  Workflow,
  QuickAction,
  PromptGroup,
} from '../../../types';
import type { ServerCapabilityOverrides } from './ServerCapabilities';
import {
  parseTruncation,
  parseToolChoiceConfig,
  parseReasoningConfig,
  parseToolScopingConfig,
  parseHybridSearchConfig,
  parseDocumentSources,
} from './ConfigParsers';
import { parseAgentConfigs } from './AgentConfigParser';
import {
  loadWorkflows,
  loadQuickActions,
  loadPromptGroups,
} from './UiConfigLoader';

export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly configPath: string,
  ) {
    super(`Configuration error at '${configPath}': ${message}`);
    this.name = 'ConfigValidationError';
  }
}

export class ConfigLoader {
  private readonly config: RootConfigService;
  private readonly logger: LoggerService;
  private cachedAgentConfigs:
    | {
        agents: Record<string, AgentConfig>;
        defaultAgent: string;
        maxAgentTurns?: number;
      }
    | undefined
    | null = null;

  constructor(config: RootConfigService, logger: LoggerService) {
    this.config = config;
    this.logger = logger;
  }

  validateRequiredConfig(): void {
    const errors: string[] = [];
    if (!this.config.has('augment.llamaStack')) {
      errors.push("Missing required config section 'augment.llamaStack'");
    } else {
      if (!this.config.has('augment.llamaStack.baseUrl'))
        errors.push("Missing 'augment.llamaStack.baseUrl'");
      if (!this.config.has('augment.llamaStack.model'))
        errors.push("Missing 'augment.llamaStack.model'");
    }
    if (errors.length > 0) {
      this.logger.error(
        `Augment configuration validation failed: ${errors.join('; ')}`,
      );
      throw new ConfigValidationError(errors.join('; '), 'augment');
    }
    this.logger.info('Augment configuration validated successfully');
  }

  loadLlamaStackConfig(): LlamaStackConfig {
    const ls = this.config.getConfig('augment.llamaStack');
    let vectorStoreIds: string[] = [];
    const arr = ls.getOptionalStringArray('vectorStoreIds');
    if (arr && arr.length > 0) {
      vectorStoreIds = arr;
    } else {
      const single = ls.getOptionalString('vectorStoreId');
      if (single) vectorStoreIds = [single];
    }
    const vectorStoreName =
      ls.getOptionalString('vectorStoreName') || DEFAULT_VECTOR_STORE_NAME;
    this.logger.info(`RAG vector store name: "${vectorStoreName}"`);
    const { searchMode, bm25Weight, semanticWeight } = parseHybridSearchConfig(
      ls,
      this.logger,
    );
    return {
      baseUrl: ls.getString('baseUrl'),
      vectorStoreIds,
      vectorStoreName,
      embeddingModel:
        ls.getOptionalString('embeddingModel') || DEFAULT_EMBEDDING_MODEL,
      embeddingDimension:
        ls.getOptionalNumber('embeddingDimension') ||
        DEFAULT_EMBEDDING_DIMENSION,
      searchMode,
      bm25Weight,
      semanticWeight,
      model: ls.getString('model'),
      token: ls.getOptionalString('token'),
      chunkingStrategy:
        (ls.getOptionalString('chunkingStrategy') as 'auto' | 'static') ||
        'auto',
      maxChunkSizeTokens:
        ls.getOptionalNumber('maxChunkSizeTokens') || DEFAULT_CHUNK_SIZE,
      chunkOverlapTokens:
        ls.getOptionalNumber('chunkOverlapTokens') || DEFAULT_CHUNK_OVERLAP,
      skipTlsVerify: ls.getOptionalBoolean('skipTlsVerify') ?? false,
      verboseStreamLogging:
        ls.getOptionalBoolean('verboseStreamLogging') ?? false,
      toolChoice: parseToolChoiceConfig(ls),
      parallelToolCalls: ls.getOptionalBoolean('parallelToolCalls'),
      textFormat: ls.getOptional('textFormat') as
        | LlamaStackConfig['textFormat']
        | undefined,
      functions: ls.getOptional('functions') as
        | LlamaStackConfig['functions']
        | undefined,
      zdrMode: ls.getOptionalBoolean('zdrMode') ?? false,
      enableWebSearch: ls.getOptionalBoolean('enableWebSearch') ?? false,
      enableCodeInterpreter:
        ls.getOptionalBoolean('enableCodeInterpreter') ?? false,
      fileSearchMaxResults:
        ls.getOptionalNumber('fileSearchMaxResults') || undefined,
      fileSearchScoreThreshold:
        ls.getOptionalNumber('fileSearchScoreThreshold') || undefined,
      reasoning: parseReasoningConfig(ls, this.logger),
      toolScoping: parseToolScopingConfig(ls, this.logger),
      maxToolCalls: ls.getOptionalNumber('maxToolCalls') || undefined,
      maxOutputTokens: ls.getOptionalNumber('maxOutputTokens') || undefined,
      temperature: ls.getOptionalNumber('temperature') ?? undefined,
      safetyIdentifier: ls.getOptionalString('safetyIdentifier') || undefined,
      truncation: parseTruncation(ls.getOptionalString('truncation')),
    };
  }

  loadSecurityConfig(): SecurityConfig {
    const securityMode =
      (this.config.getOptionalString(
        'augment.security.mode',
      ) as SecurityMode) || 'plugin-only';
    const accessDeniedMessage = this.config.getOptionalString(
      'augment.security.accessDeniedMessage',
    );
    let mcpOAuth: OAuthClientConfig | undefined;
    const mcpOAuthConfig = this.config.getOptionalConfig(
      'augment.security.mcpOAuth',
    );
    if (mcpOAuthConfig) {
      mcpOAuth = {
        tokenUrl: mcpOAuthConfig.getString('tokenUrl'),
        clientId: mcpOAuthConfig.getString('clientId'),
        clientSecret: mcpOAuthConfig.getString('clientSecret'),
        scopes: mcpOAuthConfig.getOptionalStringArray('scopes') || ['openid'],
      };
    }
    if (securityMode === 'full' && !mcpOAuth) {
      this.logger.warn(
        `Security mode 'full' requires mcpOAuth. Falling back to 'plugin-only'.`,
      );
      return { mode: 'plugin-only', accessDeniedMessage };
    }
    return { mode: securityMode, accessDeniedMessage, mcpOAuth };
  }

  loadDocumentsConfig(): DocumentsConfig | null {
    try {
      const dc = this.config.getOptionalConfig('augment.documents');
      if (!dc) return null;
      const syncMode =
        (dc.getOptionalString('syncMode') as 'full' | 'append') || 'append';
      const syncSchedule = dc.getOptionalString('syncSchedule');
      const sourcesConfig = dc.getOptionalConfigArray('sources');
      if (!sourcesConfig || sourcesConfig.length === 0) return null;
      return {
        syncMode,
        syncSchedule,
        sources: parseDocumentSources(sourcesConfig, this.logger),
      };
    } catch (error) {
      this.logger.warn(
        `Failed to load documents configuration: ${toErrorMessage(error)}. Document sync will be disabled.`,
      );
      return null;
    }
  }

  loadMcpAuthConfigs(): Map<string, MCPAuthConfig> {
    return loadMcpAuthConfigsFromModule(this.config, this.logger);
  }
  loadMcpServerConfigs(): MCPServerConfig[] {
    return loadMcpServerConfigsFromModule(
      this.config,
      this.logger,
      this.loadMcpAuthConfigs(),
    );
  }
  loadWorkflows(): Workflow[] {
    return loadWorkflows(this.config, this.logger);
  }
  loadQuickActions(): QuickAction[] {
    return loadQuickActions(this.config, this.logger);
  }
  loadPromptGroups(): PromptGroup[] {
    return loadPromptGroups(this.config, this.logger);
  }

  loadGuardrailShieldIds(): string[] | undefined {
    try {
      const sc = this.config.getOptionalConfig('augment.safety');
      if (!sc || sc.getOptionalBoolean('enabled') !== true) return undefined;
      const merged = [
        ...new Set([
          ...(sc.getOptionalStringArray('inputShields') ?? []),
          ...(sc.getOptionalStringArray('outputShields') ?? []),
        ]),
      ];
      return merged.length > 0 ? merged : undefined;
    } catch {
      return undefined;
    }
  }

  loadPostToolInstructions(): string | undefined {
    return (
      this.config.getOptionalString('augment.postToolInstructions') || undefined
    );
  }

  loadToolExecutionMode(): 'direct' | 'backend' {
    const mode = this.config.getOptionalString('augment.toolExecutionMode');
    if (!mode) return 'backend';
    const n = mode.trim().toLowerCase();
    if (n === 'backend') return 'backend';
    if (n !== 'direct')
      this.logger.warn(
        `Invalid toolExecutionMode '${mode}' — falling back to 'direct'.`,
      );
    return 'direct';
  }

  loadServerCapabilities(): ServerCapabilityOverrides | undefined {
    const cc = this.config.getOptionalConfig('augment.serverCapabilities');
    if (!cc) return undefined;
    const o: ServerCapabilityOverrides = {};
    const b = (k: string) => cc.getOptionalBoolean(k);
    const ft = b('functionTools');
    const sf = b('strictField');
    const mo = b('maxOutputTokens');
    const mt = b('mcpTools');
    const pt = b('parallelToolCalls');
    if (ft !== undefined) o.functionTools = ft;
    if (sf !== undefined) o.strictField = sf;
    if (mo !== undefined) o.maxOutputTokens = mo;
    if (mt !== undefined) o.mcpTools = mt;
    if (pt !== undefined) o.parallelToolCalls = pt;
    if (Object.keys(o).length === 0) return undefined;
    this.logger.info(
      `[ConfigLoader] Server capability overrides: ${JSON.stringify(o)}`,
    );
    return o;
  }

  loadSystemPrompt(): string {
    const p = this.config.getOptionalString('augment.systemPrompt');
    if (!p)
      this.logger.warn(
        'No augment.systemPrompt configured - model will use default behavior',
      );
    return p || '';
  }

  loadAgentConfigs():
    | {
        agents: Record<string, AgentConfig>;
        defaultAgent: string;
        maxAgentTurns?: number;
      }
    | undefined {
    if (this.cachedAgentConfigs !== null) return this.cachedAgentConfigs;
    const result = parseAgentConfigs(this.config, this.logger);
    this.cachedAgentConfigs = result;
    return result;
  }

  loadBrandingOverrides(): Partial<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').BrandingConfig
  > {
    return loadBrandingOverridesFromModule(this.config, this.logger);
  }
}
