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
import { SavedPromptsEmptyState } from '../SavedPromptsEmptyState';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

describe('SavedPromptsEmptyState', () => {
  it('should render title, description, and new prompt button', () => {
    render(<SavedPromptsEmptyState onNewPrompt={jest.fn()} />);

    expect(screen.getByTestId('saved-prompts-empty-state')).toBeInTheDocument();
    expect(screen.getByText('No prompts')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Save frequently used prompts to quickly reuse them in your conversations without typing them again. Saved prompts also appear in the chat history panel for quick access.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('+ New prompt')).toBeInTheDocument();
  });

  it('should call onNewPrompt when the button is clicked', () => {
    const onNewPrompt = jest.fn();
    render(<SavedPromptsEmptyState onNewPrompt={onNewPrompt} />);

    fireEvent.click(screen.getByText('+ New prompt'));

    expect(onNewPrompt).toHaveBeenCalledTimes(1);
  });
});
