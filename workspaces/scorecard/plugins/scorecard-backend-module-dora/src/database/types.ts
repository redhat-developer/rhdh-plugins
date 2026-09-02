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

export type DbDoraDeploymentCreate = {
  catalogEntityRef: string;
  collectorId: string;
  collectorInputHash: string;
  originalDeploymentId: string;
  commitSha: string;
  environment?: string | null;
  createdAt: Date;
};

export type DbDoraDeployment = {
  id: string;
  catalogEntityRef: string;
  collectorId: string;
  collectorInputHash: string;
  originalDeploymentId: string;
  commitSha: string;
  environment: string | null;
  createdAt: Date;
};

export type DbDoraIncidentCreate = {
  catalogEntityRef: string;
  collectorId: string;
  collectorInputHash: string;
  originalIncidentId: string;
  createdAt: Date;
  updatedAt: Date;
  resolutionAt?: Date | null;
};

export type DbDoraIncident = {
  id: string;
  catalogEntityRef: string;
  collectorId: string;
  collectorInputHash: string;
  originalIncidentId: string;
  createdAt: Date;
  updatedAt: Date;
  resolutionAt: Date | null;
};

export type DbDoraPullRequestCreate = {
  catalogEntityRef: string;
  collectorId: string;
  collectorInputHash: string;
  originalPrId: string;
  firstCommitAt: Date;
  deploymentId: string;
};

export type DbDoraPullRequest = {
  id: string;
  catalogEntityRef: string;
  collectorId: string;
  collectorInputHash: string;
  originalPrId: string;
  firstCommitAt: Date;
  deploymentId: string;
};
