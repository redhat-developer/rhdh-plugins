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
import type { JSONSchema7 } from 'json-schema';

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
    classes: {
      metadataTable: 'metadata-table',
      section: 'section',
      sectionTitle: 'section-title',
      row: 'row',
      label: 'label',
      value: 'value',
      nestedSection: 'nested-section',
    },
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
    expect(screen.getByText('customer:')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('retries:')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders nested schema labels and includes ui:hidden fields', () => {
    const inputSchema: JSONSchema7 = {
      type: 'object',
      properties: {
        details: {
          type: 'object',
          title: 'Details',
          properties: {
            name: {
              type: 'string',
              title: 'Name',
            },
            hiddenValue: {
              type: 'string',
              title: 'Hidden value',
              'ui:hidden': true,
            } as JSONSchema7 & { 'ui:hidden': boolean },
            enabled: {
              type: 'boolean',
              title: 'Enabled',
            },
            tags: {
              type: 'array',
              title: 'Tags',
              items: { type: 'string' },
            },
          },
        },
      },
    };

    render(
      <WorkflowInputs
        className=""
        cardClassName=""
        loading={false}
        responseError={undefined}
        value={{
          inputSchema,
          data: {
            details: {
              name: 'Nested input',
              hiddenValue: 'Visible in the input card',
              enabled: true,
              tags: ['one', 'two'],
            },
          },
        }}
      />,
    );

    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.getByText('Nested input')).toBeInTheDocument();
    expect(screen.getByText('Hidden value:')).toBeInTheDocument();
    expect(screen.getByText('Visible in the input card')).toBeInTheDocument();
    expect(screen.getByText('Enabled:')).toBeInTheDocument();
    expect(screen.getByText('true')).toBeInTheDocument();
    expect(screen.getByText('Tags:')).toBeInTheDocument();
    expect(screen.getByText('["one","two"]')).toBeInTheDocument();
  });

  it('renders inputs without a schema using the fallback display data', () => {
    render(
      <WorkflowInputs
        className=""
        cardClassName=""
        loading={false}
        responseError={undefined}
        value={{
          data: {
            enabled: false,
            tags: ['one', 'two'],
          },
        }}
      />,
    );

    expect(screen.getByText('enabled:')).toBeInTheDocument();
    expect(screen.getByText('false')).toBeInTheDocument();
    expect(screen.getByText('tags:')).toBeInTheDocument();
    expect(screen.getByText('["one","two"]')).toBeInTheDocument();
  });
});
