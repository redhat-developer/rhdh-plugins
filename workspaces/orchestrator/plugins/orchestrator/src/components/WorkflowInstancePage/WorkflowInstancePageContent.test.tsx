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

import { ProcessInstanceDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { WorkflowInstancePageContent } from './WorkflowInstancePageContent';

let cardHeightMode: 'fixed' | 'content' = 'fixed';

const mockOrchestratorApi = {
  getWorkflowDataInputSchema: jest.fn(),
  getWorkflowSource: jest.fn(),
};

jest.mock('@backstage/core-components', () => {
  const React = require('react');
  const WorkflowCard = ({
    children,
    className,
    cardClassName,
  }: {
    children?: unknown;
    className?: string;
    cardClassName?: string;
  }) =>
    React.createElement(
      'div',
      {
        'data-testid': 'workflow-card',
        className,
        'data-card-class': cardClassName,
      },
      children,
    );

  return {
    Content: ({ children }: { children?: unknown }) =>
      React.createElement('div', null, children),
    InfoCard: WorkflowCard,
    Link: ({ children }: { children?: unknown }) =>
      React.createElement('a', { href: '#' }, children),
  };
});

jest.mock('@backstage/core-plugin-api', () => ({
  ...jest.requireActual('@backstage/core-plugin-api'),
  useApi: () => mockOrchestratorApi,
}));

jest.mock('@backstage/plugin-permission-react', () => ({
  usePermission: () => ({ allowed: false, loading: false }),
}));

jest.mock('react-use', () => ({
  useAsync: () => ({ value: undefined, loading: false, error: undefined }),
}));

jest.mock('tss-react/mui', () => ({
  makeStyles: () => () => () => ({
    classes: {
      topRowCard: 'top-row-card',
      bottomRowCard: 'bottom-row-card',
      recommendedLabelContainer: 'recommended-label-container',
      recommendedLabel: 'recommended-label',
      cardClassName: 'card-overflow',
      contentModeCard: 'content-mode-card',
      contentCardOverflow: 'content-card-overflow',
      contentModeLayout: 'content-mode-layout',
      contentModeColumn: 'content-mode-column',
      titleContainer: 'title-container',
      detailsTitle: 'details-title',
    },
  }),
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../hooks/useWorkflowInstanceCardHeightMode', () => ({
  useWorkflowInstanceCardHeightMode: () => cardHeightMode,
}));

jest.mock('./VariablesDialog', () => ({
  VariablesDialog: () => null,
}));

jest.mock('./WorkflowInputs', () => {
  const React = require('react');
  return {
    WorkflowInputs: ({
      className,
      cardClassName,
    }: {
      className: string;
      cardClassName: string;
    }) =>
      React.createElement('div', {
        'data-testid': 'workflow-card',
        className,
        'data-card-class': cardClassName,
      }),
  };
});

jest.mock('./WorkflowInstanceProgressReactFlow', () => ({
  WorkflowInstanceProgressReactFlow: () => null,
}));

jest.mock('./WorkflowResult', () => {
  const React = require('react');
  return {
    WorkflowResult: ({
      className,
      cardClassName,
    }: {
      className: string;
      cardClassName: string;
    }) =>
      React.createElement('div', {
        'data-testid': 'workflow-card',
        className,
        'data-card-class': cardClassName,
      }),
  };
});

jest.mock('./WorkflowRunDetails', () => ({
  WorkflowRunDetails: () => null,
}));

const instance = {
  id: 'instance-1',
  processId: 'workflow-1',
  processName: 'Workflow',
  nodes: [],
} as ProcessInstanceDTO;

describe('WorkflowInstancePageContent', () => {
  beforeEach(() => {
    cardHeightMode = 'fixed';
    mockOrchestratorApi.getWorkflowDataInputSchema.mockResolvedValue({
      data: undefined,
    });
    mockOrchestratorApi.getWorkflowSource.mockResolvedValue({
      data: undefined,
    });
  });

  it('uses content-mode layout and overflow classes for content mode', () => {
    cardHeightMode = 'content';

    const { container } = render(
      <WorkflowInstancePageContent instance={instance} />,
    );

    expect(container.querySelector('.content-mode-layout')).toBeInTheDocument();
    expect(container.querySelector('.top-row-card')).not.toBeInTheDocument();
    expect(container.querySelector('.bottom-row-card')).not.toBeInTheDocument();

    const cards = screen.getAllByTestId('workflow-card');
    expect(cards).toHaveLength(4);
    cards.forEach(card => {
      expect(card).toHaveClass('content-mode-card');
      expect(card).toHaveAttribute('data-card-class', 'content-card-overflow');
    });
  });

  it('uses fixed-height card classes by default', () => {
    render(<WorkflowInstancePageContent instance={instance} />);

    expect(screen.getAllByTestId('workflow-card')).toHaveLength(4);
    expect(screen.getAllByTestId('workflow-card')[0]).toHaveClass(
      'top-row-card',
    );
    expect(screen.getAllByTestId('workflow-card')[1]).toHaveClass(
      'top-row-card',
    );
    expect(screen.getAllByTestId('workflow-card')[2]).toHaveClass(
      'bottom-row-card',
    );
    expect(screen.getAllByTestId('workflow-card')[3]).toHaveClass(
      'bottom-row-card',
    );
    screen.getAllByTestId('workflow-card').forEach(card => {
      expect(card).not.toHaveClass('content-mode-card');
      expect(card).toHaveAttribute('data-card-class', 'card-overflow');
    });
  });
});
