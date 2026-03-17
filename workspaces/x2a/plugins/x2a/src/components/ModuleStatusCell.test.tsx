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
import { mockUseTranslation } from '../test-utils/mockTranslations';

jest.mock('../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

import { renderInTestApp } from '@backstage/test-utils';
import { screen } from '@testing-library/react';
import { Module } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { ModuleStatusCell } from './ModuleStatusCell';

const baseModule: Module = {
  id: 'mod-1',
  name: 'test-module',
  sourcePath: '/src',
  projectId: 'proj-1',
  status: 'pending',
};

describe('ModuleStatusCell', () => {
  it('renders status text for a pending module', async () => {
    await renderInTestApp(
      <ModuleStatusCell module={{ ...baseModule, status: 'pending' }} />,
    );
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders "review" chip when status is success and publish is absent', async () => {
    await renderInTestApp(
      <ModuleStatusCell module={{ ...baseModule, status: 'success' }} />,
    );
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('review')).toBeInTheDocument();
  });

  it('does not render "review" chip when publish job exists', async () => {
    const moduleWithPublish: Module = {
      ...baseModule,
      status: 'success',
      publish: {
        id: 'job-1',
        projectId: 'proj-1',
        moduleId: 'mod-1',
        phase: 'publish',
        status: 'success',
        k8sJobName: 'k8s-job',
        startedAt: new Date(),
      },
    };
    await renderInTestApp(<ModuleStatusCell module={moduleWithPublish} />);
    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.queryByText('review')).not.toBeInTheDocument();
  });

  it('does not render "review" chip when status is not success', async () => {
    await renderInTestApp(
      <ModuleStatusCell module={{ ...baseModule, status: 'running' }} />,
    );
    expect(screen.getByText('Running')).toBeInTheDocument();
    expect(screen.queryByText('review')).not.toBeInTheDocument();
  });

  it('renders error tooltip when errorDetails is present', async () => {
    await renderInTestApp(
      <ModuleStatusCell
        module={{ ...baseModule, status: 'error', errorDetails: 'Some error' }}
      />,
    );
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByTitle('Some error')).toBeInTheDocument();
  });

  it('renders fallback status for undefined module', async () => {
    await renderInTestApp(<ModuleStatusCell />);
    expect(screen.getByText('-')).toBeInTheDocument();
    expect(screen.queryByText('review')).not.toBeInTheDocument();
  });

  it('renders cancelled status text', async () => {
    await renderInTestApp(
      <ModuleStatusCell module={{ ...baseModule, status: 'cancelled' }} />,
    );
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
    expect(screen.queryByText('review')).not.toBeInTheDocument();
  });
});
