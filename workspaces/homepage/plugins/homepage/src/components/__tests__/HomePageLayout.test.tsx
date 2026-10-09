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

import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import type { AppNode } from '@backstage/frontend-plugin-api';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { HomePageLayout } from '../HomePageLayout';
import { useDefaultWidgets } from '../../hooks/useDefaultWidgets';
import type { HomePageCardConfig } from '../../types';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

jest.mock('../../hooks/useDefaultWidgets');

jest.mock('../Header', () => ({
  Header: ({ title }: { title?: string }) => (
    <div data-testid="header">{title}</div>
  ),
}));

jest.mock('../CustomizableGridLayout', () => ({
  CustomizableGridLayout: ({
    homepageCards,
  }: {
    homepageCards: { name?: string }[];
  }) => (
    <div
      data-testid="customizable-grid"
      data-card-names={homepageCards.map(card => card.name).join(',')}
    />
  ),
}));

jest.mock('../ReadOnlyGridLayout', () => ({
  ReadOnlyGridLayout: ({
    homepageCards,
  }: {
    homepageCards: { name?: string }[];
  }) => (
    <div
      data-testid="read-only-grid"
      data-card-names={homepageCards.map(card => card.name).join(',')}
    />
  ),
}));

jest.mock('@backstage/core-components', () => ({
  Page: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Content: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Progress: () => <div data-testid="progress" />,
  EmptyState: ({ title }: { title: string }) => (
    <div data-testid="empty-state">{title}</div>
  ),
}));

const mockUseDefaultWidgets = useDefaultWidgets as jest.MockedFunction<
  typeof useDefaultWidgets
>;

function widget(name: string): HomePageCardConfig {
  return {
    node: {
      spec: { id: `home-page-widget:homepage/${name}` },
    } as AppNode,
    component: createElement('div'),
    name,
  };
}

const widgets = [widget('quickaccess-card'), widget('rhdh-entity-section')];

const renderLayout = (
  customizable: boolean,
  layoutWidgets: HomePageCardConfig[] = widgets,
) =>
  render(
    <HomePageLayout widgets={layoutWidgets} customizable={customizable} />,
  );

describe('HomePageLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows progress while default widgets are loading', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: undefined,
      loading: true,
      error: undefined,
    });

    renderLayout(false);

    expect(screen.getByTestId('progress')).toBeInTheDocument();
    expect(screen.queryByTestId('customizable-grid')).not.toBeInTheDocument();
    expect(screen.queryByTestId('read-only-grid')).not.toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('renders customizable grid when widgets are visible', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: undefined,
      loading: false,
      error: undefined,
    });

    renderLayout(true);

    expect(screen.getByTestId('customizable-grid')).toHaveAttribute(
      'data-card-names',
      'quickaccess-card,rhdh-entity-section',
    );
    expect(screen.queryByTestId('read-only-grid')).not.toBeInTheDocument();
    expect(screen.queryByTestId('progress')).not.toBeInTheDocument();
  });

  it('renders read-only grid when not customizable', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: undefined,
      loading: false,
      error: undefined,
    });

    renderLayout(false);

    expect(screen.getByTestId('read-only-grid')).toHaveAttribute(
      'data-card-names',
      'quickaccess-card,rhdh-entity-section',
    );
    expect(screen.queryByTestId('customizable-grid')).not.toBeInTheDocument();
  });

  it('filters widgets by defaultWidgets refs', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: [{ id: 'qa', ref: 'quickaccess-card' }],
      loading: false,
      error: undefined,
    });

    renderLayout(true);

    expect(screen.getByTestId('customizable-grid')).toHaveAttribute(
      'data-card-names',
      'quickaccess-card',
    );
  });

  it('shows empty state when defaultWidgets filters out all widgets', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: [],
      loading: false,
      error: undefined,
    });

    renderLayout(false);

    expect(screen.getByTestId('empty-state')).toHaveTextContent(
      'No home page widgets configured or found.',
    );
    expect(screen.queryByTestId('read-only-grid')).not.toBeInTheDocument();
  });

  it('shows empty state when no widgets are provided', () => {
    mockUseDefaultWidgets.mockReturnValue({
      defaultWidgets: undefined,
      loading: false,
      error: undefined,
    });

    renderLayout(true, []);

    expect(screen.getByTestId('empty-state')).toHaveTextContent(
      'No home page widgets configured or found.',
    );
    expect(screen.queryByTestId('customizable-grid')).not.toBeInTheDocument();
  });
});
