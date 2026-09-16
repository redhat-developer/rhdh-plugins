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
import { SavedPromptCard } from '../SavedPromptCard';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

const mockPrompt = {
  id: 'sp-1',
  name: 'Performance Optimization',
  content: 'Analyze my application performance and suggest improvements.',
  created_at: '2026-03-10T12:00:00.000Z',
  updated_at: '2026-03-10T12:00:00.000Z',
};

describe('SavedPromptCard', () => {
  const onApplyToInput = jest.fn();
  const onSendDirectly = jest.fn();
  const onDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render prompt name, content, and formatted created date', () => {
    render(
      <SavedPromptCard
        prompt={mockPrompt}
        variant="settings"
        onApplyToInput={onApplyToInput}
        onSendDirectly={onSendDirectly}
        onDelete={onDelete}
      />,
    );

    const expectedDate = new Date(mockPrompt.created_at).toLocaleDateString(
      undefined,
      {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      },
    );

    expect(screen.getByText('Performance Optimization')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Analyze my application performance and suggest improvements.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
    expect(screen.getByTestId('saved-prompt-card-sp-1')).toHaveAttribute(
      'data-has-divider',
      'false',
    );
  });

  it('should show divider styling when showDivider is true', () => {
    render(
      <SavedPromptCard
        prompt={mockPrompt}
        variant="settings"
        showDivider
        onApplyToInput={onApplyToInput}
        onSendDirectly={onSendDirectly}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByTestId('saved-prompt-card-sp-1')).toHaveAttribute(
      'data-has-divider',
      'true',
    );
  });

  it('should fall back to the raw date string when created_at is invalid', () => {
    render(
      <SavedPromptCard
        prompt={{
          ...mockPrompt,
          created_at: 'not-a-date',
        }}
        variant="settings"
        onApplyToInput={onApplyToInput}
        onSendDirectly={onSendDirectly}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText('not-a-date')).toBeInTheDocument();
  });

  it('should wire kebab menu actions to card handlers', () => {
    render(
      <SavedPromptCard
        prompt={mockPrompt}
        variant="settings"
        onApplyToInput={onApplyToInput}
        onSendDirectly={onSendDirectly}
        onDelete={onDelete}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Actions for Performance Optimization',
      }),
    );
    fireEvent.click(screen.getByText('Apply in input box'));

    expect(onApplyToInput).toHaveBeenCalledWith(
      'Analyze my application performance and suggest improvements.',
    );
  });
});
