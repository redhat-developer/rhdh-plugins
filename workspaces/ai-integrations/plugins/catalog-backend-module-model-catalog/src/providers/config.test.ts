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
import { readModelCatalogApiEntityConfigs } from './config';

describe('readModelCatalogApiEntityConfigs', () => {
  it('should return empty array when no provider config exists', () => {
    const config = new ConfigReader({});
    const result = readModelCatalogApiEntityConfigs(config);
    expect(result).toEqual([]);
  });

  it('should return config with parsed schedule', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          modelCatalog: {
            'kserve-kubeflow-connector': {
              schedule: {
                frequency: { minutes: 30 },
                timeout: { minutes: 3 },
              },
            },
          },
        },
      },
    });
    const result = readModelCatalogApiEntityConfigs(config);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('kserve-kubeflow-connector');
    const schedule = result[0].schedule;
    expect(schedule).toBeDefined();
    expect(schedule?.frequency).toEqual({ minutes: 30 });
    expect(schedule?.timeout).toEqual({ minutes: 3 });
  });

  it('should return config with undefined schedule when not provided', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          modelCatalog: {
            'kserve-kubeflow-connector': {},
          },
        },
      },
    });
    const result = readModelCatalogApiEntityConfigs(config);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('kserve-kubeflow-connector');
    expect(result[0].schedule).toBeUndefined();
  });

  it('should return multiple configs for multiple providers', () => {
    const config = new ConfigReader({
      catalog: {
        providers: {
          modelCatalog: {
            'connector-a': {
              schedule: {
                frequency: { minutes: 10 },
                timeout: { minutes: 2 },
              },
            },
            'connector-b': {
              schedule: {
                frequency: { minutes: 60 },
                timeout: { minutes: 5 },
              },
            },
          },
        },
      },
    });
    const result = readModelCatalogApiEntityConfigs(config);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.id)).toEqual(['connector-a', 'connector-b']);
  });
});
