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

import { screen, fireEvent, waitFor } from '@testing-library/react';
import { TestApiProvider, renderInTestApp } from '@backstage/test-utils';
import type { Agent } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { agentsApiRef, catalogApiRef } from '../../apis';
import { AgentsTabContent } from './AgentsTabContent';

jest.mock('../../hooks/useTranslation', () => {
  const mod = require('../../test-utils/mockTranslations');
  return { useTranslation: mod.mockUseTranslation };
});

const MOCK_AGENT: Agent = {
  agent_id: 'a1b2c3d4',
  name: 'env-agent-west-1',
  environment: 'production',
  service_types: ['vm', 'container'],
  cost: 'medium',
  topic_name: 'dcm.agent.env-agent-west-1',
  health_status: 'ready',
};

const baseCatalogApi = {
  listServiceTypes: jest
    .fn()
    .mockResolvedValue({ results: [], next_page_token: undefined }),
  getServiceType: jest.fn(),
  createServiceType: jest.fn(),
  listCatalogItems: jest.fn(),
  getCatalogItem: jest.fn(),
  createCatalogItem: jest.fn(),
  updateCatalogItem: jest.fn(),
  deleteCatalogItem: jest.fn(),
  listCatalogItemInstances: jest.fn(),
  getCatalogItemInstance: jest.fn(),
  createCatalogItemInstance: jest.fn(),
  rehydrateCatalogItemInstance: jest.fn(),
  deleteCatalogItemInstance: jest.fn(),
};

const baseAgentsApi = {
  listAgents: jest.fn().mockResolvedValue({
    agents: [MOCK_AGENT],
    next_page_token: undefined,
  }),
  createAgent: jest.fn(),
  getAgent: jest.fn(),
  agentHeartbeat: jest.fn(),
};

function buildApis(overrides: Partial<typeof baseAgentsApi> = {}) {
  return {
    agents: { ...baseAgentsApi, ...overrides },
    catalog: baseCatalogApi,
  };
}

async function renderAgentsTab(
  apis: ReturnType<typeof buildApis> = buildApis(),
) {
  return renderInTestApp(
    <TestApiProvider
      apis={[
        [agentsApiRef, apis.agents],
        [catalogApiRef, apis.catalog],
      ]}
    >
      <AgentsTabContent />
    </TestApiProvider>,
  );
}

describe('AgentsTabContent', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('initial load', () => {
    it('calls listAgents with pagination params on mount', async () => {
      const apis = buildApis();
      await renderAgentsTab(apis);

      await waitFor(() =>
        expect(apis.agents.listAgents).toHaveBeenCalledTimes(1),
      );
      expect(apis.agents.listAgents).toHaveBeenCalledWith(
        expect.objectContaining({ max_page_size: expect.any(Number) }),
      );
    });

    it('shows agent name in the table after successful load', async () => {
      const apis = buildApis();
      await renderAgentsTab(apis);

      expect(await screen.findByText('env-agent-west-1')).toBeInTheDocument();
    });

    it('shows the empty state when no agents are returned', async () => {
      const apis = buildApis({
        listAgents: jest.fn().mockResolvedValue({ agents: [] }),
      });
      await renderAgentsTab(apis);

      expect(
        await screen.findByText(/no agents registered/i),
      ).toBeInTheDocument();
    });
  });

  describe('load error', () => {
    it('shows an error alert when listAgents rejects', async () => {
      const apis = buildApis({
        listAgents: jest.fn().mockRejectedValue(new Error('API down')),
      });
      await renderAgentsTab(apis);

      expect(await screen.findByText(/API down/i)).toBeInTheDocument();
    });

    it('shows a Retry button when listAgents rejects', async () => {
      const apis = buildApis({
        listAgents: jest.fn().mockRejectedValue(new Error('API down')),
      });
      await renderAgentsTab(apis);

      expect(
        await screen.findByRole('button', { name: /retry/i }),
      ).toBeInTheDocument();
    });
  });

  describe('cursor pagination', () => {
    it('shows Next button when next_page_token is returned', async () => {
      const apis = buildApis({
        listAgents: jest.fn().mockResolvedValue({
          agents: [MOCK_AGENT],
          next_page_token: 'tok-2',
        }),
      });
      await renderAgentsTab(apis);

      expect(
        await screen.findByRole('button', { name: /next/i }),
      ).toBeInTheDocument();
    });

    it('Next button is disabled when no next_page_token', async () => {
      const apis = buildApis({
        listAgents: jest.fn().mockResolvedValue({
          agents: [MOCK_AGENT],
          next_page_token: '',
        }),
      });
      await renderAgentsTab(apis);

      const nextBtn = await screen.findByRole('button', { name: /next/i });
      expect(nextBtn).toBeDisabled();
    });

    it('calls listAgents with next_page_token after clicking Next', async () => {
      const listAgents = jest
        .fn()
        .mockResolvedValueOnce({
          agents: [MOCK_AGENT],
          next_page_token: 'tok-2',
        })
        .mockResolvedValueOnce({
          agents: [MOCK_AGENT],
          next_page_token: '',
        });
      const apis = buildApis({ listAgents });
      await renderAgentsTab(apis);

      const nextBtn = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextBtn);

      await waitFor(() =>
        expect(listAgents).toHaveBeenCalledWith(
          expect.objectContaining({ page_token: 'tok-2' }),
        ),
      );
    });

    it('Previous button is disabled on the first page', async () => {
      const apis = buildApis({
        listAgents: jest.fn().mockResolvedValue({
          agents: [MOCK_AGENT],
          next_page_token: 'tok-2',
        }),
      });
      await renderAgentsTab(apis);

      const prevBtn = await screen.findByRole('button', { name: /previous/i });
      expect(prevBtn).toBeDisabled();
    });

    it('Previous button is enabled after navigating to page 2', async () => {
      const listAgents = jest
        .fn()
        .mockResolvedValueOnce({
          agents: [MOCK_AGENT],
          next_page_token: 'tok-2',
        })
        .mockResolvedValueOnce({
          agents: [MOCK_AGENT],
          next_page_token: '',
        });
      const apis = buildApis({ listAgents });
      await renderAgentsTab(apis);

      const nextBtn = await screen.findByRole('button', { name: /next/i });
      fireEvent.click(nextBtn);

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: /previous/i }),
        ).not.toBeDisabled(),
      );
    });
  });

  describe('health-status filter', () => {
    it('calls listAgents with health_status when a filter is selected', async () => {
      const listAgents = jest
        .fn()
        .mockResolvedValue({ agents: [MOCK_AGENT], next_page_token: '' });
      const apis = buildApis({ listAgents });
      await renderAgentsTab(apis);

      await waitFor(() => expect(listAgents).toHaveBeenCalledTimes(1));

      const filterInput = document.querySelector(
        '[data-testid="health-filter"]',
      ) as HTMLInputElement;
      fireEvent.change(filterInput, { target: { value: 'ready' } });

      await waitFor(() =>
        expect(listAgents).toHaveBeenCalledWith(
          expect.objectContaining({ health_status: 'ready' }),
        ),
      );
    });

    it('calls listAgents without health_status when "All" is selected', async () => {
      const listAgents = jest
        .fn()
        .mockResolvedValue({ agents: [MOCK_AGENT], next_page_token: '' });
      const apis = buildApis({ listAgents });
      await renderAgentsTab(apis);

      const filterInput = document.querySelector(
        '[data-testid="health-filter"]',
      ) as HTMLInputElement;
      fireEvent.change(filterInput, { target: { value: 'ready' } });
      await waitFor(() => expect(listAgents).toHaveBeenCalledTimes(2));

      fireEvent.change(filterInput, { target: { value: '' } });

      await waitFor(() =>
        expect(listAgents).toHaveBeenCalledWith(
          expect.not.objectContaining({ health_status: expect.anything() }),
        ),
      );
    });
  });
});
