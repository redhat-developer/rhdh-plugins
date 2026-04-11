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
import { AgentCard } from './AgentCard';
import type { AgentWithCard } from './agentUtils';

const theme = createTheme();

function makeAgent(overrides: Partial<AgentWithCard> = {}): AgentWithCard {
  return {
    name: 'test-agent',
    namespace: 'default',
    description: 'A test agent',
    status: 'Running',
    labels: { protocol: ['a2a'], framework: 'LangGraph' },
    ...overrides,
  };
}

function renderCard(
  props: Partial<React.ComponentProps<typeof AgentCard>> = {},
) {
  const defaultProps: React.ComponentProps<typeof AgentCard> = {
    agent: makeAgent(),
    isPinned: false,
    onSelect: jest.fn(),
    onTogglePin: jest.fn(),
    onInfo: jest.fn(),
    index: 0,
    ...props,
  };
  return render(
    <ThemeProvider theme={theme}>
      <AgentCard {...defaultProps} />
    </ThemeProvider>,
  );
}

describe('AgentCard', () => {
  it('renders agent name', () => {
    renderCard();
    expect(screen.getByText('test-agent')).toBeInTheDocument();
  });

  it('renders agentCard.name when available', () => {
    const agent = makeAgent({
      agentCard: {
        name: 'Pretty Name',
        version: '2.0',
        url: 'http://localhost:8080',
        streaming: false,
        skills: [],
      },
    });
    renderCard({ agent });
    expect(screen.getByText('Pretty Name')).toBeInTheDocument();
  });

  it('renders Ready status for running agents', () => {
    renderCard();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('renders protocol badge', () => {
    renderCard();
    expect(screen.getByText('A2A')).toBeInTheDocument();
  });

  it('calls onInfo when card is clicked (onInfo provided)', async () => {
    const onInfo = jest.fn();
    const onSelect = jest.fn();
    renderCard({ onInfo, onSelect });
    const user = userEvent.setup();
    const actionArea = screen.getByRole('button', { name: /test-agent/i });
    await user.click(actionArea);
    expect(onInfo).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'test-agent' }),
    );
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('calls onSelect when card is clicked (no onInfo)', async () => {
    const onSelect = jest.fn();
    renderCard({ onSelect, onInfo: undefined });
    const user = userEvent.setup();
    const actionArea = screen.getByRole('button', { name: /test-agent/i });
    await user.click(actionArea);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'test-agent' }),
    );
  });

  it('calls onTogglePin when pin button is clicked', async () => {
    const onTogglePin = jest.fn();
    renderCard({ onTogglePin });
    const user = userEvent.setup();
    const pinButton = screen.getByRole('button', { name: /pin agent/i });
    await user.click(pinButton);
    expect(onTogglePin).toHaveBeenCalledWith(
      'default/test-agent',
      expect.anything(),
    );
  });

  it('renders star icon when pinned', () => {
    renderCard({ isPinned: true });
    expect(
      screen.getByRole('button', { name: /unpin agent/i }),
    ).toBeInTheDocument();
  });

  it('shows reduced opacity for non-ready agents', () => {
    const agent = makeAgent({ status: 'Failed' });
    const { container } = renderCard({ agent });
    const card = container.querySelector('[role="listitem"]');
    expect(card).toBeTruthy();
  });

  it('displays avatar initial from display name', () => {
    renderCard();
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('shows description text', () => {
    renderCard();
    expect(screen.getByText('A test agent')).toBeInTheDocument();
  });
});
