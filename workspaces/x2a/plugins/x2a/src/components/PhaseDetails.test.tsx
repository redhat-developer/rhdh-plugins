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

jest.mock('../ClientService', () => ({
  useClientService: () => ({}),
}));

jest.mock('./PhaseStatus', () => ({
  PhaseStatus: ({ status }: { status?: string }) => (
    <span data-testid="phase-status">{status ?? '-'}</span>
  ),
}));

jest.mock('./ItemField', () => ({
  ItemField: ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div data-testid={`item-field-${label}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

import { render, screen, act } from '@testing-library/react';
import { Job } from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { PhaseDetails } from './PhaseDetails';

describe('PhaseDetails', () => {
  describe('duration field', () => {
    it('shows formatted duration when job has both startedAt and finishedAt', async () => {
      const phase: Job = {
        id: 'job-1',
        projectId: 'proj-1',
        phase: 'analyze',
        status: 'success',
        k8sJobName: 'k8s-job-1',
        startedAt: new Date('2024-01-01T12:00:00Z'),
        finishedAt: new Date('2024-01-01T12:02:30Z'),
      };

      await act(async () => {
        render(
          <PhaseDetails
            phase={phase}
            projectId="proj-1"
            phaseName="analyze"
            moduleId="mod-1"
          />,
        );
      });

      const durationField = screen.getByTestId('item-field-Duration');
      expect(durationField.textContent).toContain('2m 30s');
    });

    it('shows "-" when job is running (no finishedAt)', async () => {
      const phase: Job = {
        id: 'job-1',
        projectId: 'proj-1',
        phase: 'analyze',
        status: 'running',
        k8sJobName: 'k8s-job-1',
        startedAt: new Date('2024-01-01T12:00:00Z'),
      };

      await act(async () => {
        render(
          <PhaseDetails
            phase={phase}
            projectId="proj-1"
            phaseName="analyze"
            moduleId="mod-1"
          />,
        );
      });

      const durationField = screen.getByTestId('item-field-Duration');
      expect(durationField.textContent).toContain('-');
      expect(durationField.textContent).not.toMatch(/\d+[smhd]/);
    });

    it('shows "-" when phase is undefined', async () => {
      await act(async () => {
        render(
          <PhaseDetails
            phase={undefined}
            projectId="proj-1"
            phaseName="analyze"
            moduleId="mod-1"
          />,
        );
      });

      const durationField = screen.getByTestId('item-field-Duration');
      expect(durationField.textContent).toContain('-');
      expect(durationField.textContent).not.toMatch(/\d+[smhd]/);
    });
  });
});
