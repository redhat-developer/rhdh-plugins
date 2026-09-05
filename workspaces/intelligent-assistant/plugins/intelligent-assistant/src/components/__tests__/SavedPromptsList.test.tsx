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
import { render, screen } from '@testing-library/react';

import { mockUseTranslation } from '../../test-utils/mockTranslations';
import { SavedPromptsList } from '../SavedPromptsList';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

const mockPrompts = [
  {
    id: 'sp-1',
    name: 'Performance Optimization',
    content: 'Analyze my application performance and suggest improvements.',
    created_at: '2026-03-10T12:00:00Z',
    updated_at: '2026-03-10T12:00:00Z',
  },
];

describe('SavedPromptsList', () => {
  const defaultHandlers = {
    onApplyToInput: jest.fn(),
    onSendDirectly: jest.fn(),
    onDelete: jest.fn(),
  };

  it('should show loading spinner when loading', () => {
    render(
      <SavedPromptsList
        prompts={[]}
        loading
        error={null}
        {...defaultHandlers}
      />,
    );
    expect(
      screen.getByTestId('saved-prompts-list-loading'),
    ).toBeInTheDocument();
  });

  it('should show error alert when error is set', () => {
    render(
      <SavedPromptsList
        prompts={[]}
        loading={false}
        error="Failed to load"
        {...defaultHandlers}
      />,
    );
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });

  it('should render nothing when no prompts', () => {
    const { container } = render(
      <SavedPromptsList
        prompts={[]}
        loading={false}
        error={null}
        {...defaultHandlers}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('should render prompt cards when prompts exist', () => {
    render(
      <SavedPromptsList
        prompts={mockPrompts}
        loading={false}
        error={null}
        {...defaultHandlers}
      />,
    );
    expect(screen.getByText('Performance Optimization')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Analyze my application performance and suggest improvements.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('saved-prompt-card-sp-1')).toBeInTheDocument();
  });
});
