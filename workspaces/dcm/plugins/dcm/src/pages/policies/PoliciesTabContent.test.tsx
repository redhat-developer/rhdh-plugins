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
import type { Policy } from '@red-hat-developer-hub/backstage-plugin-dcm-common';
import { policyManagerApiRef } from '../../apis';
import { PoliciesTabContent } from './PoliciesTabContent';

jest.mock('../../hooks/useTranslation', () => {
  const mod = require('../../test-utils/mockTranslations');
  return { useTranslation: mod.mockUseTranslation };
});

const MOCK_POLICY: Policy = {
  id: 'policy-1',
  display_name: 'Test Policy',
  description: 'A test policy',
  policy_type: 'GLOBAL',
  enabled: true,
  priority: 100,
};

const UPDATED_POLICY: Policy = { ...MOCK_POLICY, enabled: false };

const baseMockApi = {
  listPolicies: jest.fn().mockResolvedValue({ policies: [MOCK_POLICY] }),
  updatePolicy: jest.fn(),
  createPolicy: jest.fn(),
  deletePolicy: jest.fn(),
};

function buildMockApi(overrides: Partial<typeof baseMockApi> = {}) {
  return { ...baseMockApi, ...overrides };
}

async function renderPoliciesTab(
  mockApi: ReturnType<typeof buildMockApi> = buildMockApi(),
) {
  return renderInTestApp(
    <TestApiProvider apis={[[policyManagerApiRef, mockApi]]}>
      <PoliciesTabContent />
    </TestApiProvider>,
  );
}

describe('PoliciesTabContent – toggle error handling', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows an inline error alert when updatePolicy fails on toggle', async () => {
    const mockApi = buildMockApi({
      updatePolicy: jest.fn().mockRejectedValue(new Error('toggle failed')),
    });
    await renderPoliciesTab(mockApi);

    // Wait for the table row to appear
    const toggleSwitch = await screen.findByRole('checkbox', {
      name: /disable/i,
    });
    fireEvent.click(toggleSwitch);

    // The snackbar should show the error text
    await waitFor(() =>
      expect(screen.getByText(/toggle failed/i)).toBeInTheDocument(),
    );
  });

  it('does not show a snackbar when updatePolicy succeeds', async () => {
    const mockApi = buildMockApi({
      updatePolicy: jest.fn().mockResolvedValue(UPDATED_POLICY),
    });
    await renderPoliciesTab(mockApi);

    const toggleSwitch = await screen.findByRole('checkbox', {
      name: /disable/i,
    });
    fireEvent.click(toggleSwitch);

    await waitFor(() => expect(mockApi.updatePolicy).toHaveBeenCalledTimes(1));

    // No error snackbar should be visible
    expect(screen.queryByText(/toggle failed/i)).not.toBeInTheDocument();
  });

  it('dismisses the snackbar when the close button is clicked', async () => {
    const mockApi = buildMockApi({
      updatePolicy: jest.fn().mockRejectedValue(new Error('dismiss me')),
    });
    await renderPoliciesTab(mockApi);

    const toggleSwitch = await screen.findByRole('checkbox', {
      name: /disable/i,
    });
    fireEvent.click(toggleSwitch);

    // Wait for snackbar to appear
    const errorMsg = await screen.findByText(/dismiss me/i);
    expect(errorMsg).toBeInTheDocument();

    // MuiAlert renders a close button with aria-label "Close"
    const closeBtn = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeBtn);

    await waitFor(() =>
      expect(screen.queryByText(/dismiss me/i)).not.toBeInTheDocument(),
    );
  });
});
