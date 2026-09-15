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

jest.mock('../../ClientService', () => ({
  useClientService: () => ({}),
}));

jest.mock('../../hooks/useLogStream', () => ({
  useLogStream: () => ({
    logText: undefined,
    logStreamHasData: false,
    logLoading: false,
    logError: undefined,
  }),
}));

// Grid children pull in routing / catalog / api deps that are irrelevant to the
// status + findings summary logic under test, so stub them out.
jest.mock('../ItemField', () => ({
  ItemField: ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));
jest.mock('../ArtifactLink', () => ({ ArtifactLink: () => <div /> }));
jest.mock('../PhaseTelemetry', () => ({ TelemetrySection: () => <div /> }));
jest.mock('./AdversarialAgentsSelector', () => ({
  AdversarialAgentsSelector: () => <div />,
}));

import { screen, within } from '@testing-library/react';
import { renderInTestApp } from '@backstage/test-utils';
import {
  Artifact,
  Job,
  JobStatusEnum,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { AdversarialReviewSection } from './AdversarialReviewSection';

const reportJsonArtifact = (value: string): Artifact => ({
  id: 'a1',
  type: 'adversarial_report_json',
  value,
});

const makeJob = (status: JobStatusEnum, artifacts: Artifact[] = []): Job => ({
  id: 'job-1',
  projectId: 'p1',
  moduleId: 'm1',
  startedAt: new Date('2024-01-01T00:00:00Z'),
  finishedAt: new Date('2024-01-01T00:05:00Z'),
  phase: 'adversarial-analyze',
  k8sJobName: 'k8s-job',
  status,
  artifacts,
});

const renderSection = (job: Job) =>
  renderInTestApp(
    <AdversarialReviewSection
      job={job}
      projectId="p1"
      moduleId="m1"
      adversarialPhaseName="adversarial-analyze"
      runPhase="analyze"
      targetRepoUrl="https://github.com/org/repo"
      targetRepoBranch="main"
      canRun={false}
    />,
  );

// The accordion header (a role="button") holds the status + findings summary.
const summary = () =>
  screen.getByRole('button', { name: /Adversarial Review/ });

describe('AdversarialReviewSection', () => {
  it('shows a neutral "Completed" instead of a success pill on a finished run', async () => {
    await renderSection(
      makeJob('success', [
        reportJsonArtifact('{"total_findings":0,"total_critical_findings":0}'),
      ]),
    );

    expect(within(summary()).getByText('Completed')).toBeInTheDocument();
  });

  it('shows "No findings" for a clean run and no severity counts', async () => {
    await renderSection(
      makeJob('success', [
        reportJsonArtifact('{"total_findings":0,"total_critical_findings":0}'),
      ]),
    );

    const header = within(summary());
    expect(header.getByText('No findings')).toBeInTheDocument();
    expect(header.queryByText('Critical Findings')).not.toBeInTheDocument();
    expect(header.queryByText('Warning Findings')).not.toBeInTheDocument();
  });

  it('shows both severities when critical and warning findings exist', async () => {
    await renderSection(
      makeJob('success', [
        reportJsonArtifact('{"total_findings":5,"total_critical_findings":3}'),
      ]),
    );

    const header = within(summary());
    expect(header.getByText(/3\s+Critical Findings/)).toBeInTheDocument();
    expect(header.getByText(/2\s+Warning Findings/)).toBeInTheDocument();
    expect(header.queryByText('No findings')).not.toBeInTheDocument();
  });

  it('shows only the critical severity when there are no warnings', async () => {
    await renderSection(
      makeJob('success', [
        reportJsonArtifact('{"total_findings":3,"total_critical_findings":3}'),
      ]),
    );

    const header = within(summary());
    expect(header.getByText(/3\s+Critical Findings/)).toBeInTheDocument();
    expect(header.queryByText(/Warning Findings/)).not.toBeInTheDocument();
    expect(header.queryByText('No findings')).not.toBeInTheDocument();
  });

  it('shows only the warning severity when there are no criticals', async () => {
    await renderSection(
      makeJob('success', [
        reportJsonArtifact('{"total_findings":4,"total_critical_findings":0}'),
      ]),
    );

    const header = within(summary());
    expect(header.getByText(/4\s+Warning Findings/)).toBeInTheDocument();
    expect(header.queryByText(/Critical Findings/)).not.toBeInTheDocument();
    expect(header.queryByText('No findings')).not.toBeInTheDocument();
  });

  it('renders no findings summary when the report JSON is malformed', async () => {
    await renderSection(makeJob('success', [reportJsonArtifact('not-json')]));

    const header = within(summary());
    expect(header.getByText('Completed')).toBeInTheDocument();
    expect(header.queryByText('No findings')).not.toBeInTheDocument();
    expect(header.queryByText('Critical Findings')).not.toBeInTheDocument();
    expect(header.queryByText('Warning Findings')).not.toBeInTheDocument();
  });

  it('keeps the real status pill (not "Completed") for a failed run', async () => {
    await renderSection(makeJob('error'));

    const header = within(summary());
    expect(header.queryByText('Completed')).not.toBeInTheDocument();
    expect(header.getByText('Error')).toBeInTheDocument();
  });
});
