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

const mockAdversarialAgentsGet = jest.fn();
const clientServiceMock = {
  adversarialAgentsGet: mockAdversarialAgentsGet,
};

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../../ClientService', () => ({
  useClientService: () => clientServiceMock,
}));

jest.mock('../tools', () => ({
  isHttpSuccessResponse: (r: any) => r?.ok === true,
  extractResponseError: async (_r: any, fallback: string) => fallback,
}));

jest.mock('@backstage/core-components', () => ({
  Table: ({ data, isLoading, emptyContent }: any) => {
    if (isLoading) return <div data-testid="table-loading" />;
    if (!data?.length)
      return <div data-testid="table-empty">{emptyContent}</div>;
    return (
      <div data-testid="agents-table">
        {data.map((agent: any) => (
          <div key={agent.id} data-testid="agent-row">
            {agent.name}
          </div>
        ))}
      </div>
    );
  },
  ResponseErrorPanel: ({ error }: any) => (
    <div data-testid="error-panel">{error?.message}</div>
  ),
}));

jest.mock('./AgentDialog', () => ({
  AgentDialog: ({ open }: any) =>
    open ? <div data-testid="agent-dialog" /> : null,
}));

jest.mock('./DeleteAgentDialog', () => ({
  DeleteAgentDialog: ({ open }: any) =>
    open ? <div data-testid="delete-dialog" /> : null,
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdversarialAgentsTable } from './AdversarialAgentsTable';

const VALID_PROMPT =
  'Review the migration output for security vulnerabilities and correctness issues in the generated Ansible playbooks.';

const mockAgents = [
  {
    id: 'agent-1',
    name: 'Security Checker',
    prompt: VALID_PROMPT,
    phases: ['analyze'],
    critical: false,
    createdAt: new Date('2025-01-01').toISOString(),
    createdBy: 'user:default/admin',
  },
  {
    id: 'agent-2',
    name: 'Privilege Guard',
    prompt: VALID_PROMPT,
    phases: ['migrate'],
    critical: true,
    createdAt: new Date('2025-02-01').toISOString(),
    createdBy: 'user:default/alice',
  },
];

const successResponse = (agents: any[]) => ({
  ok: true,
  status: 200,
  json: async () => ({ agents, total: agents.length }),
});

describe('AdversarialAgentsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state on initial fetch', async () => {
    mockAdversarialAgentsGet.mockReturnValue(new Promise(() => {}));
    render(<AdversarialAgentsTable />);
    expect(screen.getByTestId('table-loading')).toBeInTheDocument();
  });

  it('renders agents after successful fetch', async () => {
    mockAdversarialAgentsGet.mockResolvedValue(successResponse(mockAgents));

    render(<AdversarialAgentsTable />);

    await waitFor(() => {
      expect(screen.getByText('Security Checker')).toBeInTheDocument();
      expect(screen.getByText('Privilege Guard')).toBeInTheDocument();
    });
  });

  it('shows empty state when no agents exist', async () => {
    mockAdversarialAgentsGet.mockResolvedValue(successResponse([]));

    render(<AdversarialAgentsTable />);

    await waitFor(() => {
      expect(screen.getByTestId('table-empty')).toBeInTheDocument();
    });
  });

  it('shows error panel when fetch fails', async () => {
    mockAdversarialAgentsGet.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Internal server error' }),
    });

    render(<AdversarialAgentsTable />);

    await waitFor(() => {
      expect(screen.getByTestId('error-panel')).toBeInTheDocument();
    });
  });

  it('opens create dialog when add button is clicked', async () => {
    mockAdversarialAgentsGet.mockResolvedValue(successResponse([]));

    render(<AdversarialAgentsTable />);

    await screen.findByTestId('table-empty');

    await userEvent.click(screen.getByRole('button', { name: /add agent/i }));
    expect(screen.getByTestId('agent-dialog')).toBeInTheDocument();
  });
});
