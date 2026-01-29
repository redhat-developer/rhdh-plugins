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
import {
  applyContent,
  getExampleAsMarkdown,
  getCategoryTagDisplayInfo,
} from './utils';

describe('extensions utils', () => {
  const packages = {
    'backstage-community-plugin-quay':
      './dynamic-plugins/dist/backstage-community-plugin-quay',
    'backstage-community-plugin-sonarcloud':
      './dynamic-plugins/dist/backstage-community-plugin-sonarcloud',
  };

  const mockNewContent = {
    catalog: {
      providers: {
        threeScaleApiEntity: {
          default: {
            baseUrl: 'fd',
            accessToken: 'ffd',
          },
        },
      },
    },
  };

  const expectedPluginConfig = `pluginConfig:
      catalog:
        providers:
          threeScaleApiEntity:
            default:
              baseUrl: fd
              accessToken: ffd`;

  describe('applyContent', () => {
    it('should apply the app-config example', () => {
      const content = applyContent(
        `plugins:
          - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
            disabled: false
  `,
        'backstage-community-plugin-quay',
        packages,
        mockNewContent,
      );
      expect(content).toEqual(
        `plugins:
  - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
    disabled: false
    ${expectedPluginConfig}
`,
      );
    });

    it('should apply the app-config example with comments', () => {
      const content = applyContent(
        `# This is my config
      plugins:
        - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
          # some more comment
          disabled: false
`,
        'backstage-community-plugin-quay',
        packages,
        mockNewContent,
      );
      expect(content).toEqual(
        `# This is my config
plugins:
  - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
    # some more comment
    disabled: false
    ${expectedPluginConfig}
`,
      );
    });

    it('should apply the app-config example to the appropriate plugin', () => {
      const content = applyContent(
        `plugins:
          - package: ./dynamic-plugins/dist/backstage-community-plugin-sonarcloud
            disabled: false
          - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
            disabled: false
  `,
        'backstage-community-plugin-quay',
        packages,
        mockNewContent,
      );
      expect(content).toEqual(
        `plugins:
  - package: ./dynamic-plugins/dist/backstage-community-plugin-sonarcloud
    disabled: false
  - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
    disabled: false
    ${expectedPluginConfig}
`,
      );
    });

    it('should create minimal YAML when editor is empty', () => {
      const content = applyContent(
        '',
        'backstage-community-plugin-quay',
        packages,
        mockNewContent,
      );
      expect(content).toContain('plugins:');
      expect(content).toContain(
        'package: ./dynamic-plugins/dist/backstage-community-plugin-quay',
      );
      expect(content).toContain('disabled: false');
      expect(content).toContain('pluginConfig:');
      expect(content).toContain('catalog:');
    });

    it('should create minimal YAML when editor has only whitespace', () => {
      const content = applyContent(
        '   \n  \t  ',
        'backstage-community-plugin-quay',
        packages,
        mockNewContent,
      );
      expect(content).toContain('plugins:');
      expect(content).toContain(
        'package: ./dynamic-plugins/dist/backstage-community-plugin-quay',
      );
      expect(content).toContain('disabled: false');
      expect(content).toContain('pluginConfig:');
    });
  });

  describe('getExampleAsMarkdown', () => {
    it('should return the YAML content', () => {
      const content = getExampleAsMarkdown({
        key1: 'value1',
        key2: 'value2',
      });
      expect(content).toEqual(`\`\`\`yaml
key1: value1
key2: value2

\`\`\``);
    });

    it('should return empty string when JSON object is empty', () => {
      const content = getExampleAsMarkdown({});
      expect(content).toEqual('');
    });
  });

  describe('getCategoryTagDisplayInfo', () => {
    // Helper function to reduce test duplication
    const testCategoryDisplay = (
      categoryName: string,
      expected: {
        displayName: string;
        tooltipTitle: string;
        shouldShowTooltip: boolean;
      },
      options?: { maxLength?: number },
    ) => {
      const result = getCategoryTagDisplayInfo(categoryName, options);
      expect(result).toEqual(expected);
    };

    it('should return original name when within default max length', () => {
      testCategoryDisplay('short-category', {
        displayName: 'short-category',
        tooltipTitle: '',
        shouldShowTooltip: false,
      });
    });

    it('should truncate name when exceeding default max length (25 chars)', () => {
      testCategoryDisplay(
        'this-is-a-very-long-category-name-that-exceeds-limit',
        {
          displayName: 'this-is-a-very-long-categ...',
          tooltipTitle: 'this-is-a-very-long-category-name-that-exceeds-limit',
          shouldShowTooltip: true,
        },
      );
    });

    it('should respect custom max length option', () => {
      testCategoryDisplay(
        'medium-length-category',
        {
          displayName: 'medium-len...',
          tooltipTitle: 'medium-length-category',
          shouldShowTooltip: true,
        },
        { maxLength: 10 },
      );
    });

    it('should handle exactly max length strings', () => {
      testCategoryDisplay('exactly-twenty-five-chars', {
        displayName: 'exactly-twenty-five-chars',
        tooltipTitle: '',
        shouldShowTooltip: false,
      });
    });

    it('should handle empty string', () => {
      testCategoryDisplay('', {
        displayName: '',
        tooltipTitle: '',
        shouldShowTooltip: false,
      });
    });

    it('should handle single character strings', () => {
      testCategoryDisplay('a', {
        displayName: 'a',
        tooltipTitle: '',
        shouldShowTooltip: false,
      });
    });
  });
});
