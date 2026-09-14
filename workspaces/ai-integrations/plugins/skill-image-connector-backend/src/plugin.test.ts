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

import { ConfigReader } from '@backstage/config';
import { readSkillImageConfigs } from './plugin';

describe('readSkillImageConfigs', () => {
  it('should return empty array when no config', () => {
    const config = new ConfigReader({});
    const result = readSkillImageConfigs(config);
    expect(result).toEqual([]);
  });

  it('should return empty array when images array is missing', () => {
    const config = new ConfigReader({
      skillImageConnector: {},
    });
    const result = readSkillImageConfigs(config);
    expect(result).toEqual([]);
  });

  it('should read image configs from array', () => {
    const config = new ConfigReader({
      skillImageConnector: {
        images: [
          {
            imageRef: 'quay.io/gabemontero/hello-world-skill:1.0.0-draft',
          },
          {
            imageRef: 'quay.io/org/another-skill:latest',
          },
        ],
      },
    });
    const result = readSkillImageConfigs(config);
    expect(result).toEqual([
      {
        id: 'image-0',
        imageRef: 'quay.io/gabemontero/hello-world-skill:1.0.0-draft',
      },
      {
        id: 'image-1',
        imageRef: 'quay.io/org/another-skill:latest',
      },
    ]);
  });

  it('should skip entries without imageRef', () => {
    const config = new ConfigReader({
      skillImageConnector: {
        images: [
          {
            imageRef: 'quay.io/gabemontero/hello-world-skill:1.0.0-draft',
          },
          {},
        ],
      },
    });
    const result = readSkillImageConfigs(config);
    expect(result).toHaveLength(1);
    expect(result[0].imageRef).toBe(
      'quay.io/gabemontero/hello-world-skill:1.0.0-draft',
    );
  });
});
