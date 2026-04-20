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

import type { Module } from '@red-hat-developer-hub/backstage-plugin-x2a-common';

import { calculateModuleStatus } from './moduleStatus';
import type { ReconcileJobDeps } from './services';
import { reconcileJobStatus } from './utils';

/**
 * Reconcile any pending/running phase jobs on a module against K8s state.
 * Mutates the module in-place and returns it.
 * @public
 */
export async function reconcileModuleJobs(
  module: Module,
  deps: ReconcileJobDeps,
): Promise<Module> {
  const phases = ['analyze', 'migrate', 'publish'] as const;
  for (const phase of phases) {
    const job = module[phase];
    if (job && ['pending', 'running'].includes(job.status)) {
      module[phase] = await reconcileJobStatus(job, deps);
    }
  }
  return module;
}

/**
 * Reconciles all modules in parallel, then recalculates aggregate status per module.
 *
 * Mutates modules in place (same contract as the HTTP list-modules handler).
 * @public
 */
export async function listModulesWithReconciledStatuses(
  modules: Module[],
  deps: ReconcileJobDeps,
): Promise<Module[]> {
  await Promise.all(modules.map(m => reconcileModuleJobs(m, deps)));
  for (const m of modules) {
    const { status, errorDetails } = calculateModuleStatus({
      analyze: m.analyze,
      migrate: m.migrate,
      publish: m.publish,
    });
    m.status = status;
    m.errorDetails = errorDetails;
  }
  return modules;
}
