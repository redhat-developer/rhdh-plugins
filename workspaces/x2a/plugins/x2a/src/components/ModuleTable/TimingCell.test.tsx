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
import { mockUseTranslation } from '../../test-utils/mockTranslations';

jest.mock('../../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

import { render, screen, waitFor } from '@testing-library/react';
import {
  Job,
  POLLING_INTERVAL_MS,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { TimingCell } from './TimingCell';

describe('TimingCell', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders "-" when lastJob is undefined', () => {
    render(<TimingCell lastJob={undefined} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders finished relative time', () => {
    jest.setSystemTime(new Date('2024-01-01T12:05:00Z'));

    const lastJob: Job = {
      id: 'job-1',
      projectId: 'proj-1',
      phase: 'analyze',
      status: 'success',
      k8sJobName: 'k8s-job-1',
      startedAt: new Date('2024-01-01T12:00:00Z'),
      finishedAt: new Date('2024-01-01T12:01:30Z'),
    };

    render(<TimingCell lastJob={lastJob} />);
    expect(
      screen.getByText('Finished 3m ago (took 1m 30s)'),
    ).toBeInTheDocument();
  });

  it('updates the relative time on each polling interval tick', async () => {
    jest.setSystemTime(new Date('2024-01-01T12:05:00Z'));

    const lastJob: Job = {
      id: 'job-1',
      projectId: 'proj-1',
      phase: 'analyze',
      status: 'success',
      k8sJobName: 'k8s-job-1',
      startedAt: new Date('2024-01-01T12:00:00Z'),
      finishedAt: new Date('2024-01-01T12:01:30Z'),
    };

    render(<TimingCell lastJob={lastJob} />);
    expect(
      screen.getByText('Finished 3m ago (took 1m 30s)'),
    ).toBeInTheDocument();

    jest.setSystemTime(new Date('2024-01-01T12:15:00Z'));
    jest.advanceTimersByTime(POLLING_INTERVAL_MS);

    await waitFor(() => {
      expect(
        screen.getByText('Finished 13m ago (took 1m 30s)'),
      ).toBeInTheDocument();
    });

    jest.setSystemTime(new Date('2024-01-01T13:05:00Z'));
    jest.advanceTimersByTime(POLLING_INTERVAL_MS);

    await waitFor(() => {
      expect(
        screen.getByText('Finished 1h 3m ago (took 1m 30s)'),
      ).toBeInTheDocument();
    });
  });

  it('does not start a timer when lastJob has no startedAt', () => {
    const lastJob: Job = {
      id: 'job-1',
      projectId: 'proj-1',
      phase: 'analyze',
      status: 'pending',
      k8sJobName: 'k8s-job-1',
      startedAt: undefined as unknown as Date,
    };

    render(<TimingCell lastJob={lastJob} />);
    expect(screen.getByText('-')).toBeInTheDocument();

    expect(jest.getTimerCount()).toBe(0);
  });

  it('renders running time when job has no finishedAt', async () => {
    jest.setSystemTime(new Date('2024-01-01T12:02:00Z'));

    const lastJob: Job = {
      id: 'job-1',
      projectId: 'proj-1',
      phase: 'analyze',
      status: 'running',
      k8sJobName: 'k8s-job-1',
      startedAt: new Date('2024-01-01T12:00:00Z'),
    };

    render(<TimingCell lastJob={lastJob} />);
    expect(screen.getByText('Running for 2m 0s')).toBeInTheDocument();

    jest.setSystemTime(new Date('2024-01-01T12:12:00Z'));
    jest.advanceTimersByTime(POLLING_INTERVAL_MS);

    await waitFor(() => {
      expect(screen.getByText('Running for 12m 10s')).toBeInTheDocument();
    });
  });
});
