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
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ChatInput, ChatInputProps } from './ChatInput';

const theme = createTheme();

const defaultProps: ChatInputProps = {
  value: '',
  onChange: jest.fn(),
  onSend: jest.fn(),
  onStop: jest.fn(),
  placeholder: 'Type a message...',
  isTyping: false,
};

const renderChatInput = (props: Partial<ChatInputProps> = {}) => {
  return render(
    <ThemeProvider theme={theme}>
      <ChatInput {...defaultProps} {...props} />
    </ThemeProvider>,
  );
};

describe('ChatInput - Kagenti agent features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows agent chip when isKagenti and selectedModel is set', () => {
    renderChatInput({
      isKagenti: true,
      selectedModel: 'default/my-agent',
    });
    expect(screen.getByText('my-agent')).toBeInTheDocument();
  });

  it('shows full agent name when no slash in selectedModel', () => {
    renderChatInput({
      isKagenti: true,
      selectedModel: 'simple-agent',
    });
    expect(screen.getByText('simple-agent')).toBeInTheDocument();
  });

  it('prefers activeAgentName over selectedModel for chip label', () => {
    renderChatInput({
      isKagenti: true,
      selectedModel: 'default/my-agent',
      activeAgentName: 'Specialist',
    });
    expect(screen.getByText('Specialist')).toBeInTheDocument();
  });

  it('calls onClearAgent when chip delete is clicked', async () => {
    const onClearAgent = jest.fn();
    renderChatInput({
      isKagenti: true,
      selectedModel: 'default/my-agent',
      onClearAgent,
    });

    const chip = screen.getByText('my-agent').closest('.MuiChip-root');
    const deleteIcon = chip?.querySelector('.MuiChip-deleteIcon');
    expect(deleteIcon).toBeTruthy();
    await userEvent.click(deleteIcon!);
    expect(onClearAgent).toHaveBeenCalledTimes(1);
  });

  it('shows agent chip even when isKagenti is false if selectedModel is set', () => {
    renderChatInput({
      isKagenti: false,
      selectedModel: 'default/my-agent',
    });
    expect(screen.getByText('my-agent')).toBeInTheDocument();
  });

  it('does not show agent chip when no selectedModel', () => {
    renderChatInput({
      isKagenti: true,
    });
    const chips = screen.queryAllByRole('button');
    const agentChips = chips.filter(
      el => el.classList.contains('MuiChip-root'),
    );
    expect(agentChips).toHaveLength(0);
  });
});
