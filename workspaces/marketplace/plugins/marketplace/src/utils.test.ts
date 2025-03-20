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
import { applyContent, getYamlContent } from './utils';

describe('marketplace utils', () => {
  const newContent = `catalog:
          providers:
            threeScaleApiEntity:
              default:
                baseUrl: fd
                accessToken: ffd
`;
  it('should return the YAML content', () => {
    const content = getYamlContent({
      key1: 'value1',
      key2: 'value2',
    });
    expect(content).toEqual(`\`\`\`yaml
key1: value1
key2: value2

\`\`\``);
  });

  it('should return empty string when JSON object is empty', () => {
    const content = getYamlContent({});
    expect(content).toEqual('');
  });

  it('should apply the app-config example', () => {
    const content = applyContent(
      `plugins:
        - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
          disabled: false
`,
      newContent,
      './dynamic-plugins/dist/backstage-community-plugin-quay',
    );
    expect(content).toEqual(
      `plugins:
  - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
    disabled: false
    pluginConfig: |
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
      newContent,
      './dynamic-plugins/dist/backstage-community-plugin-quay',
    );
    expect(content).toEqual(
      `# This is my config
plugins:
  - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
    # some more comment
    disabled: false
    pluginConfig: |
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
      newContent,
      './dynamic-plugins/dist/backstage-community-plugin-quay',
    );
    expect(content).toEqual(
      `plugins:
  - package: ./dynamic-plugins/dist/backstage-community-plugin-sonarcloud
    disabled: false
  - package: ./dynamic-plugins/dist/backstage-community-plugin-quay
    disabled: false
    pluginConfig: |
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
