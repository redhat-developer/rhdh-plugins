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
import type { Config } from '@backstage/config';
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
  AllowedToolSpec,
  LlamaStackConfig,
  ReasoningConfig,
  ToolChoiceConfig,
  ToolScopingConfig,
  DocumentsConfig,
  DocumentSource,
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

/**
 * Configuration validation error
 * Thrown when required configuration is missing or invalid
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public readonly configPath: string,
  ) {
    super(`Configuration error at '${configPath}': ${message}`);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Configuration loader for Augment
 *
 * Parses all configuration from app-config.yaml including:
 * - Llama Stack connection settings
 * - Document sources
 * - MCP server configurations
 * - Security settings
 * - Workflows and quick actions
 *
 * Configuration validation:
 * - Required fields are validated at load time with clear error messages
 * - Optional fields return sensible defaults
 * - All config loading errors are logged with context
 */
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

  /**
   * Validate that the minimum required configuration is present.
   * Call this during plugin initialization to fail fast with clear errors.
   * @throws ConfigValidationError if required config is missing
   */
  validateRequiredConfig(): void {
    const errors: string[] = [];

    // Check for augment.llamaStack section
    if (!this.config.has('augment.llamaStack')) {
      errors.push("Missing required config section 'augment.llamaStack'");
    } else {
      // Check for required fields within llamaStack
      if (!this.config.has('augment.llamaStack.baseUrl')) {
        errors.push("Missing required config 'augment.llamaStack.baseUrl'");
      }
      if (!this.config.has('augment.llamaStack.model')) {
        errors.push("Missing required config 'augment.llamaStack.model'");
      }
    }

    if (errors.length > 0) {
      const errorMessage = errors.join('; ');
      this.logger.error(
        `Augment configuration validation failed: ${errorMessage}`,
      );
      throw new ConfigValidationError(errorMessage, 'augment');
    }

    this.logger.info('Augment configuration validated successfully');
  }

  /**
   * Load Llama Stack configuration from app-config
   * Supports both single vectorStoreId (backward compat) and vectorStoreIds array
   * If no vectorStoreId is configured, will auto-create using vectorStoreName
   */
  loadLlamaStackConfig(): LlamaStackConfig {
    const llamaStackConfig = this.config.getConfig('augment.llamaStack');

    // Support both single vectorStoreId (backward compat) and vectorStoreIds array
    let vectorStoreIds: string[] = [];
    const vectorStoreIdsArray =
      llamaStackConfig.getOptionalStringArray('vectorStoreIds');
    if (vectorStoreIdsArray && vectorStoreIdsArray.length > 0) {
      vectorStoreIds = vectorStoreIdsArray;
    } else {
      // Backward compatibility: single vectorStoreId
      const singleId = llamaStackConfig.getOptionalString('vectorStoreId');
      if (singleId) {
        vectorStoreIds = [singleId];
      }
    }

    // vectorStoreIds can be empty - will auto-create during ensureVectorStoreExists()

    const toolChoice = this.parseToolChoiceConfig(llamaStackConfig);

    // vectorStoreName is the canonical identifier for the vector store.
    // Used as fallback when vectorStoreIds are not provided.
    // Defaults to 'augment-knowledge-base' if not configured.
    const vectorStoreName =
      llamaStackConfig.getOptionalString('vectorStoreName') ||
      DEFAULT_VECTOR_STORE_NAME;
    this.logger.info(`RAG vector store name: "${vectorStoreName}"`);

    const { searchMode, bm25Weight, semanticWeight } =
      this.parseHybridSearchConfig(llamaStackConfig);

    return {
      baseUrl: llamaStackConfig.getString('baseUrl'),
      vectorStoreIds,
      vectorStoreName, // Required - will throw if not configured
      embeddingModel:
        llamaStackConfig.getOptionalString('embeddingModel') ||
        DEFAULT_EMBEDDING_MODEL,
      embeddingDimension:
        llamaStackConfig.getOptionalNumber('embeddingDimension') ||
        DEFAULT_EMBEDDING_DIMENSION,
      searchMode,
      bm25Weight,
      semanticWeight,
      model: llamaStackConfig.getString('model'),
      token: llamaStackConfig.getOptionalString('token'),
      chunkingStrategy:
        (llamaStackConfig.getOptionalString('chunkingStrategy') as
          | 'auto'
          | 'static') || 'auto',
      maxChunkSizeTokens:
        llamaStackConfig.getOptionalNumber('maxChunkSizeTokens') ||
        DEFAULT_CHUNK_SIZE,
      chunkOverlapTokens:
        llamaStackConfig.getOptionalNumber('chunkOverlapTokens') ||
        DEFAULT_CHUNK_OVERLAP,
      skipTlsVerify:
        llamaStackConfig.getOptionalBoolean('skipTlsVerify') ?? false, // Default false (secure by default)
      verboseStreamLogging:
        llamaStackConfig.getOptionalBoolean('verboseStreamLogging') ?? false, // Default false (minimal logging)
      toolChoice, // Pass through to Responses API
      parallelToolCalls:
        llamaStackConfig.getOptionalBoolean('parallelToolCalls'), // undefined = API default (true)
      textFormat: llamaStackConfig.getOptional('textFormat') as
        | LlamaStackConfig['textFormat']
        | undefined, // Structured output format
      functions: llamaStackConfig.getOptional('functions') as
        | LlamaStackConfig['functions']
        | undefined, // Custom function definitions
      zdrMode: llamaStackConfig.getOptionalBoolean('zdrMode') ?? false, // Zero Data Retention mode
      enableWebSearch:
        llamaStackConfig.getOptionalBoolean('enableWebSearch') ?? false,
      enableCodeInterpreter:
        llamaStackConfig.getOptionalBoolean('enableCodeInterpreter') ?? false,
      fileSearchMaxResults:
        llamaStackConfig.getOptionalNumber('fileSearchMaxResults') || undefined,
      fileSearchScoreThreshold:
        llamaStackConfig.getOptionalNumber('fileSearchScoreThreshold') ||
        undefined,
      reasoning: this.parseReasoningConfig(llamaStackConfig),
      toolScoping: this.parseToolScopingConfig(llamaStackConfig),
      maxToolCalls:
        llamaStackConfig.getOptionalNumber('maxToolCalls') || undefined,
      maxOutputTokens:
        llamaStackConfig.getOptionalNumber('maxOutputTokens') || undefined,
      temperature:
        llamaStackConfig.getOptionalNumber('temperature') ?? undefined,
      safetyIdentifier:
        llamaStackConfig.getOptionalString('safetyIdentifier') || undefined,
      truncation: this.parseTruncation(
        llamaStackConfig.getOptionalString('truncation'),
      ),
    };
  }

  private parseTruncation(
    value: string | undefined,
  ): 'auto' | 'disabled' | undefined {
    if (value === 'auto' || value === 'disabled') return value;
    return undefined;
  }

  /**
   * Load security configuration from app-config
   * Defaults to 'plugin-only' mode if not configured
   */
  loadSecurityConfig(): SecurityConfig {
    const securityMode =
      (this.config.getOptionalString(
        'augment.security.mode',
      ) as SecurityMode) || 'plugin-only';

    const accessDeniedMessage = this.config.getOptionalString(
      'augment.security.accessDeniedMessage',
    );

    // Load mcpOAuth for 'full' mode
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

    // Validate configuration based on mode
    if (securityMode === 'full' && !mcpOAuth) {
      this.logger.warn(
        `Security mode 'full' requires mcpOAuth configuration. Falling back to 'plugin-only' mode.`,
      );
      return {
        mode: 'plugin-only',
        accessDeniedMessage,
      };
    }

    return {
      mode: securityMode,
      accessDeniedMessage,
      mcpOAuth,
    };
  }

  /**
   * Load documents configuration from app-config
   */
  loadDocumentsConfig(): DocumentsConfig | null {
    try {
      const documentsConfig =
        this.config.getOptionalConfig('augment.documents');
      if (!documentsConfig) {
        return null;
      }

      const syncMode =
        (documentsConfig.getOptionalString('syncMode') as 'full' | 'append') ||
        'append';
      const syncSchedule = documentsConfig.getOptionalString('syncSchedule');

      const sourcesConfig = documentsConfig.getOptionalConfigArray('sources');
      if (!sourcesConfig || sourcesConfig.length === 0) {
        return null;
      }

      const sources = this.parseDocumentSources(sourcesConfig);

      return {
        syncMode,
        syncSchedule,
        sources,
      };
    } catch (error) {
      // Log the actual error for debugging, not just a generic message
      const errorMsg = toErrorMessage(error);
      this.logger.warn(
        `Failed to load documents configuration: ${errorMsg}. Document sync will be disabled.`,
      );
      return null;
    }
  }

  /**
   * Load named MCP auth configurations from app-config
   */
  loadMcpAuthConfigs(): Map<string, MCPAuthConfig> {
    return loadMcpAuthConfigsFromModule(this.config, this.logger);
  }

  /**
   * Load MCP server configurations from app-config
   */
  loadMcpServerConfigs(): MCPServerConfig[] {
    return loadMcpServerConfigsFromModule(
      this.config,
      this.logger,
      this.loadMcpAuthConfigs(),
    );
  }

  /**
   * Load workflows from app-config
   */
  loadWorkflows(): Workflow[] {
    try {
      const workflowsConfig =
        this.config.getOptionalConfigArray('augment.workflows');
      if (!workflowsConfig || workflowsConfig.length === 0) {
        return [];
      }

      return workflowsConfig.map(wf => ({
        id: wf.getString('id'),
        name: wf.getString('name'),
        description: wf.getOptionalString('description') || '',
        icon: wf.getOptionalString('icon'),
        category: wf.getOptionalString('category'),
        comingSoon: wf.getOptionalBoolean('comingSoon'),
        comingSoonLabel: wf.getOptionalString('comingSoonLabel'),
        steps: (wf.getOptionalConfigArray('steps') || []).map(step => ({
          title: step.getString('title'),
          prompt: step.getString('prompt'),
          description: step.getOptionalString('description'),
        })),
      }));
    } catch (error) {
      const errorMsg = toErrorMessage(error);
      this.logger.warn(`Failed to load workflows: ${errorMsg}`);
      return [];
    }
  }

  /**
   * Load quick actions from app-config (maps from quickPrompts for compatibility)
   */
  loadQuickActions(): QuickAction[] {
    try {
      const quickPromptsConfig = this.config.getOptionalConfigArray(
        'augment.quickPrompts',
      );
      if (!quickPromptsConfig || quickPromptsConfig.length === 0) {
        return [];
      }

      return quickPromptsConfig.map(qp => ({
        title: qp.getString('title'),
        description: qp.getOptionalString('description'),
        prompt: qp.getString('prompt'),
        icon: qp.getOptionalString('icon'),
        category: qp.getOptionalString('category'),
        comingSoon: qp.getOptionalBoolean('comingSoon'),
        comingSoonLabel: qp.getOptionalString('comingSoonLabel'),
      }));
    } catch (error) {
      const errorMsg = toErrorMessage(error);
      this.logger.warn(`Failed to load quick prompts: ${errorMsg}`);
      return [];
    }
  }

  /**
   * Load prompt groups from app-config (grouped prompt cards for the welcome screen).
   * Sorted by the optional 'order' field (lower numbers first).
   * If 'order' is not specified, the array index order from config is preserved.
   *
   * Reads from `augment.promptGroups` in app-config.yaml.
   */
  loadPromptGroups(): PromptGroup[] {
    try {
      const groupsConfig = this.config.getOptionalConfigArray(
        'augment.promptGroups',
      );
      if (!groupsConfig || groupsConfig.length === 0) {
        return [];
      }

      const groups = groupsConfig.map((sl, index) => {
        const cardsConfig = sl.getOptionalConfigArray('cards') || [];
        return {
          id: sl.getString('id'),
          title: sl.getString('title'),
          description: sl.getOptionalString('description'),
          icon: sl.getOptionalString('icon'),
          color: sl.getOptionalString('color'),
          order: sl.getOptionalNumber('order') ?? index + 1,
          cards: cardsConfig.map(card => ({
            title: card.getString('title'),
            description: card.getOptionalString('description'),
            prompt: card.getString('prompt'),
            icon: card.getOptionalString('icon'),
            comingSoon: card.getOptionalBoolean('comingSoon'),
            comingSoonLabel: card.getOptionalString('comingSoonLabel'),
          })),
        };
      });

      return groups.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    } catch (error) {
      const errorMsg = toErrorMessage(error);
      this.logger.warn(`Failed to load prompt groups: ${errorMsg}`);
      return [];
    }
  }

  /**
   * Load guardrail shield IDs from the safety config section.
   * Returns the unique union of inputShields and outputShields,
   * which are passed to the Responses API `guardrails` field
   * for server-side enforcement.
   */
  loadGuardrailShieldIds(): string[] | undefined {
    try {
      const safetyConfig = this.config.getOptionalConfig('augment.safety');
      if (!safetyConfig) return undefined;
      if (safetyConfig.getOptionalBoolean('enabled') !== true) return undefined;

      const input = safetyConfig.getOptionalStringArray('inputShields') ?? [];
      const output = safetyConfig.getOptionalStringArray('outputShields') ?? [];
      const merged = [...new Set([...input, ...output])];
      return merged.length > 0 ? merged : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Load post-tool instructions from YAML config.
   * Falls back to undefined so the caller can use the default.
   */
  loadPostToolInstructions(): string | undefined {
    return (
      this.config.getOptionalString('augment.postToolInstructions') || undefined
    );
  }

  /**
   * Load the tool execution mode from app-config.
   * - 'backend' (default): Backstage executes MCP tools on behalf of LlamaStack via the official SDK.
   * - 'direct': LlamaStack connects to MCP servers directly (requires network access).
   */
  loadToolExecutionMode(): 'direct' | 'backend' {
    const mode = this.config.getOptionalString('augment.toolExecutionMode');
    if (!mode) return 'backend';
    const normalized = mode.trim().toLowerCase();
    if (normalized === 'backend') return 'backend';
    if (normalized !== 'direct') {
      this.logger.warn(
        `Invalid toolExecutionMode '${mode}' — falling back to 'direct'. Valid values: 'direct', 'backend'`,
      );
    }
    return 'direct';
  }

  /**
   * Load server capability overrides from app-config.
   * Returns undefined when no overrides are configured, so that
   * version-based defaults take effect.
   */
  loadServerCapabilities(): ServerCapabilityOverrides | undefined {
    const capsConfig = this.config.getOptionalConfig(
      'augment.serverCapabilities',
    );
    if (!capsConfig) return undefined;

    const overrides: ServerCapabilityOverrides = {};
    const boolOpt = (key: string) => capsConfig.getOptionalBoolean(key);

    const functionTools = boolOpt('functionTools');
    const strictField = boolOpt('strictField');
    const maxOutputTokens = boolOpt('maxOutputTokens');
    const mcpTools = boolOpt('mcpTools');
    const parallelToolCalls = boolOpt('parallelToolCalls');

    if (functionTools !== undefined) overrides.functionTools = functionTools;
    if (strictField !== undefined) overrides.strictField = strictField;
    if (maxOutputTokens !== undefined)
      overrides.maxOutputTokens = maxOutputTokens;
    if (mcpTools !== undefined) overrides.mcpTools = mcpTools;
    if (parallelToolCalls !== undefined)
      overrides.parallelToolCalls = parallelToolCalls;

    if (Object.keys(overrides).length === 0) return undefined;

    this.logger.info(
      `[ConfigLoader] Server capability overrides: ${JSON.stringify(overrides)}`,
    );
    return overrides;
  }

  /**
   * Load system prompt from app-config
   */
  loadSystemPrompt(): string {
    const configuredPrompt = this.config.getOptionalString(
      'augment.systemPrompt',
    );
    if (!configuredPrompt) {
      this.logger.warn(
        'No augment.systemPrompt configured - model will use default behavior',
      );
    }
    return configuredPrompt || '';
  }

  /**
   * Load multi-agent configuration from app-config.yaml.
   * Returns undefined if no agents are configured (single-agent mode).
   */
  loadAgentConfigs():
    | {
        agents: Record<string, AgentConfig>;
        defaultAgent: string;
        maxAgentTurns?: number;
      }
    | undefined {
    if (this.cachedAgentConfigs !== null) {
      return this.cachedAgentConfigs;
    }

    const result = this.parseAgentConfigs();
    this.cachedAgentConfigs = result;
    return result;
  }

  private parseAgentConfigs():
    | {
        agents: Record<string, AgentConfig>;
        defaultAgent: string;
        maxAgentTurns?: number;
      }
    | undefined {
    const agentsRaw = this.config.getOptional('augment.agents') as
      | Record<string, unknown>
      | undefined;
    if (!agentsRaw || typeof agentsRaw !== 'object') {
      return undefined;
    }

    const agents: Record<string, AgentConfig> = {};

    for (const [key, value] of Object.entries(agentsRaw)) {
      const agent = this.parseSingleAgent(key, value);
      if (agent) {
        agents[key] = agent;
      }
    }

    if (Object.keys(agents).length === 0) {
      this.logger.info('[MultiAgent] No valid agent definitions found');
      return undefined;
    }

    const defaultAgent =
      (this.config.getOptionalString('augment.defaultAgent') as string) ||
      Object.keys(agents)[0];

    const maxAgentTurns = this.config.getOptionalNumber(
      'augment.maxAgentTurns',
    );

    this.logger.info(
      `[MultiAgent] Loaded ${Object.keys(agents).length} agent(s): [${Object.keys(agents).join(', ')}], default="${defaultAgent}", maxTurns=${maxAgentTurns ?? 'unlimited'}`,
    );

    return { agents, defaultAgent, maxAgentTurns };
  }

  private asStringArray(val: unknown): string[] | undefined {
    return Array.isArray(val) ? (val as string[]) : undefined;
  }

  private parseSingleAgent(
    key: string,
    value: unknown,
  ): AgentConfig | undefined {
    if (!value || typeof value !== 'object') {
      this.logger.warn(`[MultiAgent] Skipping invalid agent config: "${key}"`);
      return undefined;
    }
    const raw = value as Record<string, unknown>;

    if (typeof raw.name !== 'string' || typeof raw.instructions !== 'string') {
      this.logger.warn(
        `[MultiAgent] Agent "${key}" missing required 'name' or 'instructions', skipping`,
      );
      return undefined;
    }

    this.warnIfNotArray(raw, key, 'mcpServers');
    this.warnIfNotArray(raw, key, 'handoffs');
    this.warnIfNotArray(raw, key, 'asTools');
    this.warnIfNotArray(raw, key, 'vectorStoreIds');

    return {
      name: raw.name,
      instructions: raw.instructions,
      handoffDescription: raw.handoffDescription as string | undefined,
      model: raw.model as string | undefined,
      mcpServers: this.asStringArray(raw.mcpServers),
      handoffs: this.asStringArray(raw.handoffs),
      asTools: this.asStringArray(raw.asTools),
      enableRAG: raw.enableRAG as boolean | undefined,
      vectorStoreIds: this.asStringArray(raw.vectorStoreIds),
      enableWebSearch: raw.enableWebSearch as boolean | undefined,
      enableCodeInterpreter: raw.enableCodeInterpreter as boolean | undefined,
      functions: raw.functions as AgentConfig['functions'] | undefined,
      toolChoice: raw.toolChoice as ToolChoiceConfig | undefined,
      reasoning: raw.reasoning as AgentConfig['reasoning'] | undefined,
      inheritSystemPrompt: raw.inheritSystemPrompt as boolean | undefined,
      handoffInputSchema: raw.handoffInputSchema as
        | Record<string, unknown>
        | undefined,
      handoffInputFilter: raw.handoffInputFilter as
        | AgentConfig['handoffInputFilter']
        | undefined,
      toolUseBehavior: raw.toolUseBehavior as
        | AgentConfig['toolUseBehavior']
        | undefined,
      outputSchema: raw.outputSchema as AgentConfig['outputSchema'] | undefined,
      enabled: raw.enabled as boolean | undefined,
      toolGuardrails: Array.isArray(raw.toolGuardrails)
        ? (raw.toolGuardrails as AgentConfig['toolGuardrails'])
        : undefined,
      guardrails: this.asStringArray(raw.guardrails),
      maxToolCalls:
        typeof raw.maxToolCalls === 'number' ? raw.maxToolCalls : undefined,
      maxOutputTokens:
        typeof raw.maxOutputTokens === 'number'
          ? raw.maxOutputTokens
          : undefined,
      temperature:
        typeof raw.temperature === 'number' ? raw.temperature : undefined,
      truncation: this.parseTruncation(raw.truncation as string | undefined),
      publishAs: (() => {
        if (raw.publishAs === undefined) return undefined;
        if (
          typeof raw.publishAs === 'string' &&
          ['router', 'specialist', 'standalone'].includes(raw.publishAs)
        ) {
          return raw.publishAs as 'router' | 'specialist' | 'standalone';
        }
        this.logger.warn(
          `[MultiAgent] Agent "${key}": publishAs must be "router", "specialist", or "standalone", got "${String(raw.publishAs)}". Ignoring.`,
        );
        return undefined;
      })(),
    };
  }

  private warnIfNotArray(
    raw: Record<string, unknown>,
    key: string,
    field: string,
  ): void {
    if (raw[field] && !Array.isArray(raw[field])) {
      this.logger.warn(
        `[MultiAgent] Agent "${key}": ${field} should be an array, got ${typeof raw[field]}. Ignoring.`,
      );
    }
  }

  /**
   * Load branding overrides from app-config.yaml (augment.branding).
   * Returns only the fields explicitly set in YAML; consumers merge
   * with DEFAULT_BRANDING to get a complete BrandingConfig.
   */
  loadBrandingOverrides(): Partial<
    import('@red-hat-developer-hub/backstage-plugin-augment-common').BrandingConfig
  > {
    return loadBrandingOverridesFromModule(this.config, this.logger);
  }

  /**
   * Parse toolChoice config - can be string or object.
   * @internal
   */
  private parseToolChoiceConfig(
    config: Config,
  ): LlamaStackConfig['toolChoice'] {
    const toolChoiceConfig = config.getOptional('toolChoice');
    if (!toolChoiceConfig) {
      return undefined;
    }
    if (typeof toolChoiceConfig === 'string') {
      return toolChoiceConfig as 'auto' | 'required' | 'none';
    }
    if (typeof toolChoiceConfig === 'object' && toolChoiceConfig !== null) {
      const configObj = toolChoiceConfig as Record<string, unknown>;
      if (configObj.type === 'function' && typeof configObj.name === 'string') {
        return { type: 'function', name: configObj.name };
      }
      if (
        configObj.type === 'allowed_tools' &&
        Array.isArray(configObj.tools)
      ) {
        return {
          type: 'allowed_tools',
          mode: (configObj.mode as 'auto' | 'required') || 'auto',
          tools: configObj.tools as AllowedToolSpec[],
        };
      }
    }
    return undefined;
  }

  /**
   * Parse reasoning config from llamaStack config.
   * Supports both shorthand (effort-only string) and full object form.
   * @internal
   */
  private parseReasoningConfig(config: Config): ReasoningConfig | undefined {
    const raw = config.getOptional('reasoning');
    if (!raw) return undefined;

    if (typeof raw === 'string') {
      const effort = raw as ReasoningConfig['effort'];
      if (effort === 'low' || effort === 'medium' || effort === 'high') {
        return { effort };
      }
      this.logger.warn(`Invalid reasoning effort value: "${raw}", ignoring`);
      return undefined;
    }

    if (typeof raw === 'object' && raw !== null) {
      const obj = raw as Record<string, unknown>;
      const result: ReasoningConfig = {};

      const effort = obj.effort as string | undefined;
      if (effort === 'low' || effort === 'medium' || effort === 'high') {
        result.effort = effort;
      }

      const summary = obj.summary as string | undefined;
      if (
        summary === 'auto' ||
        summary === 'concise' ||
        summary === 'detailed' ||
        summary === 'none'
      ) {
        result.summary = summary;
      }

      if (Object.keys(result).length > 0) {
        this.logger.info(
          `Reasoning config: effort=${result.effort ?? 'default'}, summary=${
            result.summary ?? 'default'
          }`,
        );
        return result;
      }
    }

    return undefined;
  }

  /**
   * Parse tool scoping configuration.
   * @internal
   */
  private parseToolScopingConfig(
    config: Config,
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
      typeof obj.activationThreshold === 'number'
        ? obj.activationThreshold
        : 10;
    const minScore = typeof obj.minScore === 'number' ? obj.minScore : 0.1;

    if (enabled) {
      this.logger.info(
        `Tool scoping enabled: maxToolsPerTurn=${maxToolsPerTurn}, activationThreshold=${activationThreshold}, minScore=${minScore}`,
      );
    }

    return { enabled, maxToolsPerTurn, activationThreshold, minScore };
  }

  /**
   * Parse hybrid search configuration from llamaStack config.
   * @internal
   */
  private parseHybridSearchConfig(config: Config): {
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

    if (searchMode === 'hybrid') {
      this.logger.info(
        `Hybrid search enabled: bm25Weight=${
          bm25Weight ?? 0.5
        }, semanticWeight=${semanticWeight ?? 0.5}`,
      );
    }

    return { searchMode, bm25Weight, semanticWeight };
  }

  /**
   * Parse document sources from sources config array.
   * @internal
   */
  private parseDocumentSources(sourcesConfig: Config[]): DocumentSource[] {
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
          this.logger.warn(`Unknown document source type: ${type}`);
      }
    }

    return sources;
  }
}
