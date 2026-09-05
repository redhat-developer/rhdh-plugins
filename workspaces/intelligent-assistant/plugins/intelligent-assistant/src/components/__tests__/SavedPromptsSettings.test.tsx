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
import { useApi } from '@backstage/core-plugin-api';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { SavedPromptsSettings } from '../SavedPromptsSettings';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: jest.fn(),
}));

const mockGetSavedPromptsConfig = jest.fn().mockResolvedValue({
  max_prompts_per_user: 100,
  max_display_name_length: 128,
  max_content_length: 5000,
});
const mockGetSavedPrompts = jest.fn().mockResolvedValue([]);
const mockCreateSavedPrompt = jest.fn();
const mockDeleteSavedPrompt = jest.fn();

const mockPrompts = [
  {
    id: 'sp-1',
    name: 'Performance Optimization',
    content: 'Analyze performance',
    created_at: '2026-03-10T12:00:00Z',
    updated_at: '2026-03-10T12:00:00Z',
  },
];

describe('SavedPromptsSettings', () => {
  const defaultProps = {
    isSavedPromptsEnabled: true,
    onEnableSavedPrompts: jest.fn(),
    onApplyToInput: jest.fn(),
    onSendDirectly: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useApi as jest.Mock).mockReturnValue({
      getSavedPromptsConfig: mockGetSavedPromptsConfig,
      getSavedPrompts: mockGetSavedPrompts,
      createSavedPrompt: mockCreateSavedPrompt,
      deleteSavedPrompt: mockDeleteSavedPrompt,
    });
    mockGetSavedPrompts.mockResolvedValue([]);
  });

  it('should render empty state when no prompts are saved', async () => {
    render(<SavedPromptsSettings {...defaultProps} />);
    await waitFor(() => {
      expect(
        screen.getByTestId('saved-prompts-empty-state'),
      ).toBeInTheDocument();
      expect(screen.getByText('No prompts')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Save frequently used prompts to quickly reuse them in your conversations without typing them again. Saved prompts also appear in the chat history panel for quick access.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('+ New prompt')).toBeInTheDocument();
    });
  });

  it('should not show prompt count header when empty state is visible', async () => {
    render(<SavedPromptsSettings {...defaultProps} />);
    await waitFor(() => {
      expect(
        screen.getByTestId('saved-prompts-empty-state'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('No prompts')).toBeInTheDocument();
    expect(screen.queryByText('1 prompt')).not.toBeInTheDocument();
  });

  it('should show No prompts in header when create form is open with no prompts', async () => {
    render(<SavedPromptsSettings {...defaultProps} />);
    await waitFor(() => {
      expect(
        screen.getByTestId('saved-prompts-empty-state'),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New prompt'));

    expect(screen.getByText('No prompts')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('should show disabled alert when saved prompts are disabled', async () => {
    render(
      <SavedPromptsSettings {...defaultProps} isSavedPromptsEnabled={false} />,
    );
    await waitFor(() => {
      expect(
        screen.getByText('Saved prompts are disabled'),
      ).toBeInTheDocument();
      expect(screen.getByText('Enable saved prompts')).toBeInTheDocument();
    });
  });

  it('should not show disabled alert when saved prompts are enabled', async () => {
    render(<SavedPromptsSettings {...defaultProps} />);
    await waitFor(() => {
      expect(
        screen.queryByText('Saved prompts are disabled'),
      ).not.toBeInTheDocument();
    });
  });

  it('should show the new prompt button', async () => {
    render(<SavedPromptsSettings {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('+ New prompt')).toBeInTheDocument();
    });
  });

  it('should open the form when new prompt button is clicked', async () => {
    render(<SavedPromptsSettings {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('+ New prompt')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New prompt'));

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Prompt content')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should close the form when cancel is clicked', async () => {
    render(<SavedPromptsSettings {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText('+ New prompt')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New prompt'));
    expect(screen.getByText('Save')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('should return to empty state when cancel is clicked with no saved prompts', async () => {
    render(<SavedPromptsSettings {...defaultProps} />);
    await waitFor(() => {
      expect(
        screen.getByTestId('saved-prompts-empty-state'),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('+ New prompt'));
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(
      screen.queryByTestId('saved-prompts-empty-state'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.getByTestId('saved-prompts-empty-state')).toBeInTheDocument();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('should render saved prompts list when prompts are loaded', async () => {
    mockGetSavedPrompts.mockResolvedValue(mockPrompts);
    render(<SavedPromptsSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Performance Optimization')).toBeInTheDocument();
      expect(screen.getByText('1 prompt')).toBeInTheDocument();
    });
  });

  it('should show limit reached tooltip on disabled new prompt button', async () => {
    mockGetSavedPromptsConfig.mockResolvedValue({
      max_prompts_per_user: 1,
      max_display_name_length: 128,
      max_content_length: 5000,
    });
    mockGetSavedPrompts.mockResolvedValue(mockPrompts);
    render(<SavedPromptsSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('1 prompt')).toBeInTheDocument();
    });

    const newPromptButton = screen.getByRole('button', {
      name: '+ New prompt',
    });
    expect(newPromptButton).toBeDisabled();
    fireEvent.mouseEnter(newPromptButton.closest('span') ?? newPromptButton);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent(
        'Prompt limit reached. Delete an existing prompt to create a new one.',
      );
    });
  });

  it('should call onApplyToInput when Apply is selected from kebab menu', async () => {
    mockGetSavedPrompts.mockResolvedValue(mockPrompts);
    render(<SavedPromptsSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Performance Optimization')).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Actions for Performance Optimization',
      }),
    );
    fireEvent.click(screen.getByText('Apply in input box'));

    expect(defaultProps.onApplyToInput).toHaveBeenCalledWith(
      'Analyze performance',
    );
  });
});
