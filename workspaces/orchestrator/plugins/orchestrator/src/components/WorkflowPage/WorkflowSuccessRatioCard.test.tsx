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

import { WorkflowOverviewDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { WorkflowSuccessRatioCard } from './WorkflowSuccessRatioCard';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: { totalCount?: string }) =>
      key === 'workflow.ofTotal' ? `of ${params?.totalCount}` : key,
  }),
}));

jest.mock('@mui/material/Box', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children?: unknown }) =>
      React.createElement('div', null, children),
  };
});

jest.mock('@mui/material/Skeleton', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('span', null, 'loading'),
  };
});

jest.mock('@mui/material/Typography', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children }: { children?: unknown }) =>
      React.createElement('span', null, children),
  };
});

jest.mock('@mui/material/styles', () => ({
  useTheme: () => ({
    palette: {
      error: { main: 'red' },
      success: { main: 'green' },
    },
  }),
}));

jest.mock('tss-react/mui', () => ({
  makeStyles: () => () => () => ({
    classes: { legendSwatch: 'legend-swatch' },
  }),
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

describe('WorkflowSuccessRatioCard', () => {
  it('renders success statistics when the workflow has run data', () => {
    const workflowOverview = {
      workflowId: 'greeting',
      format: 'yaml',
      workflowRunStats: {
        successRatio: 0.75,
        successCount: 3,
        errorCount: 1,
        totalCount: 4,
      },
    } as WorkflowOverviewDTO;

    render(
      <WorkflowSuccessRatioCard
        workflowOverview={workflowOverview}
        loading={false}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'workflow.successRatio' }),
    ).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('of 4')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('workflow.statsSuccess')).toBeInTheDocument();
    expect(screen.getByText('workflow.statsFailed')).toBeInTheDocument();
  });
});
