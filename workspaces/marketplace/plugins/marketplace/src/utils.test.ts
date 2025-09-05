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

describe('marketplace utils', () => {
  const packages = {
    'backstage-community-plugin-quay':
      './dynamic-plugins/dist/backstage-community-plugin-quay',
    'backstage-community-plugin-sonarcloud':
      './dynamic-plugins/dist/backstage-community-plugin-sonarcloud',
  };
  describe('applyContent', () => {
    const newContent = {
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

    it('should apply the app-config example', () => {
      const content = applyContent(
        `plugins:
          - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
            disabled: false
  `,
        'backstage-community-plugin-quay',
        packages,
        newContent,
      );
      expect(content).toEqual(
        `plugins:
  - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
    disabled: false
    pluginConfig:
      catalog:
        providers:
          threeScaleApiEntity:
            default:
              baseUrl: fd
              accessToken: ffd
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
        newContent,
      );
      expect(content).toEqual(
        `# This is my config
plugins:
  - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
    # some more comment
    disabled: false
    pluginConfig:
      catalog:
        providers:
          threeScaleApiEntity:
            default:
              baseUrl: fd
              accessToken: ffd
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
        newContent,
      );
      expect(content).toEqual(
        `plugins:
  - package: ./dynamic-plugins/dist/backstage-community-plugin-sonarcloud
    disabled: false
  - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
    disabled: false
    pluginConfig:
      catalog:
        providers:
          threeScaleApiEntity:
            default:
              baseUrl: fd
              accessToken: ffd
`,
      );
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
    it('should return original name when within default max length', () => {
      const categoryName = 'short-category';
      const result = getCategoryTagDisplayInfo(categoryName);

      expect(result).toEqual({
        displayName: 'short-category',
        tooltipTitle: '',
        shouldShowTooltip: false,
      });
    });

    it('should truncate name when exceeding default max length (25 chars)', () => {
      const categoryName =
        'this-is-a-very-long-category-name-that-exceeds-limit';
      const result = getCategoryTagDisplayInfo(categoryName);

      expect(result).toEqual({
        displayName: 'this-is-a-very-long-categ...',
        tooltipTitle: 'this-is-a-very-long-category-name-that-exceeds-limit',
        shouldShowTooltip: true,
      });
    });

    it('should respect custom max length option', () => {
      const categoryName = 'medium-length-category';
      const result = getCategoryTagDisplayInfo(categoryName, { maxLength: 10 });

      expect(result).toEqual({
        displayName: 'medium-len...',
        tooltipTitle: 'medium-length-category',
        shouldShowTooltip: true,
      });
    });

    it('should handle exactly max length strings', () => {
      const categoryName = 'exactly-twenty-five-chars';
      const result = getCategoryTagDisplayInfo(categoryName);

      expect(result).toEqual({
        displayName: 'exactly-twenty-five-chars',
        tooltipTitle: '',
        shouldShowTooltip: false,
      });
    });

    it('should handle empty string', () => {
      const categoryName = '';
      const result = getCategoryTagDisplayInfo(categoryName);

      expect(result).toEqual({
        displayName: '',
        tooltipTitle: '',
        shouldShowTooltip: false,
      });
    });

    it('should handle single character strings', () => {
      const categoryName = 'a';
      const result = getCategoryTagDisplayInfo(categoryName);

      expect(result).toEqual({
        displayName: 'a',
        tooltipTitle: '',
        shouldShowTooltip: false,
      });
    });
  });
});
