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

import { summarizePortfolio, PortfolioJobRow } from './portfolioSummary';

const projectId = 'project-1';

function moduleRow(
  id: string,
  options: { removedAt?: string; projectId?: string } = {},
): Record<string, unknown> {
  return {
    id,
    project_id: options.projectId ?? projectId,
    removed_at: options.removedAt,
  };
}

function job(
  partial: Partial<PortfolioJobRow> & Pick<PortfolioJobRow, 'phase'>,
): PortfolioJobRow {
  return {
    project_id: projectId,
    status: 'success',
    started_at: '2020-01-01T00:00:00.000Z',
    ...partial,
  };
}

function telemetry(
  agents: Record<string, { inputTokens?: number; outputTokens?: number }>,
): string {
  return JSON.stringify({
    summary: 's',
    phase: 'analyze',
    startedAt: '2020-01-01T00:00:00.000Z',
    agents,
  });
}

describe('summarizePortfolio', () => {
  it('keeps removed modules out of total and error', () => {
    const result = summarizePortfolio(
      [projectId],
      [moduleRow('removed', { removedAt: '2020-01-02T00:00:00.000Z' })],
      [
        job({
          module_id: 'removed',
          phase: 'analyze',
          status: 'error',
        }),
      ],
    );

    expect(result.modules.total).toBe(0);
    expect(result.modules.error).toBe(0);
    expect(result.modules.removed).toBe(1);
  });

  it('counts an init failure with no module errors as a failed project', () => {
    const result = summarizePortfolio(
      [projectId],
      [],
      [job({ phase: 'init', status: 'error', module_id: null })],
    );

    expect(result.projectCounts.failed).toBe(1);
    expect(result.modules.error).toBe(0);
  });

  it('counts a project with no modules and no init as created', () => {
    const result = summarizePortfolio([projectId], [], []);

    expect(result.projectCounts.created).toBe(1);
    expect(result.modules.total).toBe(0);
  });

  it('counts a successful publish as finished when a later analyze retry exists', () => {
    const result = summarizePortfolio(
      [projectId],
      [moduleRow('mod')],
      [
        job({
          module_id: 'mod',
          phase: 'publish',
          status: 'success',
          started_at: '2020-01-01T00:00:00.000Z',
        }),
        job({
          module_id: 'mod',
          phase: 'analyze',
          status: 'error',
          started_at: '2020-02-01T00:00:00.000Z',
        }),
      ],
    );

    expect(result.modules.finished).toBe(1);
    expect(result.modules.waiting).toBe(0);
    expect(result.modules.error).toBe(0);
  });

  it('sums tokens across phases, retries, init, adversarial, and removed modules', () => {
    const result = summarizePortfolio(
      [projectId],
      [
        moduleRow('mod'),
        moduleRow('gone', { removedAt: '2020-03-01T00:00:00.000Z' }),
      ],
      [
        job({
          module_id: 'mod',
          phase: 'analyze',
          telemetry: telemetry({ a: { inputTokens: 10, outputTokens: 4 } }),
        }),
        job({
          module_id: 'mod',
          phase: 'analyze',
          started_at: '2020-01-02T00:00:00.000Z',
          telemetry: telemetry({ a: { inputTokens: 3 } }),
        }),
        job({
          module_id: 'mod',
          phase: 'migrate',
          telemetry: telemetry({ a: { outputTokens: 1 } }),
        }),
        job({
          phase: 'init',
          module_id: null,
          telemetry: telemetry({ a: { inputTokens: 5, outputTokens: 2 } }),
        }),
        job({
          module_id: 'mod',
          phase: 'adversarial-analyze',
          telemetry: telemetry({ a: { inputTokens: 7, outputTokens: 0 } }),
        }),
        job({
          module_id: 'gone',
          phase: 'publish',
          status: 'error',
          telemetry: telemetry({ a: { inputTokens: 1, outputTokens: 1 } }),
        }),
        job({
          project_id: 'other-project',
          phase: 'analyze',
          telemetry: telemetry({ a: { inputTokens: 100, outputTokens: 100 } }),
        }),
      ],
    );

    expect(result.inputTokens).toBe(10 + 3 + 5 + 7 + 1);
    expect(result.outputTokens).toBe(4 + 1 + 2 + 0 + 1);
    expect(result.tokensReported).toBe(true);
    expect(result.modules.total).toBe(1);
    expect(result.modules.error).toBe(0);
    expect(result.modules.removed).toBe(1);
  });

  it('does not report tokens when telemetry has no numeric token fields', () => {
    const result = summarizePortfolio(
      [projectId],
      [],
      [
        job({ phase: 'init', module_id: null }),
        job({
          phase: 'analyze',
          telemetry: telemetry({ a: {} }),
        }),
      ],
    );

    expect(result.inputTokens).toBe(0);
    expect(result.outputTokens).toBe(0);
    expect(result.tokensReported).toBe(false);
  });

  it('treats a reported zero as tokens having been reported', () => {
    const result = summarizePortfolio(
      [projectId],
      [],
      [
        job({
          phase: 'init',
          module_id: null,
          telemetry: telemetry({ a: { inputTokens: 0 } }),
        }),
      ],
    );

    expect(result.inputTokens).toBe(0);
    expect(result.tokensReported).toBe(true);
  });

  it('ignores telemetry that fails to parse', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const result = summarizePortfolio(
      [projectId],
      [],
      [job({ phase: 'init', module_id: null, telemetry: 'not-json' })],
    );

    expect(result.tokensReported).toBe(false);
    expect(result.inputTokens).toBe(0);
    errorSpy.mockRestore();
  });

  it('ignores rows when the permitted set is empty', () => {
    const result = summarizePortfolio(
      [],
      [moduleRow('mod')],
      [job({ phase: 'analyze', module_id: 'mod' })],
    );

    expect(result.projectCounts.created).toBe(0);
    expect(result.modules.total).toBe(0);
    expect(result.tokensReported).toBe(false);
  });
});
