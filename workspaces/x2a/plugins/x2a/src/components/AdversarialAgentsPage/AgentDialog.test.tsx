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

const mockAdversarialAgentsPost = jest.fn();
const mockAdversarialAgentsIdPut = jest.fn();
const clientServiceMock = {
  adversarialAgentsPost: mockAdversarialAgentsPost,
  adversarialAgentsIdPut: mockAdversarialAgentsIdPut,
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
  ResponseErrorPanel: ({ error }: any) => (
    <div data-testid="error-panel">{error?.message}</div>
  ),
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AdversarialAgent } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { AgentDialog } from './AgentDialog';

const VALID_PROMPT =
  'Review the migration output for security vulnerabilities, privilege escalation, and correctness issues in the generated Ansible playbooks.';

const existingAgent: AdversarialAgent = {
  id: 'agent-1',
  name: 'Security Checker',
  prompt: VALID_PROMPT,
  phases: ['analyze'],
  critical: false,
  createdAt: new Date('2025-01-01').toISOString() as any,
  updatedAt: new Date('2025-01-01').toISOString() as any,
  createdBy: 'user:default/admin',
};

describe('AgentDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create mode', () => {
    it('renders empty form with create title', () => {
      render(<AgentDialog open onClose={jest.fn()} onSaved={jest.fn()} />);
      expect(screen.getByText(/create/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });

    it('enables save when all fields are valid', async () => {
      render(<AgentDialog open onClose={jest.fn()} onSaved={jest.fn()} />);

      await userEvent.type(
        screen.getByPlaceholderText('e.g., Privilege Escalation Check'),
        'My Agent',
      );
      await userEvent.type(
        screen.getByPlaceholderText(
          'Describe what this agent should check for...',
        ),
        VALID_PROMPT,
      );
      await userEvent.click(screen.getByLabelText(/analyze/i));

      expect(screen.getByRole('button', { name: /save/i })).toBeEnabled();
    });

    it('calls adversarialAgentsPost on save', async () => {
      const onSaved = jest.fn();
      mockAdversarialAgentsPost.mockResolvedValue({ ok: true, status: 201 });

      render(<AgentDialog open onClose={jest.fn()} onSaved={onSaved} />);

      await userEvent.type(
        screen.getByPlaceholderText('e.g., Privilege Escalation Check'),
        'My Agent',
      );
      await userEvent.type(
        screen.getByPlaceholderText(
          'Describe what this agent should check for...',
        ),
        VALID_PROMPT,
      );
      await userEvent.click(screen.getByLabelText(/analyze/i));

      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockAdversarialAgentsPost).toHaveBeenCalledWith(
          expect.objectContaining({
            body: expect.objectContaining({ name: 'My Agent' }),
          }),
        );
        expect(onSaved).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('edit mode', () => {
    it('renders edit title and pre-fills fields', () => {
      render(
        <AgentDialog
          open
          onClose={jest.fn()}
          onSaved={jest.fn()}
          agent={existingAgent}
        />,
      );
      expect(screen.getByText(/edit/i)).toBeInTheDocument();
      expect(screen.getByDisplayValue('Security Checker')).toBeInTheDocument();
      expect(screen.getByDisplayValue(VALID_PROMPT)).toBeInTheDocument();
    });

    it('calls adversarialAgentsIdPut on save', async () => {
      const onSaved = jest.fn();
      mockAdversarialAgentsIdPut.mockResolvedValue({ ok: true, status: 200 });

      render(
        <AgentDialog
          open
          onClose={jest.fn()}
          onSaved={onSaved}
          agent={existingAgent}
        />,
      );

      await userEvent.click(screen.getByRole('button', { name: /save/i }));

      await waitFor(() => {
        expect(mockAdversarialAgentsIdPut).toHaveBeenCalledWith(
          expect.objectContaining({ path: { id: 'agent-1' } }),
        );
        expect(onSaved).toHaveBeenCalledTimes(1);
      });
    });
  });

  it('calls onClose when cancel is clicked', async () => {
    const onClose = jest.fn();
    render(<AgentDialog open onClose={onClose} onSaved={jest.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
