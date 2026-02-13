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

import { screen } from '@testing-library/react';

import { renderInTestApp } from '@backstage/test-utils';
import { Table, TableBody } from '@material-ui/core';
import { ComponentResource } from '@red-hat-developer-hub/backstage-plugin-konflux-common';
import { ComponentItemRow } from '../ComponentItemRow';

const renderComponentItemRow = async (component: ComponentResource) =>
  await renderInTestApp(
    <Table>
      <TableBody>
        <ComponentItemRow component={component} />
      </TableBody>
    </Table>,
  );

describe('ComponentItemRow', () => {
  const createMockComponent = (
    name: string,
    namespace: string,
    cluster: string,
    application: string,
  ): ComponentResource => ({
    apiVersion: 'v1',
    apiGroup: 'appstudio.redhat.com',
    kind: 'Component',
    metadata: {
      name,
      namespace,
    },
    spec: {
      application,
    },
    cluster: {
      name: cluster,
      konfluxUI: `https://${cluster}.example.com`,
    },
    subcomponent: {
      name: 'sub1',
    },
  });

  it('should render component name', async () => {
    const component = createMockComponent(
      'my-component',
      'test-namespace',
      'cluster1',
      'my-app',
    );

    await renderComponentItemRow(component);

    expect(screen.getByText('my-component')).toBeInTheDocument();
  });

  it('should render application name', async () => {
    const component = createMockComponent(
      'my-component',
      'test-namespace',
      'cluster1',
      'my-app',
    );

    await renderComponentItemRow(component);

    expect(screen.getByText('my-app')).toBeInTheDocument();
  });

  it('should render namespace and cluster', async () => {
    const component = createMockComponent(
      'my-component',
      'test-namespace',
      'cluster1',
      'my-app',
    );

    await renderComponentItemRow(component);

    expect(screen.getByText('test-namespace')).toBeInTheDocument();
    expect(screen.getByText('cluster1')).toBeInTheDocument();
  });

  it('should handle missing metadata gracefully', async () => {
    const component: ComponentResource = {
      apiVersion: 'v1',
      apiGroup: 'appstudio.redhat.com',
      kind: 'Component',
      metadata: {},
      spec: {
        application: 'my-app',
      },
      cluster: { name: 'cluster1' },
      subcomponent: { name: 'sub1' },
    };

    await renderComponentItemRow(component);

    // Should render without crashing
    expect(screen.getByText('my-app')).toBeInTheDocument();
  });

  it('should handle missing application in spec', async () => {
    const component: ComponentResource = {
      apiVersion: 'v1',
      apiGroup: 'appstudio.redhat.com',
      kind: 'Component',
      metadata: {
        name: 'my-component',
        namespace: 'test-namespace',
      },
      spec: {},
      cluster: { name: 'cluster1' },
      subcomponent: { name: 'sub1' },
    };

    await renderComponentItemRow(component);

    // Should render without crashing
    expect(screen.getByText('my-component')).toBeInTheDocument();
  });
});
