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

import { coreExtensionData } from '@backstage/frontend-plugin-api';
import { createExtensionTester } from '@backstage/frontend-test-utils';

import plugin from './alpha';
import { openShiftRouteRef, rootRouteRef } from './routes';

describe('cost-management alpha', () => {
  it('exports a valid frontend plugin', () => {
    expect(plugin).toBeDefined();
    expect(plugin.$$type).toBe('@backstage/FrontendPlugin');
  });

  it('has plugin id cost-management', () => {
    expect(plugin.id).toBe('cost-management');
  });

  it('exposes root, openShift and breakdown routes', () => {
    expect(plugin.routes).toHaveProperty('root');
    expect(plugin.routes).toHaveProperty('openShift');
    expect(plugin.routes).toHaveProperty('breakdown');
  });

  it('registers pages, APIs and the icon bundle', () => {
    expect(plugin.getExtension('page:cost-management')).toBeDefined();
    expect(plugin.getExtension('page:cost-management/openshift')).toBeDefined();
    expect(
      plugin.getExtension('api:cost-management/optimizations'),
    ).toBeDefined();
    expect(
      plugin.getExtension('api:cost-management/orchestrator-slim'),
    ).toBeDefined();
    expect(
      plugin.getExtension('api:cost-management/cost-management-slim'),
    ).toBeDefined();
    expect(
      plugin.getExtension('icon-bundle:cost-management/cost-management-icons'),
    ).toBeDefined();
  });
});

describe('cost-management NFS wiring', () => {
  it('declares Optimizations page path, title and route ref', () => {
    const tester = createExtensionTester(
      plugin.getExtension('page:cost-management'),
    );

    expect(tester.get(coreExtensionData.routePath)).toBe(
      '/cost-management/optimizations',
    );
    expect(tester.get(coreExtensionData.title)).toBe('Optimizations');
    expect(tester.get(coreExtensionData.routeRef)).toBe(rootRouteRef);
  });

  it('declares OpenShift page with Cost Management nav title', () => {
    const tester = createExtensionTester(
      plugin.getExtension('page:cost-management/openshift'),
    );

    expect(tester.get(coreExtensionData.routePath)).toBe(
      '/cost-management/openshift',
    );
    expect(tester.get(coreExtensionData.title)).toBe('Cost Management');
    expect(tester.get(coreExtensionData.routeRef)).toBe(openShiftRouteRef);
  });
});
