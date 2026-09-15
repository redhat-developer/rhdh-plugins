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

import type { WorkflowDataDTO } from '@red-hat-developer-hub/backstage-plugin-orchestrator-common';

import { VariablesDialog } from './VariablesDialog';

jest.mock('@backstage/core-components', () => ({
  Progress: () => null,
  ResponseErrorPanel: () => null,
}));

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../utils/isDarkMode', () => ({
  useIsDarkMode: () => false,
}));

jest.mock('../ui/InfoDialog', () => {
  const React = require('react');
  return {
    InfoDialog: ({
      children,
      dialogActions,
      open,
      title,
    }: {
      children?: unknown;
      dialogActions?: unknown;
      open: boolean;
      title: string;
    }) =>
      open
        ? React.createElement(
            'div',
            { role: 'dialog' },
            React.createElement('h2', null, title),
            children,
            dialogActions,
          )
        : null,
  };
});

jest.mock('../ui/JsonCodeBlock', () => {
  const React = require('react');
  return {
    JsonCodeBlock: ({ value }: { value: unknown }) =>
      React.createElement('pre', null, JSON.stringify(value)),
  };
});

describe('VariablesDialog', () => {
  it('renders instance variables in the open admin dialog', () => {
    render(
      <VariablesDialog
        open
        onClose={jest.fn()}
        instanceVariables={
          { input: { customer: 'Alice' } } as unknown as WorkflowDataDTO
        }
      />,
    );

    expect(screen.getByRole('dialog')).toHaveTextContent('run.variables');
    expect(screen.getByRole('dialog')).toHaveTextContent('Input');
    expect(screen.getByRole('dialog')).toHaveTextContent(
      '{"customer":"Alice"}',
    );
  });
});
