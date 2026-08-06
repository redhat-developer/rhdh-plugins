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
import { mockUseTranslation } from '../../test-utils/mockTranslations';

const mockUsePermission = jest.fn();

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: () => mockUsePermission(),
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('@backstage/core-components', () => ({
  Page: ({ children }: any) => <div data-testid="page">{children}</div>,
  Header: ({ title }: any) => <div data-testid="header">{title}</div>,
  Content: ({ children }: any) => <div data-testid="content">{children}</div>,
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}));

jest.mock('./AdversarialAgentsTable', () => ({
  AdversarialAgentsTable: () => <div data-testid="adversarial-agents-table" />,
}));

import { render, screen } from '@testing-library/react';
import { AdversarialAgentsPage } from './AdversarialAgentsPage';

describe('AdversarialAgentsPage', () => {
  it('renders page shell while permission is loading', () => {
    mockUsePermission.mockReturnValue({ allowed: false, loading: true });
    render(<AdversarialAgentsPage />);
    expect(screen.getByTestId('page')).toBeInTheDocument();
    expect(
      screen.queryByTestId('adversarial-agents-table'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('renders empty state when user does not have write permission', () => {
    mockUsePermission.mockReturnValue({ allowed: false, loading: false });
    render(<AdversarialAgentsPage />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(
      screen.queryByTestId('adversarial-agents-table'),
    ).not.toBeInTheDocument();
  });

  it('renders the agents table when user has write permission', () => {
    mockUsePermission.mockReturnValue({ allowed: true, loading: false });
    render(<AdversarialAgentsPage />);
    expect(screen.getByTestId('adversarial-agents-table')).toBeInTheDocument();
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });
});
