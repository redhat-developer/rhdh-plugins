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

import { createPermission } from '@backstage/plugin-permission-common';

// ---------------------------------------------------------------------------
// Resource types
// ---------------------------------------------------------------------------

/**
 * Resource type for AI catalog assets (models, agents, skills, MCP servers,
 * model servers).
 *
 * @public
 */
export const AI_CATALOG_ASSET_RESOURCE_TYPE = 'ai-catalog-asset';

// ---------------------------------------------------------------------------
// AI Catalog permissions
// ---------------------------------------------------------------------------

/**
 * Tier 2: sensitive details including usage documentation, connection
 * endpoints, and configuration. Resource-scoped to support CONDITIONAL
 * evaluation via RBAC conditional policies.
 *
 * @remarks
 * The permission name uses `access` rather than `read` per the naming
 * convention decided across the 2.1 permission work (see
 * {@link https://github.com/redhat-developer/rhdh-plugins/issues/4041 | issue #4041}).
 * The `attributes.action` remains `'read'` since that is a fixed
 * {@link @backstage/plugin-permission-common#PermissionAction | Backstage action enum}
 * value, unrelated to the permission name.
 *
 * @public
 */
export const aiCatalogAssetAccessUsageDocsPermission = createPermission({
  name: 'ai-catalog.asset.access.usage-docs',
  attributes: { action: 'read' },
  resourceType: AI_CATALOG_ASSET_RESOURCE_TYPE,
});
