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
import { AgentDetailDrawer } from './AgentDetailDrawer';
import type { AgentWithCard } from './agentUtils';

const theme = createTheme();

function makeAgent(overrides: Partial<AgentWithCard> = {}): AgentWithCard {
  return {
    name: 'drawer-agent',
    namespace: 'prod',
    description: 'An agent for the drawer test',
    status: 'Running',
    labels: { protocol: ['a2a'], framework: 'CrewAI' },
    ...overrides,
  };
}

function renderDrawer(
  props: Partial<React.ComponentProps<typeof AgentDetailDrawer>> = {},
) {
  const defaultProps: React.ComponentProps<typeof AgentDetailDrawer> = {
    agent: makeAgent(),
    open: true,
    onClose: jest.fn(),
    onStartConversation: jest.fn(),
    ...props,
  };
  return render(
    <ThemeProvider theme={theme}>
      <AgentDetailDrawer {...defaultProps} />
    </ThemeProvider>,
  );
}

describe('AgentDetailDrawer', () => {
  it('renders nothing when agent is null', () => {
    renderDrawer({ agent: null });
    expect(screen.queryByText('drawer-agent')).not.toBeInTheDocument();
  });

  it('renders agent display name and namespace', () => {
    renderDrawer();
    expect(screen.getAllByText('drawer-agent').length).toBeGreaterThanOrEqual(
      1,
    );
    expect(screen.getAllByText('prod').length).toBeGreaterThanOrEqual(1);
  });

  it('uses agentCard.name when available', () => {
    const agent = makeAgent({
      agentCard: {
        name: 'Friendly Name',
        version: '3.0',
        url: 'http://example.com',
        streaming: true,
        skills: [],
      },
    });
    renderDrawer({ agent });
    expect(screen.getByText('Friendly Name')).toBeInTheDocument();
    expect(screen.getByText('v3.0')).toBeInTheDocument();
  });

  it('renders status chip', () => {
    renderDrawer();
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('renders protocol label', () => {
    renderDrawer();
    expect(screen.getByText('A2A')).toBeInTheDocument();
  });

  it('renders description', () => {
    renderDrawer();
    expect(
      screen.getByText('An agent for the drawer test'),
    ).toBeInTheDocument();
  });

  it('renders skills section with skills', () => {
    const agent = makeAgent({
      agentCard: {
        name: 'Skill Agent',
        version: '1',
        url: '',
        streaming: false,
        skills: [
          { id: 's1', name: 'Summarize', description: 'Summarizes text' },
          { id: 's2', name: 'Translate' },
        ],
      },
    });
    renderDrawer({ agent });
    expect(screen.getByText('Summarize')).toBeInTheDocument();
    expect(screen.getByText('Summarizes text')).toBeInTheDocument();
    expect(screen.getByText('Translate')).toBeInTheDocument();
  });

  it('renders "Try asking" example chips', () => {
    const agent = makeAgent({
      agentCard: {
        name: 'Example Agent',
        version: '1',
        url: '',
        streaming: false,
        skills: [
          {
            id: 's1',
            name: 'Q&A',
            examples: ['What is the weather?', 'Tell me a joke'],
          },
        ],
      },
    });
    renderDrawer({ agent });
    expect(screen.getByText('What is the weather?')).toBeInTheDocument();
    expect(screen.getByText('Tell me a joke')).toBeInTheDocument();
  });

  it('renders Start Conversation button', () => {
    renderDrawer();
    expect(
      screen.getByRole('button', { name: /start conversation/i }),
    ).toBeInTheDocument();
  });

  it('calls onStartConversation and onClose when CTA is clicked', async () => {
    const onStartConversation = jest.fn();
    const onClose = jest.fn();
    renderDrawer({ onStartConversation, onClose });
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('button', { name: /start conversation/i }),
    );
    expect(onStartConversation).toHaveBeenCalledWith(
      'prod/drawer-agent',
      'drawer-agent',
    );
    expect(onClose).toHaveBeenCalled();
  });

  it('renders warning text for non-ready agents', () => {
    const agent = makeAgent({ status: 'Pending' });
    renderDrawer({ agent });
    expect(
      screen.getByText(/pending and may not respond/i),
    ).toBeInTheDocument();
  });

  it('does not render warning for ready agents', () => {
    renderDrawer();
    expect(screen.queryByText(/may not respond/i)).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    renderDrawer({ onClose });
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders framework in capabilities', () => {
    renderDrawer();
    expect(screen.getByText('CrewAI')).toBeInTheDocument();
  });
});
