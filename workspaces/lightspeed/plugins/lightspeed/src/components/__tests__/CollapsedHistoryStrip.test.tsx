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
import {
  CollapsedHistoryStrip,
  EditSquareIcon,
} from '../CollapsedHistoryStrip';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

describe('CollapsedHistoryStrip', () => {
  const mockOnExpand = jest.fn();
  const mockOnNewChat = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the collapsed history strip with expand and new chat buttons', () => {
    render(
      <CollapsedHistoryStrip
        onExpand={mockOnExpand}
        onNewChat={mockOnNewChat}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Expand chat history' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New chat' }),
    ).toBeInTheDocument();
  });

  it('should call onExpand when expand button is clicked', () => {
    render(
      <CollapsedHistoryStrip
        onExpand={mockOnExpand}
        onNewChat={mockOnNewChat}
      />,
    );

    const expandButton = screen.getByRole('button', {
      name: 'Expand chat history',
    });
    fireEvent.click(expandButton);

    expect(mockOnExpand).toHaveBeenCalledTimes(1);
  });

  it('should call onNewChat when new chat button is clicked', () => {
    render(
      <CollapsedHistoryStrip
        onExpand={mockOnExpand}
        onNewChat={mockOnNewChat}
      />,
    );

    const newChatButton = screen.getByRole('button', { name: 'New chat' });
    fireEvent.click(newChatButton);

    expect(mockOnNewChat).toHaveBeenCalledTimes(1);
  });

  it('should disable new chat button when newChatDisabled is true', () => {
    render(
      <CollapsedHistoryStrip
        onExpand={mockOnExpand}
        onNewChat={mockOnNewChat}
        newChatDisabled
      />,
    );

    const newChatButton = screen.getByRole('button', { name: 'New chat' });
    expect(newChatButton).toBeDisabled();
  });

  it('should not disable new chat button when newChatDisabled is false', () => {
    render(
      <CollapsedHistoryStrip
        onExpand={mockOnExpand}
        onNewChat={mockOnNewChat}
        newChatDisabled={false}
      />,
    );

    const newChatButton = screen.getByRole('button', { name: 'New chat' });
    expect(newChatButton).not.toBeDisabled();
  });

  it('should not call onNewChat when button is disabled', () => {
    render(
      <CollapsedHistoryStrip
        onExpand={mockOnExpand}
        onNewChat={mockOnNewChat}
        newChatDisabled
      />,
    );

    const newChatButton = screen.getByRole('button', { name: 'New chat' });
    fireEvent.click(newChatButton);

    expect(mockOnNewChat).not.toHaveBeenCalled();
  });
});

describe('EditSquareIcon', () => {
  it('should render the EditSquareIcon SVG', () => {
    const { container } = render(<EditSquareIcon />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('width', '1em');
    expect(svg).toHaveAttribute('height', '1em');
    expect(svg).toHaveAttribute('viewBox', '0 0 512 512');
  });

  it('should apply className when provided', () => {
    const { container } = render(<EditSquareIcon className="custom-class" />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('should have correct inline size style', () => {
    const { container } = render(<EditSquareIcon />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveStyle({ width: '16px', height: '16px' });
  });
});
