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
import { ToolCall } from '../../types';
import { ToolCallContent } from '../ToolCallContent';

// Mock clipboard API
Object.defineProperty(globalThis, 'navigator', {
  value: {
    clipboard: {
      writeText: jest.fn(),
    },
  },
  writable: true,
});

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

describe('ToolCallContent', () => {
  const baseToolCall: ToolCall = {
    id: 1,
    toolName: 'fetch-catalog-entities',
    arguments: {
      kind: 'User',
      type: '',
      namespace: 'default',
    },
    response: 'Found 5 users in the catalog',
    startTime: Date.now() - 3000,
    endTime: Date.now(),
    executionTime: 3,
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render summary text', () => {
    render(<ToolCallContent toolCall={baseToolCall} />);

    // Summary should be visible
    expect(
      screen.getByText("Here's a summary of your response"),
    ).toBeInTheDocument();
  });

  test('should show thinking time when available', () => {
    render(<ToolCallContent toolCall={baseToolCall} />);

    // Thinking time should be displayed
    expect(screen.getByText('Thought for 3 seconds')).toBeInTheDocument();
  });

  test('should show MCP Server and execution time', () => {
    render(<ToolCallContent toolCall={baseToolCall} />);

    // Check MCP Server is displayed
    expect(screen.getByText('MCP Server')).toBeInTheDocument();
    expect(screen.getByText(/Execution time:.*3\.00s/)).toBeInTheDocument();
  });

  test('should display parameters as tags', () => {
    render(<ToolCallContent toolCall={baseToolCall} />);

    // Check parameter tags are displayed (only non-empty ones)
    expect(screen.getByText('kind')).toBeInTheDocument();
    expect(screen.getByText('namespace')).toBeInTheDocument();

    // Empty values should not be shown as chips
    expect(screen.queryByText('type')).not.toBeInTheDocument();
  });

  test('should truncate long responses with show more button', () => {
    const longResponse = 'A'.repeat(400); // More than 300 characters
    const longResponseToolCall: ToolCall = {
      ...baseToolCall,
      response: longResponse,
    };

    render(<ToolCallContent toolCall={longResponseToolCall} />);

    // Should show "show more" button
    expect(screen.getByText('show more')).toBeInTheDocument();

    // Click "show more"
    fireEvent.click(screen.getByText('show more'));

    // Should now show "show less"
    expect(screen.getByText('show less')).toBeInTheDocument();
  });

  test('should format execution time correctly in milliseconds', () => {
    // Test milliseconds
    const fastToolCall: ToolCall = {
      ...baseToolCall,
      executionTime: 0.24,
    };

    render(<ToolCallContent toolCall={fastToolCall} />);

    expect(screen.getByText(/Execution time:.*240ms/)).toBeInTheDocument();
  });

  test('should handle keyboard navigation for show more button', () => {
    const longResponse = 'A'.repeat(400);
    const longResponseToolCall: ToolCall = {
      ...baseToolCall,
      response: longResponse,
    };

    render(<ToolCallContent toolCall={longResponseToolCall} />);

    const showMoreButton = screen.getByText('show more');

    // Press Enter to toggle
    fireEvent.keyDown(showMoreButton, { key: 'Enter' });

    // Should now show "show less"
    expect(screen.getByText('show less')).toBeInTheDocument();
  });

  test('should show no parameters section when arguments are empty', () => {
    const noArgsToolCall: ToolCall = {
      ...baseToolCall,
      arguments: {},
    };

    render(<ToolCallContent toolCall={noArgsToolCall} />);

    // Parameters section should not be displayed
    expect(screen.queryByText('Parameters')).not.toBeInTheDocument();

    // Response should still be visible
    expect(screen.getByText('Response')).toBeInTheDocument();
  });

  test('should display description when provided', () => {
    const toolCallWithDescription: ToolCall = {
      ...baseToolCall,
      description: 'Retrieve entities from catalog',
    };

    render(<ToolCallContent toolCall={toolCallWithDescription} />);

    // Description should be visible
    expect(
      screen.getByText('Retrieve entities from catalog'),
    ).toBeInTheDocument();
  });

  test('should not show thinking time when not available', () => {
    const noThinkingTimeToolCall: ToolCall = {
      ...baseToolCall,
      startTime: Date.now(),
      endTime: undefined,
    };

    render(<ToolCallContent toolCall={noThinkingTimeToolCall} />);

    // Thinking time should not be displayed
    expect(screen.queryByText(/Thought for/)).not.toBeInTheDocument();
  });

  test('should not show response section when no response', () => {
    const noResponseToolCall: ToolCall = {
      ...baseToolCall,
      response: undefined,
    };

    render(<ToolCallContent toolCall={noResponseToolCall} />);

    // Response section should not be displayed
    expect(screen.queryByText('Response')).not.toBeInTheDocument();
  });

  test('should show copy button and copy response when clicked', async () => {
    render(<ToolCallContent toolCall={baseToolCall} />);

    // Copy button should be visible
    const copyButton = screen.getByRole('button', { name: 'Copy response' });
    expect(copyButton).toBeInTheDocument();

    // Click the copy button
    fireEvent.click(copyButton);

    // Verify clipboard was called
    expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Found 5 users in the catalog',
    );
  });

  test('should not show copy button when no response', () => {
    const noResponseToolCall: ToolCall = {
      ...baseToolCall,
      response: undefined,
    };

    render(<ToolCallContent toolCall={noResponseToolCall} />);

    // Copy button should not be visible
    expect(
      screen.queryByRole('button', { name: 'Copy response' }),
    ).not.toBeInTheDocument();
  });
});
