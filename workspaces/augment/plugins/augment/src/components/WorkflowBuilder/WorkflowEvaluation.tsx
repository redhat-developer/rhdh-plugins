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

import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import { useApi, configApiRef, fetchApiRef } from '@backstage/core-plugin-api';
import type {
  WorkflowTestCase,
  WorkflowEvaluationResult,
} from '@red-hat-developer-hub/backstage-plugin-augment-common';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScoringFunction {
  identifier: string;
  description?: string;
  provider_id?: string;
  return_type?: string;
}

interface Benchmark {
  identifier: string;
  dataset_id?: string;
  scoring_functions?: string[];
  metadata?: Record<string, unknown>;
}

interface BenchmarkJob {
  job_id: string;
  status: string;
}

interface WorkflowEvaluationProps {
  workflowId?: string;
  onClose: () => void;
  onRunEvaluation: (testCases: WorkflowTestCase[], scoringFunctions?: string[]) => Promise<WorkflowEvaluationResult>;
  previousResults?: WorkflowEvaluationResult[];
}

// ---------------------------------------------------------------------------
// Score color helper
// ---------------------------------------------------------------------------

function scoreColor(score: number): 'success' | 'warning' | 'error' {
  if (score >= 0.8) return 'success';
  if (score >= 0.5) return 'warning';
  return 'error';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WorkflowEvaluation({
  workflowId: _workflowId,
  onClose,
  onRunEvaluation,
  previousResults = [],
}: WorkflowEvaluationProps) {
  const configApi = useApi(configApiRef);
  const { fetch: authFetch } = useApi(fetchApiRef);
  const [activeTab, setActiveTab] = useState(0);

  // Test Cases state
  const [testCases, setTestCases] = useState<WorkflowTestCase[]>([
    { id: '1', name: 'Test 1', input: '', criteria: [] },
  ]);
  const [running, setRunning] = useState(false);
  const [currentResult, setCurrentResult] = useState<WorkflowEvaluationResult | null>(null);
  const [evalError, setEvalError] = useState<string | null>(null);
  const [benchmarkError, setBenchmarkError] = useState<string | null>(null);

  // Scoring functions
  const [scoringFunctions, setScoringFunctions] = useState<ScoringFunction[]>([]);
  const [loadingFunctions, setLoadingFunctions] = useState(false);
  const [selectedGraders, setSelectedGraders] = useState<string[]>([]);

  // Benchmarks state
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [loadingBenchmarks, setLoadingBenchmarks] = useState(false);
  const [benchmarkName, setBenchmarkName] = useState('');
  const [savingBenchmark, setSavingBenchmark] = useState(false);
  const [runningBenchmark, setRunningBenchmark] = useState<string | null>(null);
  const [benchmarkJobs, setBenchmarkJobs] = useState<Record<string, BenchmarkJob>>({});
  const [benchmarkResults, setBenchmarkResults] = useState<Record<string, unknown>>({});

  const backendUrl = configApi.getString('backend.baseUrl');

  // Load scoring functions on mount
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingFunctions(true);
      try {
        const resp = await authFetch(`${backendUrl}/api/augment/scoring-functions`);
        if (resp.ok) {
          const json = await resp.json();
          const fns = json.data || json || [];
          if (!cancelled) setScoringFunctions(Array.isArray(fns) ? fns : []);
        }
      } catch {
        // Non-critical failure
      } finally {
        if (!cancelled) setLoadingFunctions(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [backendUrl]);

  // Load benchmarks when tab switches
  const loadBenchmarks = useCallback(async () => {
    setLoadingBenchmarks(true);
    try {
      const resp = await authFetch(`${backendUrl}/api/augment/benchmarks`);
      if (resp.ok) {
        const json = await resp.json();
        const data = json.data || json || [];
        setBenchmarks(Array.isArray(data) ? data : []);
      }
    } catch {
      // Non-critical failure
    } finally {
      setLoadingBenchmarks(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    if (activeTab === 1) loadBenchmarks();
  }, [activeTab, loadBenchmarks]);

  // Test case management
  const addTestCase = useCallback(() => {
    const id = String(Date.now());
    setTestCases(prev => [
      ...prev,
      { id, name: `Test ${prev.length + 1}`, input: '', criteria: [] },
    ]);
  }, []);

  const removeTestCase = useCallback((id: string) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
  }, []);

  const updateTestCase = useCallback(
    (id: string, field: keyof WorkflowTestCase, value: unknown) => {
      setTestCases(prev =>
        prev.map(tc => (tc.id === id ? { ...tc, [field]: value } : tc)),
      );
    },
    [],
  );

  // Run evaluation
  const handleRun = useCallback(async () => {
    const validCases = testCases.filter(tc => tc.input.trim());
    if (validCases.length === 0) return;

    setRunning(true);
    setCurrentResult(null);
    setEvalError(null);
    try {
      const result = await onRunEvaluation(
        validCases,
        selectedGraders.length > 0 ? selectedGraders : undefined,
      );
      setCurrentResult(result);
    } catch (err) {
      setEvalError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }, [testCases, onRunEvaluation, selectedGraders]);

  // Save as benchmark
  const handleSaveBenchmark = useCallback(async () => {
    if (!benchmarkName.trim() || testCases.filter(tc => tc.input.trim()).length === 0) return;
    setSavingBenchmark(true);
    try {
      const validCases = testCases.filter(tc => tc.input.trim());
      const resp = await authFetch(`${backendUrl}/api/augment/benchmarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: benchmarkName,
          testCases: validCases.map(tc => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
          })),
          scoringFunctions: selectedGraders.length > 0
            ? selectedGraders
            : ['braintrust::answer-correctness'],
        }),
      });
      if (resp.ok) {
        setBenchmarkName('');
        setBenchmarkError(null);
        loadBenchmarks();
      } else {
        const errBody = await resp.json().catch(() => ({}));
        setBenchmarkError(`Save failed: ${errBody.message || resp.statusText}`);
      }
    } catch (err) {
      setBenchmarkError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingBenchmark(false);
    }
  }, [benchmarkName, testCases, selectedGraders, backendUrl, loadBenchmarks]);

  // Run a benchmark
  const handleRunBenchmark = useCallback(async (benchmarkId: string) => {
    setRunningBenchmark(benchmarkId);
    try {
      const resp = await authFetch(`${backendUrl}/api/augment/benchmarks/${encodeURIComponent(benchmarkId)}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (resp.ok) {
        const job = await resp.json();
        if (job.error) {
          setBenchmarkError(`Run failed: ${job.message || job.error}`);
        } else {
          setBenchmarkError(null);
          setBenchmarkJobs(prev => ({ ...prev, [benchmarkId]: job }));
          if (job.job_id) {
            pollBenchmarkJob(benchmarkId, job.job_id);
          }
        }
      } else {
        const errBody = await resp.json().catch(() => ({}));
        setBenchmarkError(`Run failed: ${errBody.message || resp.statusText}`);
      }
    } catch (err) {
      setBenchmarkError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunningBenchmark(null);
    }
  }, [backendUrl]);

  const pollBenchmarkJob = useCallback(async (benchmarkId: string, jobId: string) => {
    const poll = async () => {
      try {
        const statusResp = await fetch(
          `${backendUrl}/api/augment/benchmarks/${encodeURIComponent(benchmarkId)}/jobs/${encodeURIComponent(jobId)}`,
        );
        if (statusResp.ok) {
          const status = await statusResp.json();
          setBenchmarkJobs(prev => ({ ...prev, [benchmarkId]: status }));
          if (status.status === 'completed') {
            const resultResp = await fetch(
              `${backendUrl}/api/augment/benchmarks/${encodeURIComponent(benchmarkId)}/jobs/${encodeURIComponent(jobId)}/result`,
            );
            if (resultResp.ok) {
              const result = await resultResp.json();
              setBenchmarkResults(prev => ({ ...prev, [benchmarkId]: result }));
            }
            return;
          }
          if (status.status !== 'failed') {
            setTimeout(poll, 3000);
          }
        }
      } catch {
        // Stop polling on error
      }
    };
    setTimeout(poll, 2000);
  }, [backendUrl]);

  // Delete benchmark
  const handleDeleteBenchmark = useCallback(async (benchmarkId: string) => {
    try {
      await authFetch(`${backendUrl}/api/augment/benchmarks/${encodeURIComponent(benchmarkId)}`, {
        method: 'DELETE',
      });
      loadBenchmarks();
    } catch {
      // Handle silently
    }
  }, [backendUrl, loadBenchmarks]);

  // Group scoring functions
  const groupedFunctions = scoringFunctions.reduce<Record<string, ScoringFunction[]>>((acc, fn) => {
    let group = 'Basic';
    if (fn.identifier.startsWith('braintrust::')) group = 'Braintrust';
    else if (fn.identifier.includes('llm') || fn.identifier.includes('judge')) group = 'LLM-as-Judge';
    else if (fn.provider_id) group = fn.provider_id;
    if (!acc[group]) acc[group] = [];
    acc[group].push(fn);
    return acc;
  }, {});

  return (
    <Paper
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
      elevation={0}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5 }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1, color: 'text.primary' }}>
          Evaluation
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Divider />

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 1.5, minHeight: 40 }}>
        <Tab label="Test Cases" sx={{ minHeight: 40, textTransform: 'none', fontSize: '0.8rem' }} />
        <Tab label="Benchmarks" sx={{ minHeight: 40, textTransform: 'none', fontSize: '0.8rem' }} />
      </Tabs>
      <Divider />

      {/* Tab 0: Test Cases */}
      {activeTab === 0 && (
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, display: 'flex', flexDirection: 'column' }}>
          {/* Grader selection */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" fontWeight={600} sx={{ mb: 0.5, display: 'block', color: 'text.secondary' }}>
              Scoring Functions (Graders)
            </Typography>
            {loadingFunctions ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={14} />
                <Typography variant="caption">Loading scoring functions...</Typography>
              </Box>
            ) : (
              <FormControl size="small" fullWidth>
                <InputLabel id="grader-select-label">Select graders</InputLabel>
                <Select
                  labelId="grader-select-label"
                  multiple
                  value={selectedGraders}
                  onChange={e => setSelectedGraders(typeof e.target.value === 'string' ? [e.target.value] : e.target.value as string[])}
                  label="Select graders"
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(v => (
                        <Chip key={v} label={v.split('::').pop() || v} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {Object.entries(groupedFunctions).flatMap(([group, fns]) => [
                    <MenuItem disabled key={`group-${group}`} sx={{ opacity: '1 !important' }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>{group}</Typography>
                    </MenuItem>,
                    ...fns.map(fn => (
                      <MenuItem key={fn.identifier} value={fn.identifier} sx={{ pl: 3, display: 'block' }}>
                        <Typography variant="body2" sx={{ fontWeight: selectedGraders.includes(fn.identifier) ? 600 : 400 }}>
                          {fn.identifier.split('::').pop() || fn.identifier}
                        </Typography>
                        {fn.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                            {fn.description.length > 80 ? `${fn.description.substring(0, 80)}...` : fn.description}
                          </Typography>
                        )}
                      </MenuItem>
                    )),
                  ])}
                  {scoringFunctions.length === 0 && (
                    <MenuItem disabled>
                      <Typography variant="caption">No scoring functions available</Typography>
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
            )}
            {selectedGraders.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                If no graders selected, test cases with expected output will use &quot;contains&quot; matching
              </Typography>
            )}
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          {/* Test cases */}
          <Typography variant="caption" fontWeight={600} sx={{ mb: 1, display: 'block', color: 'text.secondary' }}>
            Test Cases
          </Typography>
          {testCases.map(tc => (
            <Box
              key={tc.id}
              sx={{
                mb: 1.5,
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  size="small"
                  value={tc.name}
                  onChange={e => updateTestCase(tc.id, 'name', e.target.value)}
                  sx={{ flex: 1, mr: 1 }}
                  placeholder="Test name"
                />
                <IconButton
                  size="small"
                  onClick={() => removeTestCase(tc.id)}
                  disabled={testCases.length <= 1}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={2}
                value={tc.input}
                onChange={e => updateTestCase(tc.id, 'input', e.target.value)}
                placeholder="Input message to test..."
                sx={{ mb: 1 }}
              />
              <TextField
                size="small"
                fullWidth
                value={tc.expectedOutput || ''}
                onChange={e => updateTestCase(tc.id, 'expectedOutput', e.target.value)}
                placeholder="Expected output (for grading reference)"
              />
            </Box>
          ))}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button size="small" startIcon={<AddIcon />} onClick={addTestCase}>
              Add Test Case
            </Button>
          </Box>

          {/* Run + Save buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleRun}
              disabled={running || testCases.every(tc => !tc.input.trim())}
            >
              {running ? 'Running...' : 'Run Evaluation'}
            </Button>
            <Tooltip title="Save current test cases as a reusable LlamaStack benchmark">
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  disabled={savingBenchmark || testCases.every(tc => !tc.input.trim()) || !benchmarkName.trim()}
                  onClick={handleSaveBenchmark}
                >
                  Save as Benchmark
                </Button>
              </span>
            </Tooltip>
            <TextField
              size="small"
              value={benchmarkName}
              onChange={e => setBenchmarkName(e.target.value)}
              placeholder="Benchmark name"
              sx={{ width: 200 }}
            />
          </Box>

          {running && <LinearProgress sx={{ mb: 1 }} />}
          {evalError && <Alert severity="error" sx={{ mb: 1 }}>{evalError}</Alert>}

          {/* Results */}
          {currentResult && (
            <Box sx={{ mt: 1 }}>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
                  Results
                </Typography>
                <Tooltip title="Export results as JSON">
                  <IconButton
                    size="small"
                    aria-label="Export results"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(currentResult, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `eval-results-${new Date().toISOString().slice(0, 10)}.json`; a.click();
                      URL.revokeObjectURL(url);
                    }}
                    sx={{ p: 0.5 }}
                  >
                    <DownloadIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label={`Score: ${(currentResult.overallScore * 100).toFixed(0)}%`}
                  color={scoreColor(currentResult.overallScore)}
                  size="small"
                />
                <Chip
                  label={`Pass Rate: ${(currentResult.passRate * 100).toFixed(0)}%`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`${(currentResult.totalDurationMs / 1000).toFixed(1)}s`}
                  variant="outlined"
                  size="small"
                />
              </Box>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Test Case</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Grader Details</TableCell>
                      <TableCell>Output</TableCell>
                      <TableCell>Duration</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentResult.testCaseResults.map(tcr => {
                      const tc = testCases.find(t => t.id === tcr.testCaseId);
                      return (
                        <TableRow key={tcr.testCaseId}>
                          <TableCell>{tc?.name || tcr.testCaseId}</TableCell>
                          <TableCell>
                            <Chip
                              label={tcr.passed ? 'Pass' : 'Fail'}
                              size="small"
                              color={tcr.passed ? 'success' : 'error'}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${(tcr.score * 100).toFixed(0)}%`}
                              size="small"
                              color={scoreColor(tcr.score)}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            {tcr.criterionResults.map((cr, idx) => (
                              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
                                <Chip
                                  label={`${(cr.score * 100).toFixed(0)}%`}
                                  size="small"
                                  color={scoreColor(cr.score)}
                                  variant="outlined"
                                  sx={{ height: 18, fontSize: '0.65rem' }}
                                />
                                {cr.details && (
                                  <Typography variant="caption" color="text.secondary">{cr.details}</Typography>
                                )}
                              </Box>
                            ))}
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <Tooltip title={tcr.actualOutput}>
                              <Typography variant="caption" noWrap>{tcr.actualOutput}</Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">{tcr.durationMs}ms</Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* Previous results */}
          {previousResults.length > 0 && !currentResult && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary' }}>
                Previous Evaluations
              </Typography>
              {previousResults.slice(0, 5).map(prev => (
                <Alert
                  key={prev.evaluationId}
                  severity={scoreColor(prev.overallScore) === 'success' ? 'success' : scoreColor(prev.overallScore) === 'warning' ? 'warning' : 'error'}
                  sx={{ mb: 0.5 }}
                >
                  v{prev.workflowVersion} - Score: {(prev.overallScore * 100).toFixed(0)}% -
                  Pass Rate: {(prev.passRate * 100).toFixed(0)}% -
                  {new Date(prev.ranAt).toLocaleDateString()}
                </Alert>
              ))}
            </Box>
          )}
        </Box>
      )}

      {/* Tab 1: Benchmarks */}
      {activeTab === 1 && (
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
          {benchmarkError && (
            <Alert severity="error" sx={{ mb: 1 }} onClose={() => setBenchmarkError(null)}>
              {benchmarkError}
            </Alert>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle2" sx={{ flex: 1, color: 'text.primary' }}>
              LlamaStack Benchmarks
            </Typography>
            <IconButton size="small" onClick={loadBenchmarks} disabled={loadingBenchmarks}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Box>

          {loadingBenchmarks && <LinearProgress sx={{ mb: 2 }} />}

          {benchmarks.length === 0 && !loadingBenchmarks && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No benchmarks found. Create one from the Test Cases tab by adding test cases and clicking &quot;Save as Benchmark&quot;.
            </Alert>
          )}

          {benchmarks.map(bm => (
            <Box
              key={bm.identifier}
              sx={{
                mb: 1.5,
                p: 1.5,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600} sx={{ flex: 1, color: 'text.primary' }}>
                  {bm.identifier}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => handleRunBenchmark(bm.identifier)}
                  disabled={runningBenchmark === bm.identifier}
                  sx={{ mr: 0.5, fontSize: '0.7rem' }}
                >
                  {runningBenchmark === bm.identifier ? 'Running...' : 'Run'}
                </Button>
                <IconButton size="small" onClick={() => handleDeleteBenchmark(bm.identifier)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              {bm.dataset_id && (
                <Typography variant="caption" color="text.secondary">
                  Dataset: {bm.dataset_id}
                </Typography>
              )}
              {bm.scoring_functions && bm.scoring_functions.length > 0 && (
                <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {bm.scoring_functions.map(fn => (
                    <Chip key={fn} label={fn.split('::').pop() || fn} size="small" variant="outlined" />
                  ))}
                </Box>
              )}

              {/* Job status */}
              {benchmarkJobs[bm.identifier] && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`Job: ${benchmarkJobs[bm.identifier].status}`}
                    size="small"
                    color={
                      benchmarkJobs[bm.identifier].status === 'completed' ? 'success' :
                      benchmarkJobs[bm.identifier].status === 'failed' ? 'error' : 'default'
                    }
                  />
                </Box>
              )}

              {/* Results */}
              {benchmarkResults[bm.identifier] && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant="caption" fontWeight={600}>Results:</Typography>
                  <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.7rem', mt: 0.5 }}>
                    {JSON.stringify(benchmarkResults[bm.identifier], null, 2)}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
