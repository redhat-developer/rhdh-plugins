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

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { MessageBarModelSelector } from '../MessageBarModelSelector';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

describe('MessageBarModelSelector', () => {
  const mockModels = [
    { label: 'Granite 3.3', value: 'granite-3.3', provider: 'ibm' },
    { label: 'GPT-4', value: 'gpt-4', provider: 'openai' },
    { label: 'Claude 3', value: 'claude-3', provider: 'anthropic' },
  ];
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the selector with selected model label', () => {
    render(
      <MessageBarModelSelector
        selectedModel="granite-3.3"
        models={mockModels}
        onSelect={mockOnSelect}
      />,
    );

    expect(screen.getByText('Granite 3.3')).toBeInTheDocument();
  });

  it('should show model value when model is not in the list', () => {
    render(
      <MessageBarModelSelector
        selectedModel="unknown-model"
        models={mockModels}
        onSelect={mockOnSelect}
      />,
    );

    expect(screen.getByText('unknown-model')).toBeInTheDocument();
  });

  it('should open dropdown when toggle is clicked', async () => {
    render(
      <MessageBarModelSelector
        selectedModel="granite-3.3"
        models={mockModels}
        onSelect={mockOnSelect}
      />,
    );

    const toggleButton = screen.getByRole('button', {
      name: 'Chatbot selector',
    });
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
  });

  it('should display all models in the dropdown', async () => {
    render(
      <MessageBarModelSelector
        selectedModel="granite-3.3"
        models={mockModels}
        onSelect={mockOnSelect}
      />,
    );

    const toggleButton = screen.getByRole('button', {
      name: 'Chatbot selector',
    });
    await userEvent.click(toggleButton);

    await waitFor(() => {
      mockModels.forEach(model => {
        expect(
          screen.getByRole('menuitem', { name: model.label }),
        ).toBeInTheDocument();
      });
    });
  });

  it('should call onSelect when a model is selected', async () => {
    render(
      <MessageBarModelSelector
        selectedModel="granite-3.3"
        models={mockModels}
        onSelect={mockOnSelect}
      />,
    );

    const toggleButton = screen.getByRole('button', {
      name: 'Chatbot selector',
    });
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    const gpt4Option = screen.getByRole('menuitem', { name: 'GPT-4' });
    await userEvent.click(gpt4Option);

    expect(mockOnSelect).toHaveBeenCalledWith('gpt-4');
  });

  it('should close dropdown after selection', async () => {
    render(
      <MessageBarModelSelector
        selectedModel="granite-3.3"
        models={mockModels}
        onSelect={mockOnSelect}
      />,
    );

    const toggleButton = screen.getByRole('button', {
      name: 'Chatbot selector',
    });
    await userEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });

    const gpt4Option = screen.getByRole('menuitem', { name: 'GPT-4' });
    await userEvent.click(gpt4Option);

    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('should be disabled when disabled prop is true', () => {
    render(
      <MessageBarModelSelector
        selectedModel="granite-3.3"
        models={mockModels}
        onSelect={mockOnSelect}
        disabled
      />,
    );

    const toggleButton = screen.getByRole('button', {
      name: 'Chatbot selector',
    });
    expect(toggleButton).toBeDisabled();
  });

  it('should not open dropdown when disabled', async () => {
    render(
      <MessageBarModelSelector
        selectedModel="granite-3.3"
        models={mockModels}
        onSelect={mockOnSelect}
        disabled
      />,
    );

    const toggleButton = screen.getByRole('button', {
      name: 'Chatbot selector',
    });
    await userEvent.click(toggleButton);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('should mark selected model in dropdown', async () => {
    render(
      <MessageBarModelSelector
        selectedModel="granite-3.3"
        models={mockModels}
        onSelect={mockOnSelect}
      />,
    );

    const toggleButton = screen.getByRole('button', {
      name: 'Chatbot selector',
    });
    await userEvent.click(toggleButton);

    await waitFor(() => {
      const selectedItem = screen.getByRole('menuitem', {
        name: 'Granite 3.3',
      });
      expect(selectedItem).toHaveClass('pf-m-selected');
    });
  });

  it('should render with single model', () => {
    const singleModel = [
      { label: 'Granite 3.3', value: 'granite-3.3', provider: 'ibm' },
    ];

    render(
      <MessageBarModelSelector
        selectedModel="granite-3.3"
        models={singleModel}
        onSelect={mockOnSelect}
      />,
    );

    expect(screen.getByText('Granite 3.3')).toBeInTheDocument();
  });

  it('should render with empty models list', () => {
    render(
      <MessageBarModelSelector
        selectedModel="granite-3.3"
        models={[]}
        onSelect={mockOnSelect}
      />,
    );

    expect(screen.getByText('granite-3.3')).toBeInTheDocument();
  });
});
