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

import { render, screen } from '@testing-library/react';
import { GlobalHeaderDropdownContent } from './GlobalHeaderDropdownContent';
import type { DropdownEntry } from '../utils/menuItemGrouping';

jest.mock('../../components/HeaderDropdownComponent/MenuSection', () => ({
  MenuSection: ({ sectionLabel, hideDivider }: any) => (
    <div data-testid="menu-section" data-label={sectionLabel ?? ''}>
      {hideDivider ? 'no-divider' : 'has-divider'}
    </div>
  ),
}));

const MockComponent = ({ handleClose, hideDivider }: any) => (
  <div data-testid="custom-component">
    <button onClick={handleClose}>close</button>
    {hideDivider ? 'no-divider' : 'has-divider'}
  </div>
);

describe('GlobalHeaderDropdownContent', () => {
  const handleClose = jest.fn();

  it('renders standalone component entries', () => {
    const entries: DropdownEntry[] = [
      {
        type: 'component',
        item: { target: 'test', component: MockComponent, type: 'component' },
        priority: 10,
      },
    ];

    render(
      <GlobalHeaderDropdownContent
        entries={entries}
        target="test"
        handleClose={handleClose}
      />,
    );

    expect(screen.getByTestId('custom-component')).toBeInTheDocument();
  });

  it('renders section group entries via MenuSection', () => {
    const entries: DropdownEntry[] = [
      {
        type: 'section',
        group: {
          sectionLabel: 'Resources',
          items: [{ Component: () => null, label: 'Docs', link: '/docs' }],
          priority: 10,
        },
        priority: 10,
      },
    ];

    render(
      <GlobalHeaderDropdownContent
        entries={entries}
        target="test"
        handleClose={handleClose}
      />,
    );

    expect(screen.getByTestId('menu-section')).toBeInTheDocument();
    expect(screen.getByTestId('menu-section')).toHaveAttribute(
      'data-label',
      'Resources',
    );
  });

  it('passes isLast=true to the last entry', () => {
    const entries: DropdownEntry[] = [
      {
        type: 'component',
        item: { target: 'test', component: MockComponent, type: 'component' },
        priority: 20,
      },
      {
        type: 'component',
        item: { target: 'test', component: MockComponent, type: 'component' },
        priority: 10,
      },
    ];

    render(
      <GlobalHeaderDropdownContent
        entries={entries}
        target="test"
        handleClose={handleClose}
      />,
    );

    const components = screen.getAllByTestId('custom-component');
    expect(components[0]).toHaveTextContent('has-divider');
    expect(components[1]).toHaveTextContent('no-divider');
  });

  it('returns null for component entries without a component', () => {
    const entries: DropdownEntry[] = [
      {
        type: 'component',
        item: { target: 'test', type: 'component' },
        priority: 10,
      },
    ];

    const { container } = render(
      <GlobalHeaderDropdownContent
        entries={entries}
        target="test"
        handleClose={handleClose}
      />,
    );

    expect(container.children).toHaveLength(0);
  });

  it('renders empty when given no entries', () => {
    const { container } = render(
      <GlobalHeaderDropdownContent
        entries={[]}
        target="test"
        handleClose={handleClose}
      />,
    );

    expect(container.children).toHaveLength(0);
  });
});
