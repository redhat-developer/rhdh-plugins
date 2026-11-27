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

import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { fireEvent, render, screen, within } from '@testing-library/react';

import { DEFAULT_WORKFLOW_SPEC_VERSION } from './types';
import { WorkflowBuilderPage } from './WorkflowBuilderPage';

jest.mock('@backstage/core-plugin-api', () => {
  const actual = jest.requireActual('@backstage/core-plugin-api');
  return {
    ...actual,
    useRouteRef: () => () => '/orchestrator',
  };
});

jest.mock('@backstage/core-components', () => {
  const actual = jest.requireActual('@backstage/core-components');
  return {
    ...actual,
    Page: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Content: ({ children }: { children?: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Breadcrumbs: ({ children }: { children?: React.ReactNode }) => (
      <nav>{children}</nav>
    ),
    Link: ({ children, to }: { children?: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  };
});

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('./WorkflowBuilderCanvas', () => ({
  WorkflowBuilderCanvas: () => (
    <div data-testid="workflow-builder-canvas">canvas</div>
  ),
}));

describe('WorkflowBuilderPage', () => {
  const renderPage = () => {
    const router = createMemoryRouter(
      [{ path: '/builder', element: <WorkflowBuilderPage /> }],
      { initialEntries: ['/builder'] },
    );
    return render(<RouterProvider router={router} />);
  };

  const getFieldInput = (testId: string) => {
    const root = screen.getByTestId(testId);
    return within(root).queryByRole('textbox') ?? root;
  };

  it('opens with Identity defaults including spec 0.8 and four starter files', () => {
    renderPage();

    expect(screen.getByTestId('workflow-builder-page')).toBeInTheDocument();
    expect(screen.getByTestId('workflow-builder-header')).toBeInTheDocument();
    expect(screen.getByTestId('builder-header-name')).toHaveValue(
      'New workflow',
    );
    expect(screen.getByTestId('builder-header-description')).toHaveValue('');
    expect(getFieldInput('builder-identity-name')).toHaveValue('New workflow');
    expect(getFieldInput('builder-identity-workflow-id')).toHaveValue(
      'new-workflow',
    );
    expect(
      screen.getByTestId('builder-identity-spec-version'),
    ).toHaveTextContent(DEFAULT_WORKFLOW_SPEC_VERSION);

    fireEvent.click(screen.getByTestId('builder-edit-workflow-files'));
    expect(screen.getByTestId('builder-edit-files-dialog')).toBeInTheDocument();
    expect(
      screen.getByTestId('builder-file-tab-workflowYaml'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('builder-file-tab-templateYaml'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('builder-file-tab-inputSchemaJson'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('builder-file-tab-outputSchemaJson'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('builder-file-content')).toHaveTextContent(
      `specVersion: "${DEFAULT_WORKFLOW_SPEC_VERSION}"`,
    );
    expect(
      screen.getByTestId('builder-files-starter-warning'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('builder-files-copy')).toBeInTheDocument();
    expect(screen.getByTestId('builder-files-download')).toBeInTheDocument();
    expect(screen.getByTestId('builder-files-download-zip')).toBeDisabled();
    expect(screen.getByTestId('builder-files-apply')).toBeDisabled();
  });

  it('keeps header name in sync with Identity panel', () => {
    renderPage();

    fireEvent.change(screen.getByTestId('builder-header-name'), {
      target: { value: 'My workflow' },
    });
    expect(getFieldInput('builder-identity-name')).toHaveValue('My workflow');
  });

  it('derives workflow id and file names from the display name', () => {
    renderPage();

    fireEvent.change(screen.getByTestId('builder-header-name'), {
      target: { value: 'test name new' },
    });
    expect(getFieldInput('builder-identity-workflow-id')).toHaveValue(
      'test-name-new',
    );

    fireEvent.click(screen.getByTestId('builder-edit-workflow-files'));
    expect(screen.getByTestId('builder-file-content')).toHaveTextContent(
      'id: "test-name-new"',
    );
    expect(
      screen.getByTestId('builder-file-tab-workflowYaml'),
    ).toHaveTextContent('test-name-new.sw.yaml');
  });

  it('does not overwrite a customized workflow id after an empty-slug name', () => {
    renderPage();

    fireEvent.change(getFieldInput('builder-identity-workflow-id'), {
      target: { value: 'custom-id' },
    });
    fireEvent.change(screen.getByTestId('builder-header-name'), {
      target: { value: '!!!' },
    });
    fireEvent.change(screen.getByTestId('builder-header-name'), {
      target: { value: 'later name' },
    });

    expect(getFieldInput('builder-identity-workflow-id')).toHaveValue(
      'custom-id',
    );
  });

  it('resumes auto-sync after an empty-slug name when id was never customized', () => {
    renderPage();

    fireEvent.change(screen.getByTestId('builder-header-name'), {
      target: { value: '!!!' },
    });
    fireEvent.change(screen.getByTestId('builder-header-name'), {
      target: { value: 'later name' },
    });

    expect(getFieldInput('builder-identity-workflow-id')).toHaveValue(
      'later-name',
    );
  });

  it('warns before discarding on Close', () => {
    renderPage();

    fireEvent.click(screen.getByTestId('builder-close'));
    expect(screen.getByTestId('unsaved-changes-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('unsaved-changes-export-zip')).toBeDisabled();
    expect(screen.getByTestId('unsaved-changes-cancel')).toHaveTextContent(
      'builder.unsavedChanges.keepEditing',
    );
    expect(screen.getByTestId('unsaved-changes-discard')).toHaveTextContent(
      'builder.unsavedChanges.discard',
    );
  });
});
