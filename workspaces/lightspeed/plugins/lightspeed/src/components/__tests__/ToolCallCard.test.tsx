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
import { ToolCallCard } from '../ToolCallCard';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: jest.fn(() => mockUseTranslation()),
}));

// Mock clipboard API
Object.defineProperty(globalThis, 'navigator', {
  value: {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(undefined),
    },
  },
  writable: true,
});

describe('ToolCallCard', () => {
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

  test('should render collapsed by default', () => {
    render(<ToolCallCard toolCall={baseToolCall} />);

    // Header should be visible
    expect(
      screen.getByText('Tool response: fetch-catalog-entities'),
    ).toBeInTheDocument();

    // Detailed sections should not be visible when collapsed
    expect(screen.queryByText('Parameters')).not.toBeInTheDocument();
    expect(screen.queryByText('Response')).not.toBeInTheDocument();
    expect(
      screen.queryByText("Here's a summary of your response"),
    ).not.toBeInTheDocument();
  });

  test('should expand on click', () => {
    render(<ToolCallCard toolCall={baseToolCall} />);

    // Click on the header to expand
    const header = screen.getByRole('button', { expanded: false });
    fireEvent.click(header);

    // Detailed sections should now be visible
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('Response')).toBeInTheDocument();
    expect(screen.getByText(/Execution time:.*3\.00s/)).toBeInTheDocument();
    expect(
      screen.getByText("Here's a summary of your response"),
    ).toBeInTheDocument();
    expect(screen.getByText('Thought for 3 seconds')).toBeInTheDocument();
  });

  test('should show MCP Server and execution time when expanded', () => {
    render(<ToolCallCard toolCall={baseToolCall} />);

    // Expand the card
    const header = screen.getByRole('button', { expanded: false });
    fireEvent.click(header);

    // Check MCP Server is displayed in the expanded section
    expect(screen.getByText('MCP Server')).toBeInTheDocument();
    expect(screen.getByText(/Execution time:.*3\.00s/)).toBeInTheDocument();
  });

  test('should display parameters as tags', () => {
    render(<ToolCallCard toolCall={baseToolCall} />);

    // Expand the card
    const header = screen.getByRole('button', { expanded: false });
    fireEvent.click(header);

    // Check parameter tags are displayed (only non-empty ones)
    expect(screen.getByText('kind')).toBeInTheDocument();
    expect(screen.getByText('namespace')).toBeInTheDocument();

    // Empty values should not be shown as chips
    expect(screen.queryByText('type')).not.toBeInTheDocument();
  });

  test('should show loading state during tool execution', () => {
    const loadingToolCall: ToolCall = {
      ...baseToolCall,
      response: undefined,
      endTime: undefined,
      executionTime: undefined,
      isLoading: true,
    };

    render(<ToolCallCard toolCall={loadingToolCall} />);

    // Expand the card
    const header = screen.getByRole('button', { expanded: false });
    fireEvent.click(header);

    // Should show loading message
    expect(screen.getByText('Executing tool...')).toBeInTheDocument();
  });

  test('should truncate long responses with show more button', () => {
    const longResponse = 'A'.repeat(400); // More than 300 characters
    const longResponseToolCall: ToolCall = {
      ...baseToolCall,
      response: longResponse,
    };

    render(<ToolCallCard toolCall={longResponseToolCall} />);

    // Expand the card
    const header = screen.getByRole('button', { expanded: false });
    fireEvent.click(header);

    // Should show "show more" button
    expect(screen.getByText('show more')).toBeInTheDocument();

    // Click "show more"
    fireEvent.click(screen.getByText('show more'));

    // Should now show "show less"
    expect(screen.getByText('show less')).toBeInTheDocument();
  });

  test('should copy response to clipboard', async () => {
    render(<ToolCallCard toolCall={baseToolCall} />);

    // Expand the card
    const header = screen.getByRole('button', { expanded: false });
    fireEvent.click(header);

    // Find and click the copy button
    const copyButton = screen.getByLabelText('Copy response');
    fireEvent.click(copyButton);

    // Verify clipboard was called
    expect(globalThis.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'Found 5 users in the catalog',
    );
  });

  test('should format execution time correctly', () => {
    // Test milliseconds
    const fastToolCall: ToolCall = {
      ...baseToolCall,
      executionTime: 0.24,
    };

    render(<ToolCallCard toolCall={fastToolCall} />);

    // Expand the card
    const header = screen.getByRole('button', { expanded: false });
    fireEvent.click(header);

    expect(screen.getByText(/Execution time:.*240ms/)).toBeInTheDocument();
  });

  test('should collapse on second click', () => {
    render(<ToolCallCard toolCall={baseToolCall} />);

    // Expand the card
    const header = screen.getByRole('button', { expanded: false });
    fireEvent.click(header);

    // Verify expanded
    expect(screen.getByText('Parameters')).toBeInTheDocument();

    // Click again to collapse
    const expandedHeader = screen.getByRole('button', { expanded: true });
    fireEvent.click(expandedHeader);

    // Detailed sections should be hidden
    expect(screen.queryByText('Parameters')).not.toBeInTheDocument();
  });

  test('should handle keyboard navigation', () => {
    render(<ToolCallCard toolCall={baseToolCall} />);

    const header = screen.getByRole('button', { expanded: false });

    // Press Enter to expand
    fireEvent.keyDown(header, { key: 'Enter' });

    // Should be expanded
    expect(screen.getByText('Parameters')).toBeInTheDocument();
  });

  test('should show no parameters section when arguments are empty', () => {
    const noArgsToolCall: ToolCall = {
      ...baseToolCall,
      arguments: {},
    };

    render(<ToolCallCard toolCall={noArgsToolCall} />);

    // Expand the card
    const header = screen.getByRole('button', { expanded: false });
    fireEvent.click(header);

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

    render(<ToolCallCard toolCall={toolCallWithDescription} />);

    // Expand the card
    const header = screen.getByRole('button', { expanded: false });
    fireEvent.click(header);

    // Description should be visible
    expect(
      screen.getByText('Retrieve entities from catalog'),
    ).toBeInTheDocument();
  });
});
