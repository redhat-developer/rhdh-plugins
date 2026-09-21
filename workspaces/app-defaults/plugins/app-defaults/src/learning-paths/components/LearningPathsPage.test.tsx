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

import { renderInTestApp } from '@backstage/frontend-test-utils';

import { screen } from '@testing-library/react';

import { useLearningPathData } from '../hooks/useLearningPathData';
import { LearningPathsPage } from './LearningPathsPage';

jest.mock('../hooks/useLearningPathData');

const mockUseLearningPathData = useLearningPathData as jest.Mock;

const renderPage = () => renderInTestApp(<LearningPathsPage />);

describe('LearningPathsPage', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows a progress indicator while loading', async () => {
    mockUseLearningPathData.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });

    await renderPage();

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders a card with an external link for each learning path', async () => {
    const learningPath = {
      label: 'Building Operators on OpenShift',
      description: 'Learn about k8s API fundamentals',
      url: 'https://developers.redhat.com/learn/openshift/operators',
      hours: 1,
      minutes: 20,
      paths: 6,
    };

    mockUseLearningPathData.mockReturnValue({
      data: [learningPath],
      error: undefined,
      isLoading: false,
    });

    await renderPage();

    const link = screen.getByRole('link', {
      name: new RegExp(learningPath.label),
    });
    expect(link).toHaveAttribute('href', learningPath.url);
    expect(link).toHaveAttribute('target', '_blank');

    expect(screen.getByText(learningPath.label)).toBeInTheDocument();
    expect(screen.getByText(learningPath.description)).toBeInTheDocument();
    expect(
      screen.getByText('1 hour 20 minutes | 6 learning paths'),
    ).toBeInTheDocument();
  });

  it('shows an error report when no learning paths are returned', async () => {
    mockUseLearningPathData.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: false,
    });

    await renderPage();

    expect(
      screen.getByText('Error: Could not fetch data.'),
    ).toBeInTheDocument();
  });

  it('shows the underlying error message when loading fails', async () => {
    mockUseLearningPathData.mockReturnValue({
      data: undefined,
      error: new Error('Boom'),
      isLoading: false,
    });

    await renderPage();

    expect(screen.getByText(/Error: Boom/)).toBeInTheDocument();
  });
});
