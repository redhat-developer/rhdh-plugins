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
  ScorecardEntityContentLayoutBlueprint,
  scorecardLayoutTitleDataRef,
} from './ScorecardLayoutBlueprint';
import {
  createExtensionTester,
  renderInTestApp,
} from '@backstage/frontend-test-utils';
import { screen, waitFor } from '@testing-library/react';

describe('ScorecardEntityContentLayoutBlueprint', () => {
  it('should create a named extension', () => {
    const extension = ScorecardEntityContentLayoutBlueprint.make({
      name: 'scorecard-entity-layout-grid',
      params: {
        title: 'Grid',
        loader: async () => () => <div />,
      },
    });

    const extensionData = JSON.parse(JSON.stringify(extension));

    expect(extensionData).toBeDefined();
    expect(extensionData.kind).toBe('scorecard-layout');
    expect(extensionData.name).toBe('scorecard-entity-layout-grid');
    expect(extensionData.attachTo).toEqual({
      id: 'entity-content:catalog/entity-content-scorecard',
      input: 'layouts',
    });
  });

  it('should yield the layout title via scorecardLayoutTitleDataRef', () => {
    const extension = ScorecardEntityContentLayoutBlueprint.make({
      params: {
        title: 'Grid',
        loader: async () => () => <div />,
      },
    });

    const tester = createExtensionTester(extension);
    const title = tester.get(scorecardLayoutTitleDataRef);

    expect(title).toBe('Grid');
  });

  it('should yield a different layout title for List', () => {
    const extension = ScorecardEntityContentLayoutBlueprint.make({
      params: {
        title: 'List',
        loader: async () => () => <div />,
      },
    });

    const tester = createExtensionTester(extension);
    const title = tester.get(scorecardLayoutTitleDataRef);

    expect(title).toBe('List');
  });

  it('should render the loaded component as a react element', async () => {
    const MockLayout = () => <div data-testid="mock-layout">Mock Grid</div>;

    const extension = ScorecardEntityContentLayoutBlueprint.make({
      params: {
        title: 'Grid',
        loader: async () => () => <MockLayout />,
      },
    });

    const tester = createExtensionTester(extension);

    renderInTestApp(tester.reactElement());

    await waitFor(() => {
      expect(screen.getByTestId('mock-layout')).toBeInTheDocument();
    });
  });

  it('should pass config groups to the loaded component', async () => {
    const MockLayout = (props: { groups: Record<string, any> }) => (
      <div data-testid="mock-layout">{JSON.stringify(props.groups)}</div>
    );

    const extension = ScorecardEntityContentLayoutBlueprint.make({
      params: {
        title: 'Grid',
        loader: async () => MockLayout,
      },
    });

    const groups = {
      quality: {
        title: 'Quality',
        description: 'Quality metrics',
        metrics: ['sonarqube-coverage', 'sonarqube-bugs'],
      },
    };

    const tester = createExtensionTester(extension, { config: { groups } });

    renderInTestApp(tester.reactElement());

    await waitFor(() => {
      expect(screen.getByTestId('mock-layout')).toBeInTheDocument();
      expect(screen.getByTestId('mock-layout').textContent).toContain(
        'Quality',
      );
    });
  });

  it('should default groups to empty object when no config is provided', async () => {
    const MockLayout = (props: { groups: Record<string, any> }) => (
      <div data-testid="mock-layout">
        {Object.keys(props.groups).length === 0 ? 'empty' : 'has-groups'}
      </div>
    );

    const extension = ScorecardEntityContentLayoutBlueprint.make({
      params: {
        title: 'Grid',
        loader: async () => MockLayout,
      },
    });

    const tester = createExtensionTester(extension);

    renderInTestApp(tester.reactElement());

    await waitFor(() => {
      expect(screen.getByTestId('mock-layout')).toHaveTextContent('empty');
    });
  });
});
