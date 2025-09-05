/*
 * Copyright The Backstage Authors
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

import { DynamicPluginInfo } from '../api';
import {
  getReadableName,
  getBasePluginName,
  processPluginsForDisplay,
  getUniquePluginsCount,
} from './pluginProcessing';

describe('pluginProcessing', () => {
  describe('getReadableName', () => {
    it('should handle Red Hat Developer Hub plugins', () => {
      expect(
        getReadableName(
          '@red-hat-developer-hub/backstage-plugin-marketplace-dynamic',
        ),
      ).toBe('Marketplace');
      expect(
        getReadableName(
          '@red-hat-developer-hub/backstage-plugin-global-header-dynamic',
        ),
      ).toBe('Global Header');
      expect(
        getReadableName(
          '@red-hat-developer-hub/backstage-plugin-quickstart-dynamic',
        ),
      ).toBe('Quickstart');
    });

    it('should handle Red Hat Developer Hub plugins with backend suffix', () => {
      expect(
        getReadableName(
          '@red-hat-developer-hub/backstage-plugin-marketplace-backend-dynamic',
        ),
      ).toBe('Marketplace');
    });

    it('should handle Red Hat Developer Hub display names with spaces', () => {
      expect(
        getReadableName('@Red Hat Developer Hub/Backstage Plugin Marketplace'),
      ).toBe('Marketplace');
      expect(
        getReadableName('@Red Hat Developer Hub/Backstage Plugin Quickstart'),
      ).toBe('Quickstart');
      expect(
        getReadableName(
          '@Red Hat Developer Hub/Backstage Plugin Dynamic Home Page',
        ),
      ).toBe('Dynamic Home Page');
    });

    it('should handle community plugins', () => {
      expect(getReadableName('@backstage-community/plugin-acr-dynamic')).toBe(
        'Acr',
      );
      expect(
        getReadableName(
          'backstage-community-plugin-analytics-provider-segment',
        ),
      ).toBe('Analytics Provider Segment');
    });

    it('should handle official Backstage plugins', () => {
      expect(getReadableName('@backstage/plugin-catalog-backend')).toBe(
        'Catalog',
      );
      expect(getReadableName('backstage-plugin-kubernetes')).toBe('Kubernetes');
    });

    it('should remove various suffixes', () => {
      expect(getReadableName('some-plugin-dynamic')).toBe('Some Plugin');
      expect(getReadableName('some-plugin-backend')).toBe('Some Plugin');
      expect(getReadableName('some-plugin-frontend')).toBe('Some Plugin');
    });

    it('should handle edge cases', () => {
      expect(getReadableName('')).toBe('');
      expect(getReadableName('simple-name')).toBe('Simple Name');
      expect(getReadableName('already-capitalized-name')).toBe(
        'Already Capitalized Name',
      );
    });
  });

  describe('getBasePluginName', () => {
    it('should normalize Red Hat Developer Hub plugins for deduplication', () => {
      expect(
        getBasePluginName(
          '@red-hat-developer-hub/backstage-plugin-marketplace-dynamic',
        ),
      ).toBe('marketplace');
      expect(
        getBasePluginName(
          '@red-hat-developer-hub/backstage-plugin-marketplace-backend-dynamic',
        ),
      ).toBe('marketplace');
      expect(
        getBasePluginName(
          '@red-hat-developer-hub/backstage-plugin-global-header-dynamic',
        ),
      ).toBe('global-header');
    });

    it('should normalize display names to base names', () => {
      expect(
        getBasePluginName(
          '@Red Hat Developer Hub/Backstage Plugin Marketplace',
        ),
      ).toBe('marketplace');
      expect(
        getBasePluginName(
          '@Red Hat Developer Hub/Backstage Plugin Dynamic Home Page',
        ),
      ).toBe('dynamic-home-page');
    });

    it('should handle community plugins', () => {
      expect(getBasePluginName('@backstage-community/plugin-acr-dynamic')).toBe(
        'acr',
      );
      expect(
        getBasePluginName(
          'backstage-community-plugin-analytics-provider-segment',
        ),
      ).toBe('analytics-provider-segment');
    });

    it('should remove frontend/backend suffixes for proper grouping', () => {
      expect(getBasePluginName('some-plugin-frontend')).toBe('some-plugin');
      expect(getBasePluginName('some-plugin-backend')).toBe('some-plugin');
      expect(getBasePluginName('some-plugin-dynamic')).toBe('some-plugin');
    });
  });

  describe('processPluginsForDisplay', () => {
    const mockPlugins: DynamicPluginInfo[] = [
      {
        name: '@red-hat-developer-hub/backstage-plugin-marketplace-dynamic',
        version: '0.9.2',
        role: 'frontend-plugin',
        platform: 'web',
      },
      {
        name: '@red-hat-developer-hub/backstage-plugin-marketplace-backend-dynamic',
        version: '0.8.0',
        role: 'backend-plugin',
        platform: 'node',
      },
      {
        name: '@red-hat-developer-hub/backstage-plugin-global-header-dynamic',
        version: '1.15.1',
        role: 'frontend-plugin',
        platform: 'web',
      },
      {
        name: '@backstage-community/plugin-acr-dynamic',
        version: '1.12.1',
        role: 'frontend-plugin',
        platform: 'web',
      },
    ];

    it('should deduplicate plugins with frontend/backend variants', () => {
      const result = processPluginsForDisplay(mockPlugins);

      // Should have 3 unique plugins (marketplace deduped, global-header, acr)
      expect(result).toHaveLength(3);

      // Check that marketplace is present (should prefer frontend)
      const marketplacePlugin = result.find(p => p.name === 'Marketplace');
      expect(marketplacePlugin).toBeDefined();
      expect(marketplacePlugin?.role).toBe('frontend-plugin');
      expect(marketplacePlugin?.version).toBe('0.9.2'); // Frontend version
    });

    it('should prefer frontend plugins over backend when deduplicating', () => {
      const result = processPluginsForDisplay(mockPlugins);
      const marketplacePlugin = result.find(p => p.name === 'Marketplace');

      expect(marketplacePlugin?.role).toBe('frontend-plugin');
      expect(marketplacePlugin?.platform).toBe('web');
    });

    it('should preserve single plugins without duplicates', () => {
      const result = processPluginsForDisplay(mockPlugins);

      const globalHeaderPlugin = result.find(p => p.name === 'Global Header');
      expect(globalHeaderPlugin).toBeDefined();
      expect(globalHeaderPlugin?.version).toBe('1.15.1');

      const acrPlugin = result.find(p => p.name === 'Acr');
      expect(acrPlugin).toBeDefined();
      expect(acrPlugin?.version).toBe('1.12.1');
    });

    it('should handle empty plugin list', () => {
      const result = processPluginsForDisplay([]);
      expect(result).toHaveLength(0);
    });

    it('should handle plugins with same base name but both frontend', () => {
      const plugins: DynamicPluginInfo[] = [
        {
          name: 'plugin-test-frontend',
          version: '1.0.0',
          role: 'frontend-plugin',
          platform: 'web',
        },
        {
          name: 'plugin-test-frontend-v2',
          version: '2.0.0',
          role: 'frontend-plugin',
          platform: 'web',
        },
      ];

      const result = processPluginsForDisplay(plugins);
      // Should keep both since they have different base names
      expect(result).toHaveLength(2);
    });
  });

  describe('getUniquePluginsCount', () => {
    const mockPlugins: DynamicPluginInfo[] = [
      {
        name: '@red-hat-developer-hub/backstage-plugin-marketplace-dynamic',
        version: '0.9.2',
        role: 'frontend-plugin',
        platform: 'web',
      },
      {
        name: '@red-hat-developer-hub/backstage-plugin-marketplace-backend-dynamic',
        version: '0.8.0',
        role: 'backend-plugin',
        platform: 'node',
      },
      {
        name: '@red-hat-developer-hub/backstage-plugin-global-header-dynamic',
        version: '1.15.1',
        role: 'frontend-plugin',
        platform: 'web',
      },
    ];

    it('should return correct count after deduplication', () => {
      const count = getUniquePluginsCount(mockPlugins);
      expect(count).toBe(2); // marketplace (deduped) + global-header
    });

    it('should return 0 for empty plugin list', () => {
      const count = getUniquePluginsCount([]);
      expect(count).toBe(0);
    });

    it('should return correct count for plugins without duplicates', () => {
      const uniquePlugins: DynamicPluginInfo[] = [
        {
          name: 'plugin-a',
          version: '1.0.0',
          role: 'frontend-plugin',
          platform: 'web',
        },
        {
          name: 'plugin-b',
          version: '1.0.0',
          role: 'frontend-plugin',
          platform: 'web',
        },
      ];

      const count = getUniquePluginsCount(uniquePlugins);
      expect(count).toBe(2);
    });
  });
});
