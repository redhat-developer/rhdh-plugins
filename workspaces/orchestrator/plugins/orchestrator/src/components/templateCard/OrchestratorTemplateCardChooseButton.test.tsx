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

import '@testing-library/jest-dom';

import { type ComponentProps } from 'react';
import { useAsync } from 'react-use';

import { TestApiProvider } from '@backstage/test-utils';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { orchestratorApiRef } from '../../api';
import { OrchestratorTemplateCardChooseButton } from './OrchestratorTemplateCardChooseButton';

jest.mock('react-use', () => ({
  useAsync: jest.fn(),
}));

jest.mock('@backstage/frontend-plugin-api', () => {
  const actual = jest.requireActual('@backstage/frontend-plugin-api');
  return {
    ...actual,
    useTranslationRef: () => ({
      t: (key: string) => key,
    }),
  };
});

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockUseAsync = useAsync as jest.Mock;
const mockGetWorkflowOverview = jest.fn();

const orchestratorTemplate = {
  metadata: {
    annotations: {
      'orchestrator.io/workflows': '["yamlgreet"]',
    },
  },
  spec: {
    steps: [
      {
        action: 'orchestrator:workflow:run',
        input: { workflow_id: 'yamlgreet' },
      },
    ],
  },
};

const renderChooseButton = (
  props: Partial<
    ComponentProps<typeof OrchestratorTemplateCardChooseButton>
  > = {},
) =>
  render(
    <TestApiProvider
      apis={[
        [orchestratorApiRef, { getWorkflowOverview: mockGetWorkflowOverview }],
      ]}
    >
      <OrchestratorTemplateCardChooseButton
        template={orchestratorTemplate}
        canCreateTask
        onSelected={jest.fn()}
        {...props}
      />
    </TestApiProvider>,
  );

describe('OrchestratorTemplateCardChooseButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAsync.mockReturnValue({ loading: false, value: undefined });
  });

  it('renders enabled Choose for non-orchestrator templates', () => {
    renderChooseButton({
      template: {
        metadata: { name: 'plain-template' },
        spec: { steps: [{ action: 'publish:github' }] },
      },
    });

    expect(
      screen.getByRole('button', { name: 'templateCard.chooseButtonText' }),
    ).toBeEnabled();
  });

  it('hides Choose when user cannot create from non-orchestrator templates', () => {
    renderChooseButton({
      template: {
        metadata: { name: 'plain-template' },
        spec: { steps: [{ action: 'publish:github' }] },
      },
      canCreateTask: false,
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('disables Choose for unavailable orchestrator workflow templates', () => {
    mockUseAsync.mockReturnValue({
      loading: false,
      value: {
        data: {
          isAvailable: false,
          availability: {
            isAvailable: false,
            statusCode: 503,
            urlToFetch: 'http://localhost:8899/management/processes/yamlgreet',
            reason: 'Service Unavailable',
          },
        },
      },
    });

    renderChooseButton();

    expect(
      screen.getByRole('button', { name: 'templateCard.chooseButtonText' }),
    ).toBeDisabled();
  });

  it('shows unavailable tooltip when orchestrator workflow is unavailable', async () => {
    mockUseAsync.mockReturnValue({
      loading: false,
      value: {
        data: {
          isAvailable: false,
        },
      },
    });

    renderChooseButton();

    const chooseButton = screen.getByRole('button', {
      name: 'templateCard.chooseButtonText',
    });
    await userEvent.hover(chooseButton.parentElement!);

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'workflow.unavailable.runTooltip',
    );
  });
});
