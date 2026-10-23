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

/**
 * Common skills catalog entity provider module.
 *
 * Consumes normalized v1 snapshots from OCI and npx connectors and
 * produces `AiResource` entities with `spec.type: skill`.
 *
 * @packageDocumentation
 */

export { catalogModuleSkillsCatalogProvider as default } from './module';
export { SkillsCatalogProvider } from './SkillsCatalogProvider';
export { readSkillsCatalogProviderConfigs } from './config';
export { calculateReconciliationPlan } from './reconciliation-planner';
export type {
  PendingAcknowledgment,
  PendingDelta,
  ReconciliationStore,
} from './reconciliation-store';
export type {
  CommittedSourceState,
  ExternalOwnership,
  IdentityCollision,
  MappedSkillEntity,
  OwnedEntity,
  PlannedRemoval,
  PlannedUpsert,
  ReconciliationPlan,
  ReconciliationPlanInput,
  SkillsCatalogProviderConfig,
  SourceConsumerConfig,
} from './types';
