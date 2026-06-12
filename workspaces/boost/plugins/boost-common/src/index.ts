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
 * The plugin ID for the boost plugin.
 *
 * @public
 */
export const BOOST_PLUGIN_ID = 'boost';

export type {
  AgenticProvider,
  ProviderDescriptor,
  ProviderCapabilities,
  NormalizedStreamEvent,
  ConversationSummary,
  ConversationDetails,
  InputItem,
} from './types';

export { boostAiProviderServiceRef } from './services';

export type { BoostAgentPermission, BoostToolPermission } from './permissions';

export {
  // Resource types
  RESOURCE_TYPE_BOOST_AGENT,
  RESOURCE_TYPE_BOOST_TOOL,
  // Agent lifecycle permissions
  boostAgentListPermission,
  boostAgentRegisterPermission,
  boostAgentPromotePermission,
  boostAgentApprovePermission,
  boostAgentDemotePermission,
  boostAgentPublishPermission,
  boostAgentUnpublishPermission,
  boostAgentWithdrawPermission,
  boostAgentDeletePermission,
  boostAgentConfigurePermission,
  // Tool lifecycle permissions
  boostToolPromotePermission,
  boostToolApprovePermission,
  boostToolDemotePermission,
  boostToolPublishPermission,
  boostToolUnpublishPermission,
  // Infrastructure permission
  boostKagentiAdminPermission,
  // Functional permissions
  boostChatReadPermission,
  boostChatCreatePermission,
  boostDocumentsManagePermission,
  boostMcpManagePermission,
  boostConfigManagePermission,
  // Access and admin
  boostAccessPermission,
  boostAdminPermission,
  // Conditional rule names
  BOOST_RULE_IS_OWNER,
  BOOST_RULE_IS_NOT_CREATOR,
  BOOST_RULE_HAS_LIFECYCLE_STAGE,
  // Aggregated lists
  boostResourcePermissions,
  boostFunctionalPermissions,
  boostPermissions,
} from './permissions';
