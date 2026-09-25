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
  AI_CATALOG_ASSET_RESOURCE_TYPE,
  aiCatalogAssetAccessUsageDocsPermission,
} from './index';

describe('ai-catalog-common', () => {
  describe('resource types', () => {
    it('exports ai-catalog-asset resource type', () => {
      expect(AI_CATALOG_ASSET_RESOURCE_TYPE).toBe('ai-catalog-asset');
    });
  });

  describe('AI catalog permissions', () => {
    it('ai-catalog.asset.access.usage-docs has the correct name', () => {
      expect(aiCatalogAssetAccessUsageDocsPermission.name).toBe(
        'ai-catalog.asset.access.usage-docs',
      );
    });

    it('ai-catalog.asset.access.usage-docs has read action', () => {
      expect(aiCatalogAssetAccessUsageDocsPermission.attributes.action).toBe(
        'read',
      );
    });

    it('ai-catalog.asset.access.usage-docs is resource-scoped to ai-catalog-asset', () => {
      expect(aiCatalogAssetAccessUsageDocsPermission.resourceType).toBe(
        AI_CATALOG_ASSET_RESOURCE_TYPE,
      );
    });
  });

  describe('no deleted exports', () => {
    it('does not export removed types or permissions', () => {
      const exports = require('./index');
      const exportNames = Object.keys(exports);

      // Deleted types from types.ts
      expect(exportNames).not.toContain('BOOST_PLUGIN_ID');

      // Deleted permissions
      expect(exportNames).not.toContain('BOOST_AGENT_RESOURCE_TYPE');
      expect(exportNames).not.toContain('BOOST_TOOL_RESOURCE_TYPE');
      expect(exportNames).not.toContain('boostAgentPermissions');
      expect(exportNames).not.toContain('boostToolPermissions');
      expect(exportNames).not.toContain('boostEntityPermissions');
      expect(exportNames).not.toContain('boostFunctionalPermissions');
      expect(exportNames).not.toContain('boostPermissions');

      // Deleted ingestion-health types
      expect(exportNames).not.toContain('HealthStatus');
      expect(exportNames).not.toContain('ConnectorHealthStatus');
      expect(exportNames).not.toContain('SyncAttemptRecord');
    });

    it('does not export provider-specific configuration types', () => {
      const exports = require('./index');
      const exportNames = Object.keys(exports);
      const providerSpecificPatterns = [
        /Ogx/i,
        /Kagenti(?!Admin)/i,
        /ResponsesApi/i,
      ];
      for (const name of exportNames) {
        for (const pattern of providerSpecificPatterns) {
          expect(name).not.toMatch(pattern);
        }
      }
    });
  });
});
