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

/**
 * Backend plugin for the boost AI platform.
 *
 * @packageDocumentation
 */

export {
  boostPlugin as default,
  boostAiProviderServiceFactory,
} from './plugin';
export { ProviderManager } from './provider/ProviderManager';
export {
  authorizeLifecycleAction,
  validateSecurityMode,
  createAgentResourceLoader,
  createToolResourceLoader,
  type SecurityMode,
  type ResourceLoader,
  type AuthorizeLifecycleActionOptions,
} from './middleware/security';
export {
  AdminConfigService,
  RuntimeConfigResolver,
  boostConfigFields,
  BOOST_CONFIG_SCHEMA_VERSION,
  validateConfigValue,
  isDbWritable,
  isSensitiveField,
  type AdminConfigServiceOptions,
  type RuntimeConfigResolverOptions,
  type BoostConfigKey,
  type ConfigScope,
  type ConfigFieldMeta,
} from './config';
export {
  AgentLifecycleStore,
  isValidTransition,
  isDeletableStage,
  createAgentRoutes,
  type AgentLifecycleStoreOptions,
  type AgentRoutesOptions,
} from './agents';
export {
  ToolLifecycleStore,
  isValidToolTransition,
  createToolRoutes,
  type ToolLifecycleStoreOptions,
  type ToolRoutesOptions,
} from './tools';
export {
  createKagentiAdminRoutes,
  type KagentiAdminRoutesOptions,
} from './kagenti';
export {
  McpServerStore,
  createMcpServerRoutes,
  type McpServerStoreOptions,
  type McpServerRoutesOptions,
} from './mcp';
export {
  BackendApprovalStore,
  type BackendApprovalStoreOptions,
} from './approval';
export {
  createChatRoutes,
  ConversationAgentCache,
  ConversationRegistry,
  ConversationStore,
  createConversationRoutes,
  RateLimiter,
  type ChatRoutesOptions,
  type ConversationAgentCacheOptions,
  type ConversationRegistryOptions,
  type ConversationStoreOptions,
  type ConversationRoutesOptions,
  type RateLimiterOptions,
} from './chat';
