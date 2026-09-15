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

import { WorkflowInputs } from './WorkflowInputs';

jest.mock('@backstage/core-components', () => {
  const React = require('react');
  return {
    InfoCard: ({
      children,
      subheader,
      title,
    }: {
      children?: unknown;
      subheader?: unknown;
      title?: unknown;
    }) =>
      React.createElement(
        'section',
        null,
        React.createElement('h2', null, title),
        subheader,
        children,
      ),
    Progress: () => null,
    ResponseErrorPanel: () => null,
    StructuredMetadataTable: ({ metadata }: { metadata: unknown }) =>
      React.createElement('pre', null, JSON.stringify(metadata)),
  };
});

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('tss-react/mui', () => ({
  makeStyles: () => () => () => ({
    classes: { metadataTable: 'metadata-table' },
  }),
}));

describe('WorkflowInputs', () => {
  it('renders the input data returned for a workflow instance', () => {
    render(
      <WorkflowInputs
        className="inputs-card"
        cardClassName="card-overflow"
        value={{ data: { customer: 'Alice', retries: 2 } }}
        loading={false}
        responseError={undefined}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'run.inputs' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/"customer":"Alice"/)).toBeInTheDocument();
    expect(screen.getByText(/"retries":2/)).toBeInTheDocument();
  });
});
