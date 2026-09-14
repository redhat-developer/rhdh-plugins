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

import { render, screen } from '@testing-library/react';

import { InputSchemaCard } from './InputSchemaCard';

let mockAsyncState: {
  value?: { inputSchema?: object };
  loading: boolean;
  error?: Error;
} = {
  value: undefined,
  loading: false,
};
const mockGetWorkflowDataInputSchema = jest.fn();

jest.mock('@backstage/core-components', () => ({
  Progress: () => null,
  ResponseErrorPanel: () => null,
}));

jest.mock('@backstage/core-plugin-api', () => ({
  useApi: () => ({
    getWorkflowDataInputSchema: mockGetWorkflowDataInputSchema,
  }),
}));

jest.mock('../../api', () => ({
  orchestratorApiRef: {},
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../utils/isDarkMode', () => ({
  useIsDarkMode: () => false,
}));

jest.mock('react-use', () => ({
  useAsync: (asyncFn: () => Promise<unknown>) => {
    void asyncFn();
    return mockAsyncState;
  },
}));

jest.mock('../ui/FullWidthInfoCard', () => {
  const React = require('react');
  return {
    FullWidthInfoCard: ({
      children,
      title,
    }: {
      children?: unknown;
      title?: unknown;
    }) =>
      React.createElement(
        'section',
        null,
        React.createElement('h2', null, title),
        children,
      ),
  };
});

jest.mock('../ui/InfoCardTitleWithTooltip', () => ({
  InfoCardTitleWithTooltip: ({ title }: { title: string }) => title,
}));

jest.mock('../ui/JsonCodeBlock', () => {
  const React = require('react');
  return {
    JsonCodeBlock: ({ value }: { value: object }) =>
      React.createElement('pre', null, JSON.stringify(value)),
  };
});

describe('InputSchemaCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetWorkflowDataInputSchema.mockResolvedValue({
      data: {
        inputSchema: {
          type: 'object',
          properties: { name: { type: 'string' } },
        },
      },
    });
  });

  it('renders the input schema returned for the workflow', () => {
    mockAsyncState = {
      value: {
        inputSchema: {
          type: 'object',
          properties: { name: { type: 'string' } },
        },
      },
      loading: false,
    };

    render(<InputSchemaCard workflowId="greeting" />);

    expect(
      screen.getByRole('heading', { name: 'workflow.inputSchema' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/"name"/)).toBeInTheDocument();
    expect(mockGetWorkflowDataInputSchema).toHaveBeenCalledWith('greeting');
  });
});
