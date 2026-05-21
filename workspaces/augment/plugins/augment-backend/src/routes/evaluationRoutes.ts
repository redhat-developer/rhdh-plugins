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

import { randomUUID as uuid } from 'node:crypto';
import type {
  WorkflowTestCase,
  WorkflowEvaluationResult,
  TestCaseResult,
  EvaluationCriterion,
  NodeExecutionRecord,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';
import { InputError } from '@backstage/errors';
import { createWithRoute } from './routeWrapper';
import type { RouteContext } from './types';
import type { WorkflowConfigService } from '../services/WorkflowConfigService';
import type { AdminConfigService } from '../services/AdminConfigService';
import { ResponsesApiClient } from '../services/ResponsesApiClient';
import { resolveLlamaStackConfig } from './resolveWorkflowConfig';

export interface EvaluationDeps {
  workflowService: WorkflowConfigService;
  adminConfig: AdminConfigService;
  runWorkflow: (
    workflowId: string,
    input: string,
  ) => Promise<{
    response: string;
    agentName?: string;
    trace: NodeExecutionRecord[];
    durationMs: number;
    tokenUsage?: { inputTokens: number; outputTokens: number };
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ScoringRow {
  score?: number | null;
  scores?: Record<string, { value: number }>;
  judge_feedback?: string;
}

interface ScoringFnResult {
  score_rows?: ScoringRow[];
  aggregated_results?: Record<string, number>;
}

function findFraction(text: string): [number, number] | null {
  const len = text.length;
  let i = 0;
  while (i < len) {
    if (text[i] >= '0' && text[i] <= '9') {
      let numEnd = i;
      while (numEnd < len && text[numEnd] >= '0' && text[numEnd] <= '9')
        numEnd++;
      let j = numEnd;
      while (j < len && (text[j] === ' ' || text[j] === '\t')) j++;
      if (j < len && text[j] === '/') {
        j++;
        while (j < len && (text[j] === ' ' || text[j] === '\t')) j++;
        if (j < len && text[j] >= '0' && text[j] <= '9') {
          let denomEnd = j;
          while (
            denomEnd < len &&
            text[denomEnd] >= '0' &&
            text[denomEnd] <= '9'
          )
            denomEnd++;
          return [
            Number(text.slice(i, numEnd)),
            Number(text.slice(j, denomEnd)),
          ];
        }
      }
      i = numEnd;
    } else {
      i++;
    }
  }
  return null;
}

function findScoreLabel(text: string): number {
  const lower = text.toLowerCase();
  let pos = lower.indexOf('score');
  while (pos !== -1) {
    let j = pos + 5;
    while (
      j < text.length &&
      (text[j] === '*' ||
        text[j] === ':' ||
        text[j] === ' ' ||
        text[j] === '\t')
    )
      j++;
    if (j < text.length && text[j] >= '0' && text[j] <= '9') return j;
    pos = lower.indexOf('score', pos + 1);
  }
  return -1;
}

function parseNumber(text: string, start: number): [number, number] {
  let end = start;
  while (end < text.length && text[end] >= '0' && text[end] <= '9') end++;
  if (end < text.length && text[end] === '.') {
    const dotPos = end;
    end++;
    while (end < text.length && text[end] >= '0' && text[end] <= '9') end++;
    if (end === dotPos + 1) end = dotPos;
  }
  return [Number(text.slice(start, end)), end];
}

function parseScoreFromFeedback(feedback: string): number | null {
  const numStart = findScoreLabel(feedback);
  if (numStart >= 0) {
    const [num, numEnd] = parseNumber(feedback, numStart);
    let j = numEnd;
    while (j < feedback.length && (feedback[j] === ' ' || feedback[j] === '\t'))
      j++;
    if (j < feedback.length && feedback[j] === '/') {
      j++;
      while (
        j < feedback.length &&
        (feedback[j] === ' ' || feedback[j] === '\t')
      )
        j++;
      if (j < feedback.length && feedback[j] >= '0' && feedback[j] <= '9') {
        const [denom] = parseNumber(feedback, j);
        if (denom > 0) return num / denom;
      }
    }
    return num;
  }

  const fraction = findFraction(feedback);
  if (fraction && fraction[1] > 0) {
    return fraction[0] / fraction[1];
  }

  return null;
}

function extractScore(
  response: { results?: Record<string, ScoringFnResult> },
  functionId: string,
): number {
  const fnResult = response.results?.[functionId];
  if (!fnResult?.score_rows?.length) return 0;
  const row = fnResult.score_rows[0];
  if (row.scores && Object.keys(row.scores).length > 0) {
    const vals = Object.values(row.scores)
      .map(s => s.value)
      .filter(v => typeof v === 'number');
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }
  if (typeof row.score === 'number') return row.score;
  if (row.judge_feedback) {
    const parsed = parseScoreFromFeedback(row.judge_feedback);
    if (parsed !== null) return parsed;
  }
  return 0;
}

async function gradeCriteriaAsync(
  criteria: EvaluationCriterion[],
  actualOutput: string,
  testCaseInput: string,
  expectedOutput: string | undefined,
  client: ResponsesApiClient,
  _actualAgent?: string,
): Promise<
  Array<{
    criterionId: string;
    passed: boolean;
    score: number;
    details?: string;
  }>
> {
  const results: Array<{
    criterionId: string;
    passed: boolean;
    score: number;
    details?: string;
  }> = [];

  for (const criterion of criteria) {
    switch (criterion.type) {
      case 'exact_match': {
        const match = actualOutput === criterion.pattern;
        results.push({
          criterionId: criterion.id,
          passed: match,
          score: match ? 1 : 0,
        });
        break;
      }
      case 'contains': {
        const contains = criterion.pattern
          ? actualOutput.toLowerCase().includes(criterion.pattern.toLowerCase())
          : false;
        results.push({
          criterionId: criterion.id,
          passed: contains,
          score: contains ? 1 : 0,
        });
        break;
      }
      case 'regex': {
        try {
          const regex = new RegExp(criterion.pattern || '', 'i');
          const matches = regex.test(actualOutput);
          results.push({
            criterionId: criterion.id,
            passed: matches,
            score: matches ? 1 : 0,
          });
        } catch {
          results.push({
            criterionId: criterion.id,
            passed: false,
            score: 0,
            details: 'Invalid regex pattern',
          });
        }
        break;
      }
      case 'llm_graded': {
        try {
          const fn = criterion.scoringFunction || 'basic::subset_of';
          const threshold = criterion.threshold ?? 0.7;
          const resp = await client.request<{
            results?: Record<string, ScoringFnResult>;
          }>('/v1/scoring/score', {
            method: 'POST',
            body: {
              input_rows: [
                {
                  input_query: testCaseInput,
                  generated_answer: actualOutput,
                  ...(expectedOutput
                    ? { expected_answer: expectedOutput }
                    : {}),
                },
              ],
              scoring_functions: { [fn]: null },
            },
          });
          const score = extractScore(resp, fn);
          const feedback = resp.results?.[fn]?.score_rows?.[0]?.judge_feedback;
          results.push({
            criterionId: criterion.id,
            passed: score >= threshold,
            score,
            details: feedback
              ? `${fn}: ${feedback.substring(0, 200)}`
              : `Scored by ${fn}`,
          });
        } catch (err) {
          results.push({
            criterionId: criterion.id,
            passed: false,
            score: 0,
            details: `LLM grading failed: ${err instanceof Error ? err.message : String(err)}`,
          });
        }
        break;
      }
      default:
        results.push({
          criterionId: criterion.id,
          passed: true,
          score: 1,
          details: 'Custom criterion -- auto-pass',
        });
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export function registerEvaluationRoutes(
  ctx: RouteContext,
  deps: EvaluationDeps,
): void {
  const { router, logger, sendRouteError, requireAdminAccess, getUserRef } =
    ctx;
  const withRoute = createWithRoute(logger, sendRouteError);
  const { workflowService, runWorkflow, adminConfig } = deps;

  async function getLlamaStackClient(): Promise<ResponsesApiClient> {
    const { url, skipTls } = await resolveLlamaStackConfig(ctx, adminConfig);
    return new ResponsesApiClient(
      { baseUrl: url, skipTlsVerify: skipTls },
      logger,
    );
  }

  // -----------------------------------------------------------------------
  // POST /workflows/:id/evaluate  -- run evaluation with test cases
  // -----------------------------------------------------------------------
  router.post(
    '/workflows/:id/evaluate',
    requireAdminAccess,
    withRoute(
      req => `Run evaluation for workflow ${req.params.id}`,
      'Failed to run evaluation',
      async (req, res) => {
        const user = await getUserRef(req);
        const {
          testCases,
          suiteId,
          scoringFunctions: globalScoringFns,
        } = req.body as {
          testCases?: WorkflowTestCase[];
          suiteId?: string;
          scoringFunctions?: string[];
        };

        let cases: WorkflowTestCase[] = [];
        if (testCases && testCases.length > 0) {
          cases = testCases;
        } else if (suiteId) {
          const suites = await workflowService.getTestSuites(req.params.id);
          const suite = suites.find(s => s.id === suiteId);
          if (!suite) throw new InputError(`Test suite not found: ${suiteId}`);
          cases = suite.testCases;
        } else {
          throw new InputError('Must provide testCases or suiteId');
        }

        const workflow = await workflowService.getWorkflow(req.params.id);
        const startTime = Date.now();

        const results: TestCaseResult[] = [];
        for (const testCase of cases) {
          const caseStart = Date.now();
          try {
            const runResult = await runWorkflow(req.params.id, testCase.input);

            let criteria = testCase.criteria ?? [];
            if (
              criteria.length === 0 &&
              globalScoringFns &&
              globalScoringFns.length > 0
            ) {
              criteria = globalScoringFns.map((fn, i) => ({
                id: `auto-${i}`,
                name: fn.split('::').pop() || fn,
                type: 'llm_graded' as const,
                weight: 1,
                scoringFunction: fn,
                threshold: 0.7,
              }));
            }
            if (criteria.length === 0 && testCase.expectedOutput) {
              criteria = [
                {
                  id: 'auto-contains',
                  name: 'Contains expected',
                  type: 'contains',
                  weight: 1,
                  pattern: testCase.expectedOutput,
                },
              ];
            }

            const criterionResults = await gradeCriteriaAsync(
              criteria,
              runResult.response,
              testCase.input,
              testCase.expectedOutput,
              await getLlamaStackClient(),
              runResult.agentName,
            );
            const passed =
              criterionResults.length > 0
                ? criterionResults.every(c => c.passed)
                : true;
            const score =
              criterionResults.length > 0
                ? criterionResults.reduce((s, c) => s + c.score, 0) /
                  criterionResults.length
                : 1;

            results.push({
              testCaseId: testCase.id,
              passed,
              score,
              actualOutput: runResult.response,
              actualAgent: runResult.agentName,
              criterionResults,
              trace: {
                runId: uuid(),
                workflowId: req.params.id,
                workflowVersion: workflow.version,
                status: 'completed',
                startedAt: new Date(caseStart).toISOString(),
                completedAt: new Date().toISOString(),
                nodeExecutions: runResult.trace,
                totalTokenUsage: runResult.tokenUsage,
                totalDurationMs: runResult.durationMs,
              },
              durationMs: Date.now() - caseStart,
            });
          } catch (err) {
            results.push({
              testCaseId: testCase.id,
              passed: false,
              score: 0,
              actualOutput: err instanceof Error ? err.message : String(err),
              criterionResults: [],
              trace: {
                runId: uuid(),
                workflowId: req.params.id,
                workflowVersion: workflow.version,
                status: 'failed',
                startedAt: new Date(caseStart).toISOString(),
                completedAt: new Date().toISOString(),
                nodeExecutions: [],
                error: err instanceof Error ? err.message : String(err),
                totalDurationMs: Date.now() - caseStart,
              },
              durationMs: Date.now() - caseStart,
            });
          }
        }

        const passRate =
          results.length > 0
            ? results.filter(r => r.passed).length / results.length
            : 0;
        const overallScore =
          results.length > 0
            ? results.reduce((s, r) => s + r.score, 0) / results.length
            : 0;

        const evaluation: WorkflowEvaluationResult = {
          evaluationId: uuid(),
          workflowId: req.params.id,
          workflowVersion: workflow.version,
          ranAt: new Date().toISOString(),
          ranBy: user,
          testCaseResults: results,
          overallScore,
          passRate,
          totalDurationMs: Date.now() - startTime,
        };

        await workflowService.saveEvaluation(evaluation, user);
        res.json(evaluation);
      },
    ),
  );

  // -----------------------------------------------------------------------
  // GET /workflows/:id/evaluations/:evalId
  // -----------------------------------------------------------------------
  router.get(
    '/workflows/:id/evaluations/:evalId',
    requireAdminAccess,
    withRoute(
      req => `Get evaluation ${req.params.evalId}`,
      'Failed to get evaluation',
      async (req, res) => {
        const evaluations = await workflowService.getEvaluations(req.params.id);
        const found = evaluations.find(
          e => e.evaluationId === req.params.evalId,
        );
        if (!found) {
          res.status(404).json({ error: 'Evaluation not found' });
          return;
        }
        res.json(found);
      },
    ),
  );

  // -----------------------------------------------------------------------
  // GET /scoring-functions  -- list available LlamaStack scoring functions
  // -----------------------------------------------------------------------
  router.get(
    '/scoring-functions',
    requireAdminAccess,
    withRoute(
      () => 'List scoring functions',
      'Failed to list scoring functions',
      async (_req, res) => {
        const resp = await (
          await getLlamaStackClient()
        ).request<{ data?: Array<Record<string, unknown>> }>(
          '/v1/scoring-functions',
          { method: 'GET' },
        );
        const functions = Array.isArray(resp) ? resp : resp.data || [];
        res.json({ data: functions });
      },
    ),
  );

  // -----------------------------------------------------------------------
  // POST /scoring/score  -- ad-hoc scoring via LlamaStack
  // -----------------------------------------------------------------------
  router.post(
    '/scoring/score',
    requireAdminAccess,
    withRoute(
      () => 'Score rows',
      'Failed to score',
      async (req, res) => {
        const resp = await (
          await getLlamaStackClient()
        ).request<Record<string, unknown>>('/v1/scoring/score', {
          method: 'POST',
          body: req.body,
        });
        res.json(resp);
      },
    ),
  );

  // -----------------------------------------------------------------------
  // Benchmarks CRUD + execution (proxy to LlamaStack v1alpha)
  // -----------------------------------------------------------------------

  router.get(
    '/benchmarks',
    requireAdminAccess,
    withRoute(
      () => 'List benchmarks',
      'Failed to list benchmarks',
      async (_req, res) => {
        const resp = await (
          await getLlamaStackClient()
        ).request<Record<string, unknown>>('/v1alpha/eval/benchmarks', {
          method: 'GET',
        });
        res.json(resp);
      },
    ),
  );

  router.get(
    '/benchmarks/:id',
    requireAdminAccess,
    withRoute(
      req => `Get benchmark ${req.params.id}`,
      'Failed to get benchmark',
      async (req, res) => {
        const resp = await (
          await getLlamaStackClient()
        ).request<Record<string, unknown>>(
          `/v1alpha/eval/benchmarks/${encodeURIComponent(req.params.id)}`,
          { method: 'GET' },
        );
        res.json(resp);
      },
    ),
  );

  router.post(
    '/benchmarks',
    requireAdminAccess,
    withRoute(
      () => 'Create benchmark',
      'Failed to create benchmark',
      async (req, res) => {
        const {
          name,
          testCases,
          scoringFunctions: scoringFns,
        } = req.body as {
          name: string;
          testCases: Array<{ input: string; expectedOutput?: string }>;
          scoringFunctions: string[];
        };

        if (!name || !testCases?.length || !scoringFns?.length) {
          throw new InputError(
            'name, testCases, and scoringFunctions are required',
          );
        }

        const datasetId = `eval-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

        await (
          await getLlamaStackClient()
        ).request<Record<string, unknown>>('/v1beta/datasets', {
          method: 'POST',
          body: {
            dataset_id: datasetId,
            provider_id: 'localfs',
            purpose: 'eval/messages-answer',
            source: {
              type: 'rows',
              rows: testCases.map(tc => ({
                input_query: tc.input,
                expected_answer: tc.expectedOutput || '',
                chat_completion_input: JSON.stringify([
                  { role: 'user', content: tc.input },
                ]),
              })),
            },
          },
        });

        const benchmarkId = `bench-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        const benchResp = await (
          await getLlamaStackClient()
        ).request<Record<string, unknown>>('/v1alpha/eval/benchmarks', {
          method: 'POST',
          body: {
            benchmark_id: benchmarkId,
            dataset_id: datasetId,
            scoring_functions: scoringFns,
            provider_id: 'meta-reference',
          },
        });

        res.json({ benchmarkId, datasetId, ...benchResp });
      },
    ),
  );

  router.delete(
    '/benchmarks/:id',
    requireAdminAccess,
    withRoute(
      req => `Delete benchmark ${req.params.id}`,
      'Failed to delete benchmark',
      async (req, res) => {
        await (
          await getLlamaStackClient()
        ).request<Record<string, unknown>>(
          `/v1alpha/eval/benchmarks/${encodeURIComponent(req.params.id)}`,
          { method: 'DELETE' },
        );
        res.json({ deleted: true });
      },
    ),
  );

  router.post(
    '/benchmarks/:id/run',
    requireAdminAccess,
    withRoute(
      req => `Run benchmark ${req.params.id}`,
      'Failed to run benchmark',
      async (req, res) => {
        const { model, systemMessage } = req.body as {
          model?: string;
          systemMessage?: string;
        };

        const { model: resolvedModel } = await resolveLlamaStackConfig(
          ctx,
          adminConfig,
        );
        const resp = await (
          await getLlamaStackClient()
        ).request<Record<string, unknown>>(
          `/v1alpha/eval/benchmarks/${encodeURIComponent(req.params.id)}/jobs`,
          {
            method: 'POST',
            body: {
              benchmark_config: {
                eval_candidate: {
                  type: 'model',
                  model: model || resolvedModel,
                  sampling_params: { temperature: 0.7 },
                  ...(systemMessage ? { system_message: systemMessage } : {}),
                },
              },
            },
          },
        );
        res.json(resp);
      },
    ),
  );

  router.get(
    '/benchmarks/:id/jobs/:jobId',
    requireAdminAccess,
    withRoute(
      req => `Benchmark job status ${req.params.jobId}`,
      'Failed to get job status',
      async (req, res) => {
        const resp = await (
          await getLlamaStackClient()
        ).request<Record<string, unknown>>(
          `/v1alpha/eval/benchmarks/${encodeURIComponent(req.params.id)}/jobs/${encodeURIComponent(req.params.jobId)}`,
          { method: 'GET' },
        );
        res.json(resp);
      },
    ),
  );

  router.get(
    '/benchmarks/:id/jobs/:jobId/result',
    requireAdminAccess,
    withRoute(
      req => `Benchmark job result ${req.params.jobId}`,
      'Failed to get job result',
      async (req, res) => {
        const resp = await (
          await getLlamaStackClient()
        ).request<Record<string, unknown>>(
          `/v1alpha/eval/benchmarks/${encodeURIComponent(req.params.id)}/jobs/${encodeURIComponent(req.params.jobId)}/result`,
          { method: 'GET' },
        );
        res.json(resp);
      },
    ),
  );

  // -----------------------------------------------------------------------
  // POST /benchmarks/:id/evaluate-rows  -- inline row evaluation
  // -----------------------------------------------------------------------
  router.post(
    '/benchmarks/:id/evaluate-rows',
    requireAdminAccess,
    withRoute(
      req => `Evaluate rows for benchmark ${req.params.id}`,
      'Failed to evaluate rows',
      async (req, res) => {
        const resp = await (
          await getLlamaStackClient()
        ).request<Record<string, unknown>>(
          `/v1alpha/eval/benchmarks/${encodeURIComponent(req.params.id)}/evaluations`,
          { method: 'POST', body: req.body },
        );
        res.json(resp);
      },
    ),
  );

  // -----------------------------------------------------------------------
  // Datasets CRUD (proxy to LlamaStack v1beta)
  // -----------------------------------------------------------------------

  router.get(
    '/datasets',
    requireAdminAccess,
    withRoute(
      () => 'List datasets',
      'Failed to list datasets',
      async (_req, res) => {
        const resp = await (
          await getLlamaStackClient()
        ).request<Record<string, unknown>>('/v1beta/datasets', {
          method: 'GET',
        });
        res.json(resp);
      },
    ),
  );
}
