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
import { fireEvent, render, screen } from '@testing-library/react';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { SavedPromptKebabMenu } from '../SavedPromptKebabMenu';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

const mockPrompt = {
  id: 'sp-1',
  name: 'Test prompt',
  content: 'Hello world',
  created_at: '2026-03-10T12:00:00Z',
  updated_at: '2026-03-10T12:00:00Z',
};

describe('SavedPromptKebabMenu', () => {
  const onApplyToInput = jest.fn();
  const onSendDirectly = jest.fn();
  const onDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render settings variant menu items when opened', () => {
    render(
      <SavedPromptKebabMenu
        prompt={mockPrompt}
        variant="settings"
        onApplyToInput={onApplyToInput}
        onSendDirectly={onSendDirectly}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Actions for Test prompt' }),
    );

    expect(screen.getByText('Apply in input box')).toBeInTheDocument();
    expect(screen.getByText('Send directly')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should hide Apply in sidebar variant', () => {
    render(
      <SavedPromptKebabMenu
        prompt={mockPrompt}
        variant="sidebar"
        onSendDirectly={onSendDirectly}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Actions for Test prompt' }),
    );

    expect(screen.queryByText('Apply in input box')).not.toBeInTheDocument();
    expect(screen.getByText('Send directly')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should call onApplyToInput when Apply is clicked', () => {
    render(
      <SavedPromptKebabMenu
        prompt={mockPrompt}
        variant="settings"
        onApplyToInput={onApplyToInput}
        onSendDirectly={onSendDirectly}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Actions for Test prompt' }),
    );
    fireEvent.click(screen.getByText('Apply in input box'));

    expect(onApplyToInput).toHaveBeenCalledWith('Hello world');
  });

  it('should disable Send directly with helper text while chat is streaming', () => {
    render(
      <SavedPromptKebabMenu
        prompt={mockPrompt}
        variant="settings"
        onApplyToInput={onApplyToInput}
        onSendDirectly={onSendDirectly}
        onDelete={onDelete}
        isSendDirectlyDisabled
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Actions for Test prompt' }),
    );

    const sendButton = screen.getByRole('menuitem', { name: /Send directly/i });
    expect(sendButton).toBeDisabled();
    expect(screen.getByText('Wait for response to finish')).toBeInTheDocument();

    fireEvent.click(sendButton);
    expect(onSendDirectly).not.toHaveBeenCalled();
  });
});
