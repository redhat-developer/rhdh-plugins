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

import {
  Job,
  JobStatusEnum,
  MigrationPhase,
  ModulesStatusSummary,
  PortfolioProjectCounts,
  PortfolioSummary,
  ProjectState,
} from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { mapRowToModule, parseTelemetry } from './mappers';
import {
  calculateProjectStatus,
  enrichModuleWithJobStatus,
} from './projectStatus';

export type PortfolioJobRow = {
  project_id: string;
  module_id?: string | null;
  phase: string;
  status?: string | null;
  started_at: Date | string;
  telemetry?: string | null;
};

const MODULE_PHASES = ['analyze', 'migrate', 'publish'] as const;

export function emptyPortfolio(): PortfolioSummary {
  return {
    modules: {
      total: 0,
      finished: 0,
      waiting: 0,
      pending: 0,
      running: 0,
      error: 0,
      cancelled: 0,
      removed: 0,
    },
    projectCounts: {
      created: 0,
      initializing: 0,
      initialized: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
    },
    inputTokens: 0,
    outputTokens: 0,
    tokensReported: false,
  };
}

type ModulePhaseJobs = {
  analyze?: Job;
  migrate?: Job;
  publish?: Job;
};

/**
 * Sums module buckets, project states, and token totals for the permitted
 * project ids. Status uses the newest analyze, migrate, and publish job per
 * module. Tokens use every job row.
 */
export function summarizePortfolio(
  projectIds: string[],
  moduleRows: Record<string, unknown>[],
  jobRows: PortfolioJobRow[],
): PortfolioSummary {
  if (projectIds.length === 0) {
    return emptyPortfolio();
  }

  const permitted = new Set(projectIds);
  const jobs = jobRows
    .filter(row => permitted.has(row.project_id))
    .map((row, index) => rowToJob(row, index));

  const { latestByModule, initByProject } = indexJobs(jobs);
  const modulesByProject = groupModulesByProject(
    projectIds,
    moduleRows,
    latestByModule,
  );

  const modules = emptyModules();
  const projectCounts = emptyProjectCounts();

  for (const projectId of projectIds) {
    const status = calculateProjectStatus(
      modulesByProject.get(projectId) ?? [],
      initByProject.get(projectId),
    );
    addSummary(modules, status.modulesSummary);
    incrementState(projectCounts, status.state);
  }

  return {
    modules,
    projectCounts,
    ...sumTokens(jobs),
  };
}

function indexJobs(jobs: Job[]): {
  latestByModule: Map<string, ModulePhaseJobs>;
  initByProject: Map<string, Job>;
} {
  const latestByModule = new Map<string, ModulePhaseJobs>();
  const initByProject = new Map<string, Job>();

  for (const job of jobs) {
    if (job.phase === 'init' && !job.moduleId) {
      const current = initByProject.get(job.projectId);
      if (isNewer(job, current)) {
        initByProject.set(job.projectId, job);
      }
      continue;
    }

    recordModulePhase(latestByModule, job);
  }

  return { latestByModule, initByProject };
}

function recordModulePhase(
  latestByModule: Map<string, ModulePhaseJobs>,
  job: Job,
): void {
  if (!job.moduleId || !isModulePhase(job.phase)) {
    return;
  }

  const phases = latestByModule.get(job.moduleId) ?? {};
  const phase = job.phase;
  if (isNewer(job, phases[phase])) {
    phases[phase] = job;
    latestByModule.set(job.moduleId, phases);
  }
}

function groupModulesByProject(
  projectIds: string[],
  moduleRows: Record<string, unknown>[],
  latestByModule: Map<string, ModulePhaseJobs>,
): Map<string, ReturnType<typeof mapRowToModule>[]> {
  const modulesByProject = new Map<string, ReturnType<typeof mapRowToModule>[]>(
    projectIds.map(id => [id, []]),
  );
  for (const row of moduleRows) {
    const module = mapRowToModule(row);
    const bucket = modulesByProject.get(module.projectId);
    if (!bucket) {
      continue;
    }
    bucket.push(
      enrichModuleWithJobStatus(module, latestByModule.get(module.id) ?? {}),
    );
  }
  return modulesByProject;
}

function sumTokens(jobs: Job[]): {
  inputTokens: number;
  outputTokens: number;
  tokensReported: boolean;
} {
  let inputTokens = 0;
  let outputTokens = 0;
  let tokensReported = false;

  for (const job of jobs) {
    const reported = addAgentTokens(job);
    inputTokens += reported.inputTokens;
    outputTokens += reported.outputTokens;
    tokensReported = tokensReported || reported.tokensReported;
  }

  return { inputTokens, outputTokens, tokensReported };
}

function addAgentTokens(job: Job): {
  inputTokens: number;
  outputTokens: number;
  tokensReported: boolean;
} {
  let inputTokens = 0;
  let outputTokens = 0;
  let tokensReported = false;

  for (const agent of Object.values(job.telemetry?.agents ?? {})) {
    if (typeof agent.inputTokens === 'number') {
      inputTokens += agent.inputTokens;
      tokensReported = true;
    }
    if (typeof agent.outputTokens === 'number') {
      outputTokens += agent.outputTokens;
      tokensReported = true;
    }
  }

  return { inputTokens, outputTokens, tokensReported };
}

function rowToJob(row: PortfolioJobRow, index: number): Job {
  return {
    id: `portfolio-${index}`,
    projectId: row.project_id,
    moduleId: row.module_id ?? undefined,
    startedAt: new Date(row.started_at),
    phase: row.phase as MigrationPhase,
    k8sJobName: '',
    status: (row.status || 'pending') as JobStatusEnum,
    telemetry: parseTelemetry(row.telemetry ?? undefined),
  };
}

function isModulePhase(phase: string): phase is (typeof MODULE_PHASES)[number] {
  return (MODULE_PHASES as readonly string[]).includes(phase);
}

function isNewer(candidate: Job, current: Job | undefined): boolean {
  if (!current) {
    return true;
  }
  return candidate.startedAt.getTime() > current.startedAt.getTime();
}

function emptyModules(): ModulesStatusSummary {
  return emptyPortfolio().modules;
}

function emptyProjectCounts(): PortfolioProjectCounts {
  return emptyPortfolio().projectCounts;
}

function addSummary(
  target: ModulesStatusSummary,
  source: ModulesStatusSummary,
): void {
  target.total += source.total;
  target.finished += source.finished;
  target.waiting += source.waiting;
  target.pending += source.pending;
  target.running += source.running;
  target.error += source.error;
  target.cancelled += source.cancelled;
  target.removed += source.removed;
}

function incrementState(counts: PortfolioProjectCounts, state: string): void {
  const projectState = ProjectState.from(state);
  if (projectState.isCreated()) counts.created++;
  else if (projectState.isInitializing()) counts.initializing++;
  else if (projectState.isInitialized()) counts.initialized++;
  else if (projectState.isInProgress()) counts.inProgress++;
  else if (projectState.isComplete()) counts.completed++;
  else if (projectState.isFailed()) counts.failed++;
}
