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

import { fireEvent, render, screen } from '@testing-library/react';

import { CreateWorkflowMenu } from './CreateWorkflowMenu';

// react-aria (used by @backstage/ui Menu) expects the CSS OM in jsdom.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).CSS = {
  supports: () => false,
  escape: (value: string) => value,
};

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useRouteRef: () => () => '/orchestrator/builder',
  };
});

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) =>
      ({
        'builder.create.button': 'Create',
        'builder.create.startFromScratch': 'Start from scratch',
        'builder.create.importLocalFiles': 'Import Local Files',
      })[key] ?? key,
  }),
}));

describe('CreateWorkflowMenu', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('navigates to the builder on Start from scratch', () => {
    render(<CreateWorkflowMenu />);

    fireEvent.click(screen.getByTestId('create-workflow-menu-button'));
    fireEvent.click(screen.getByTestId('create-workflow-start-from-scratch'));

    expect(mockNavigate).toHaveBeenCalledWith('/orchestrator/builder');
  });

  it('keeps Import Local Files disabled for Story 1', () => {
    const onImportLocalFiles = jest.fn();
    render(<CreateWorkflowMenu onImportLocalFiles={onImportLocalFiles} />);

    fireEvent.click(screen.getByTestId('create-workflow-menu-button'));
    const importItem = screen.getByTestId('create-workflow-import-local-files');
    expect(importItem).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(importItem);
    expect(onImportLocalFiles).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
