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
  configApiRef,
  fetchApiRef,
  createApiFactory,
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';
import { adoptionInsightsApiRef } from './api';
import { adoptionInsightsPlugin, AdoptionInsightsPage } from './plugin';
import { rootRouteRef } from './routes';

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    createPlugin: jest.fn(actual.createPlugin),
    createApiFactory: jest.fn(actual.createApiFactory),
    createRoutableExtension: jest.fn(actual.createRoutableExtension),
  };
});

describe('adoption-insights', () => {
  it('should export plugin', () => {
    expect(adoptionInsightsPlugin).toBeDefined();
  });

  it('should create the plugin with correct id and routes', () => {
    expect(createPlugin).toHaveBeenCalledWith({
      id: 'adoption-insights',
      routes: { root: rootRouteRef },
      apis: expect.any(Array),
    });
  });

  it('should define an API factory with correct dependencies', () => {
    expect(createApiFactory).toHaveBeenCalledWith({
      api: adoptionInsightsApiRef,
      deps: {
        configApi: configApiRef,
        fetchApi: fetchApiRef,
      },
      factory: expect.any(Function),
    });
  });

  it('should provide AdoptionInsightsPage as a routable extension', () => {
    expect(createRoutableExtension).toHaveBeenCalledWith({
      name: 'AdoptionInsightsPage',
      component: expect.any(Function),
      mountPoint: rootRouteRef,
    });
  });

  it('should export AdoptionInsightsPage', () => {
    expect(AdoptionInsightsPage).toBeDefined();
  });
});
