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

import { ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import MissingSchemaNotice from './MissingSchemaNotice';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock(
  '@red-hat-developer-hub/backstage-plugin-orchestrator-form-react',
  () => ({
    SubmitButton: ({
      children,
      handleClick,
      submitting,
    }: {
      children: ReactNode;
      handleClick: () => void;
      submitting?: boolean;
    }) => (
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting ?? false}
        data-testid="submit-button"
      >
        {children}
      </button>
    ),
  }),
);

describe('MissingSchemaNotice', () => {
  it('renders the missing schema guidance and run button', () => {
    render(
      <MissingSchemaNotice
        isExecuting={false}
        handleExecute={jest.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(
      screen.getByText('messages.missingJsonSchema.title'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/messages\.missingJsonSchema\.message/),
    ).toBeInTheDocument();
    expect(screen.getByText('dataInputSchema')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'common.run' }),
    ).toBeInTheDocument();
  });

  it('invokes handleExecute with empty payload when run is clicked', () => {
    const handleExecute = jest.fn().mockResolvedValue(undefined);

    render(
      <MissingSchemaNotice isExecuting={false} handleExecute={handleExecute} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'common.run' }));
    expect(handleExecute).toHaveBeenCalledWith({});
  });

  it('renders and invokes execute-as-event button when configured', () => {
    const handleExecuteAsEvent = jest.fn().mockResolvedValue(undefined);

    render(
      <MissingSchemaNotice
        isExecuting={false}
        handleExecute={jest.fn().mockResolvedValue(undefined)}
        handleExecuteAsEvent={handleExecuteAsEvent}
        executeAsEventLabel="Run as event"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Run as event' }));
    expect(handleExecuteAsEvent).toHaveBeenCalledWith({});
  });

  it('does not render execute-as-event button when label is missing', () => {
    render(
      <MissingSchemaNotice
        isExecuting={false}
        handleExecute={jest.fn().mockResolvedValue(undefined)}
        handleExecuteAsEvent={jest.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Run as event' })).toBeNull();
  });

  it('disables action buttons while execution is in progress', () => {
    render(
      <MissingSchemaNotice
        isExecuting
        handleExecute={jest.fn().mockResolvedValue(undefined)}
        handleExecuteAsEvent={jest.fn().mockResolvedValue(undefined)}
        executeAsEventLabel="Run as event"
      />,
    );

    expect(screen.getByRole('button', { name: 'common.run' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Run as event' })).toBeDisabled();
  });

  it('re-enables action buttons when execution completes', () => {
    const { rerender } = render(
      <MissingSchemaNotice
        isExecuting
        handleExecute={jest.fn().mockResolvedValue(undefined)}
        handleExecuteAsEvent={jest.fn().mockResolvedValue(undefined)}
        executeAsEventLabel="Run as event"
      />,
    );

    expect(screen.getByRole('button', { name: 'common.run' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Run as event' })).toBeDisabled();

    rerender(
      <MissingSchemaNotice
        isExecuting={false}
        handleExecute={jest.fn().mockResolvedValue(undefined)}
        handleExecuteAsEvent={jest.fn().mockResolvedValue(undefined)}
        executeAsEventLabel="Run as event"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'common.run' }),
    ).not.toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Run as event' }),
    ).not.toBeDisabled();
  });
});
