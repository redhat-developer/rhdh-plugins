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

import { screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickstartContent } from './QuickstartContent';
import { renderInTestApp } from '@backstage/test-utils';
import { mockQuickstartItems } from '../mockData';

jest.mock('@mui/material/Collapse', () => ({
  __esModule: true,
  default: ({ in: open, children }: any) => (open ? children : null),
}));

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('QuickstartContent', () => {
  const mockSetProgress = jest.fn();

  it('renders EmptyState when no items are passed', async () => {
    await renderInTestApp(
      <QuickstartContent
        quickstartItems={[]}
        setProgress={mockSetProgress}
        itemCount={0}
      />,
    );

    expect(
      screen.getByText('Quickstart content not available.'),
    ).toBeInTheDocument();
  });

  it('renders all quickstart items passed in props', async () => {
    await renderInTestApp(
      <QuickstartContent
        quickstartItems={mockQuickstartItems}
        setProgress={mockSetProgress}
        itemCount={2}
      />,
    );
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('Step 2')).toBeInTheDocument();
  });

  it('only opens one item at a time', async () => {
    await renderInTestApp(
      <QuickstartContent
        quickstartItems={mockQuickstartItems}
        setProgress={mockSetProgress}
        itemCount={2}
      />,
    );

    const expandIcon1 = screen.getAllByRole('button', {
      name: /expand item/i,
    })[0];
    const expandIcon2 = screen.getAllByRole('button', {
      name: /expand item/i,
    })[1];

    fireEvent.click(expandIcon1);

    await waitFor(() =>
      expect(screen.getByText('Description for Step 1')).toBeInTheDocument(),
    );

    fireEvent.click(expandIcon2);

    await waitFor(() =>
      expect(screen.getByText('Description for Step 2')).toBeInTheDocument(),
    );

    expect(
      screen.queryByText('Description for Step 1'),
    ).not.toBeInTheDocument();
  });
});
