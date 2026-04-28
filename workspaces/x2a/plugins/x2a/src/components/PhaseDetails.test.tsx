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
import '../test-utils/webStreamsJestPolyfill';
import { mockUseTranslation } from '../test-utils/mockTranslations';

const mockProjectIdLogGet = jest.fn();
const mockModulesModuleIdLogGet = jest.fn();
const clientServiceMock = {
  projectsProjectIdLogGet: mockProjectIdLogGet,
  projectsProjectIdModulesModuleIdLogGet: mockModulesModuleIdLogGet,
};

function makeSuccessResponse(
  buildBody: (
    enc: globalThis.TextEncoder,
  ) => globalThis.ReadableStream<Uint8Array>,
) {
  const te = new globalThis.TextEncoder();
  const body = buildBody(te);
  return {
    ok: true,
    status: 200,
    body,
    text: async () => '',
  } as unknown as globalThis.Response;
}

jest.mock('../hooks/useTranslation', () => ({
  useTranslation: mockUseTranslation,
}));

jest.mock('../ClientService', () => ({
  useClientService: () => clientServiceMock,
}));

jest.mock('@backstage/core-components', () => ({
  LogViewer: ({ text }: { text: string }) => (
    <div data-testid="log-viewer">{text}</div>
  ),
  Progress: () => <div data-testid="log-progress" />,
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

import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Job,
  POLLING_INTERVAL_MS,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';
import { PhaseDetails } from './PhaseDetails';

const baseJob: Job = {
  id: 'job-1',
  projectId: 'proj-1',
  phase: 'analyze',
  status: 'running',
  k8sJobName: 'k8s-job-1',
  startedAt: new Date('2024-01-01T12:00:00Z'),
};

describe('PhaseDetails', () => {
  beforeEach(() => {
    mockProjectIdLogGet.mockReset();
    mockModulesModuleIdLogGet.mockReset();
  });
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

  describe('log streaming', () => {
    it('fetches module log with streaming: true and displays a single-chunk line', async () => {
      mockModulesModuleIdLogGet.mockResolvedValue(
        makeSuccessResponse(
          enc =>
            new globalThis.ReadableStream({
              start(c) {
                c.enqueue(enc.encode('line1\n'));
                c.close();
              },
            }),
        ),
      );

      const user = userEvent.setup();
      await act(async () => {
        render(
          <PhaseDetails
            phase={baseJob}
            projectId="proj-1"
            phaseName="analyze"
            moduleId="mod-1"
          />,
        );
      });

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'View Log' }));
      });

      await waitFor(() => {
        expect(mockModulesModuleIdLogGet).toHaveBeenCalledWith(
          expect.objectContaining({
            path: { projectId: 'proj-1', moduleId: 'mod-1' },
            query: { phase: 'analyze', streaming: true },
          }),
        );
        expect(mockProjectIdLogGet).not.toHaveBeenCalled();
      });

      const viewer = await screen.findByTestId('log-viewer');
      expect(viewer.textContent).toContain('line1');
    });

    it('uses projectsProjectIdLogGet for init phase with streaming: true', async () => {
      const initJob: Job = { ...baseJob, phase: 'init' };
      mockProjectIdLogGet.mockResolvedValue(
        makeSuccessResponse(
          enc =>
            new globalThis.ReadableStream({
              start(c) {
                c.enqueue(enc.encode('init-log\n'));
                c.close();
              },
            }),
        ),
      );

      const user = userEvent.setup();
      await act(async () => {
        render(
          <PhaseDetails phase={initJob} projectId="proj-1" phaseName="init" />,
        );
      });

      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'View Log' }));
      });

      await waitFor(() => {
        expect(mockProjectIdLogGet).toHaveBeenCalledWith(
          expect.objectContaining({
            path: { projectId: 'proj-1' },
            query: { streaming: true },
          }),
        );
        expect(mockModulesModuleIdLogGet).not.toHaveBeenCalled();
      });

      expect((await screen.findByTestId('log-viewer')).textContent).toContain(
        'init-log',
      );
    });

    it('aggregates text when the stream delivers multiple chunks', async () => {
      const parts = ['A', 'B', 'C', '\nend'];
      mockModulesModuleIdLogGet.mockResolvedValue(
        makeSuccessResponse(
          enc =>
            new globalThis.ReadableStream({
              start(c) {
                for (const p of parts) {
                  c.enqueue(enc.encode(p));
                }
                c.close();
              },
            }),
        ),
      );

      const user = userEvent.setup();
      await act(async () => {
        render(
          <PhaseDetails
            phase={baseJob}
            projectId="proj-1"
            phaseName="analyze"
            moduleId="mod-1"
          />,
        );
      });
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'View Log' }));
      });

      const viewer = await screen.findByTestId('log-viewer');
      await waitFor(() => {
        expect(viewer.textContent).toBe('ABC\nend');
      });
    });

    it('shows logWaitingForStream (not noLogs) until the first byte arrives, then the log line', async () => {
      let deliverChunk!: () => void;
      const gate = new Promise<void>(r => {
        deliverChunk = r;
      });

      mockModulesModuleIdLogGet.mockResolvedValue(
        makeSuccessResponse(enc => {
          let delivered = false;
          return new globalThis.ReadableStream({
            async pull(controller) {
              if (delivered) {
                controller.close();
              } else {
                await gate;
                controller.enqueue(enc.encode('pod started\n'));
                delivered = true;
              }
            },
          });
        }),
      );

      const user = userEvent.setup();
      await act(async () => {
        render(
          <PhaseDetails
            phase={baseJob}
            projectId="proj-1"
            phaseName="analyze"
            moduleId="mod-1"
          />,
        );
      });
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'View Log' }));
      });

      const viewer = await screen.findByTestId('log-viewer');
      expect(viewer.textContent).toContain(
        'Waiting for log output from the cluster',
      );
      expect(viewer.textContent).not.toContain('No logs available');

      await act(async () => {
        deliverChunk();
      });

      await waitFor(() => {
        expect(viewer.textContent).toContain('pod started');
      });
      expect(viewer.textContent).not.toContain('Waiting for log');
    });

    it('shows noLogsAvailable placeholder for empty log stream (finished job, no lines)', async () => {
      const finishedJob: Job = {
        ...baseJob,
        status: 'success',
        finishedAt: new Date('2024-01-01T12:05:00Z'),
      };
      mockModulesModuleIdLogGet.mockResolvedValue(
        makeSuccessResponse(
          () =>
            new globalThis.ReadableStream<Uint8Array>({
              start(c) {
                c.close();
              },
            }),
        ),
      );

      const user = userEvent.setup();
      await act(async () => {
        render(
          <PhaseDetails
            phase={finishedJob}
            projectId="proj-1"
            phaseName="analyze"
            moduleId="mod-1"
          />,
        );
      });
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'View Log' }));
      });

      const viewer = await screen.findByTestId('log-viewer');
      await waitFor(() => {
        expect(viewer.textContent).toContain('No logs available');
      });
    });

    it('retries fetching log when stream is empty and phase is running', async () => {
      jest.useFakeTimers();

      try {
        mockModulesModuleIdLogGet
          .mockResolvedValueOnce(
            makeSuccessResponse(
              () =>
                new globalThis.ReadableStream<Uint8Array>({
                  start(c) {
                    c.close();
                  },
                }),
            ),
          )
          .mockResolvedValueOnce(
            makeSuccessResponse(
              enc =>
                new globalThis.ReadableStream({
                  start(c) {
                    c.enqueue(enc.encode('log appeared\n'));
                    c.close();
                  },
                }),
            ),
          );

        const user = userEvent.setup({
          advanceTimers: jest.advanceTimersByTime,
        });
        await act(async () => {
          render(
            <PhaseDetails
              phase={baseJob}
              projectId="proj-1"
              phaseName="analyze"
              moduleId="mod-1"
            />,
          );
        });
        await act(async () => {
          await user.click(screen.getByRole('button', { name: 'View Log' }));
        });

        const viewer = await screen.findByTestId('log-viewer');
        await waitFor(() => {
          expect(mockModulesModuleIdLogGet).toHaveBeenCalledTimes(1);
        });
        expect(viewer.textContent).toContain(
          'Waiting for log output from the cluster',
        );

        await act(async () => {
          jest.advanceTimersByTime(POLLING_INTERVAL_MS);
        });

        await waitFor(() => {
          expect(mockModulesModuleIdLogGet).toHaveBeenCalledTimes(2);
        });
        await waitFor(() => {
          expect(viewer.textContent).toContain('log appeared');
        });
      } finally {
        jest.useRealTimers();
      }
    });

    it('fetches log for a finished success phase the same way (one short response)', async () => {
      const finished: Job = {
        ...baseJob,
        status: 'success',
        finishedAt: new Date('2024-01-01T12:05:00Z'),
      };
      mockModulesModuleIdLogGet.mockResolvedValue(
        makeSuccessResponse(
          enc =>
            new globalThis.ReadableStream({
              start(c) {
                c.enqueue(enc.encode('captured in DB\n'));
                c.close();
              },
            }),
        ),
      );

      const user = userEvent.setup();
      await act(async () => {
        render(
          <PhaseDetails
            phase={finished}
            projectId="proj-1"
            phaseName="analyze"
            moduleId="mod-1"
          />,
        );
      });
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'View Log' }));
      });

      const viewer = await screen.findByTestId('log-viewer');
      await waitFor(() => {
        expect(viewer.textContent).toContain('captured in DB');
      });
    });

    it('shows an error when the log request is not ok', async () => {
      mockModulesModuleIdLogGet.mockResolvedValue(
        new globalThis.Response('permission denied', { status: 403 }),
      );

      const user = userEvent.setup();
      await act(async () => {
        render(
          <PhaseDetails
            phase={baseJob}
            projectId="proj-1"
            phaseName="analyze"
            moduleId="mod-1"
          />,
        );
      });
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'View Log' }));
      });

      await waitFor(() => {
        expect(screen.getByText(/permission denied/)).toBeInTheDocument();
      });
    });

    it('stops retrying when phase transitions from running to success while stream is empty', async () => {
      jest.useFakeTimers();

      try {
        mockModulesModuleIdLogGet.mockResolvedValue(
          makeSuccessResponse(
            () =>
              new globalThis.ReadableStream<Uint8Array>({
                start(c) {
                  c.close();
                },
              }),
          ),
        );

        const user = userEvent.setup({
          advanceTimers: jest.advanceTimersByTime,
        });
        const { rerender } = await act(async () =>
          render(
            <PhaseDetails
              phase={baseJob}
              projectId="proj-1"
              phaseName="analyze"
              moduleId="mod-1"
            />,
          ),
        );

        await act(async () => {
          await user.click(screen.getByRole('button', { name: 'View Log' }));
        });

        await waitFor(() => {
          expect(mockModulesModuleIdLogGet).toHaveBeenCalledTimes(1);
        });

        const finishedJob: Job = {
          ...baseJob,
          status: 'success',
          finishedAt: new Date('2024-01-01T12:05:00Z'),
        };
        await act(async () => {
          rerender(
            <PhaseDetails
              phase={finishedJob}
              projectId="proj-1"
              phaseName="analyze"
              moduleId="mod-1"
            />,
          );
        });

        // The already-scheduled retry fires once more (was queued before status changed).
        await act(async () => {
          jest.advanceTimersByTime(POLLING_INTERVAL_MS);
        });
        await waitFor(() => {
          expect(mockModulesModuleIdLogGet).toHaveBeenCalledTimes(2);
        });

        // No further retries: phaseStatusRef is now 'success'.
        await act(async () => {
          jest.advanceTimersByTime(POLLING_INTERVAL_MS * 3);
        });
        expect(mockModulesModuleIdLogGet).toHaveBeenCalledTimes(2);
      } finally {
        jest.useRealTimers();
      }
    });

    it('aborts load when the log is hidden and does not surface AbortError in the UI', async () => {
      const parts = ['a', 'b', 'c'];
      let readCount = 0;
      mockModulesModuleIdLogGet.mockResolvedValue(
        makeSuccessResponse(
          enc =>
            new globalThis.ReadableStream({
              pull(controller) {
                if (readCount < parts.length) {
                  controller.enqueue(enc.encode(parts[readCount]));
                  readCount += 1;
                } else {
                  controller.close();
                }
              },
            }),
        ),
      );

      const user = userEvent.setup();
      await act(async () => {
        render(
          <PhaseDetails
            phase={baseJob}
            projectId="proj-1"
            phaseName="analyze"
            moduleId="mod-1"
          />,
        );
      });
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'View Log' }));
      });
      await screen.findByTestId('log-viewer');
      await act(async () => {
        await user.click(screen.getByRole('button', { name: 'Hide Log' }));
      });
      await waitFor(() => {
        expect(
          screen.queryByRole('button', { name: 'Hide Log' }),
        ).not.toBeInTheDocument();
      });
      expect(screen.queryByText(/AbortError/i)).toBeNull();
    });
  });
});
