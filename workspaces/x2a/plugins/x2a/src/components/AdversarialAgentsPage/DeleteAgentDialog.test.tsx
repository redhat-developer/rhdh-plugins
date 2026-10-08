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

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteAgentDialog } from './DeleteAgentDialog';

describe('DeleteAgentDialog', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    isDeleting: false,
    agentName: 'My Agent',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the agent name in the title', () => {
    render(<DeleteAgentDialog {...defaultProps} />);
    expect(screen.getByText(/My Agent/)).toBeInTheDocument();
  });

  it('calls onConfirm when delete button is clicked', async () => {
    const onConfirm = jest.fn();
    render(<DeleteAgentDialog {...defaultProps} onConfirm={onConfirm} />);
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel button is clicked', async () => {
    const onClose = jest.fn();
    render(<DeleteAgentDialog {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('disables buttons and shows spinner while deleting', () => {
    render(<DeleteAgentDialog {...defaultProps} isDeleting />);
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });

  it('does not render when closed', () => {
    render(<DeleteAgentDialog {...defaultProps} open={false} />);
    expect(screen.queryByText(/My Agent/)).not.toBeInTheDocument();
  });
});
