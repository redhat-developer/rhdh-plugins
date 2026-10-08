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

import '@testing-library/jest-dom';

import { createElement, type ReactNode } from 'react';

import { render, screen } from '@testing-library/react';

import { WorkflowsTabContent } from './WorkflowsTabContent';

jest.mock('@backstage/core-components', () => ({
  Content: ({ children }: { children?: ReactNode }) =>
    createElement('div', null, children),
  Progress: () => null,
  ResponseErrorPanel: () => null,
}));

jest.mock('./WorkflowsTable', () => ({
  WorkflowsTable: () => null,
}));

jest.mock('../ui/OrchestratorEmptyState', () => ({
  OrchestratorEmptyState: ({ variant }: { variant: string }) =>
    createElement('div', { 'data-testid': `empty-${variant}` }, variant),
}));

describe('WorkflowsTabContent', () => {
  it('renders the empty state when no workflows are returned', () => {
    render(
      <WorkflowsTabContent
        overviewsState={{
          overviews: [],
          loading: false,
          tableLoading: false,
          isReady: true,
          count: 0,
        }}
      />,
    );

    expect(screen.getByTestId('empty-workflows')).toBeInTheDocument();
  });
});
