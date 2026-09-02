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
  DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
  DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
  DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
} from '../constants';
import { collectorInputHash } from '../service/collectorHash';
import {
  fromDoraDeploymentRow,
  fromDoraIncidentRow,
  fromDoraPullRequestRow,
  toDoraDeploymentRow,
  toDoraIncidentRow,
  toDoraPullRequestRow,
} from './mappers';

const EMPTY_INPUT_HASH = collectorInputHash({});

describe('mappers', () => {
  describe('deployments', () => {
    it('maps create model to snake_case row fields', () => {
      const createdAt = new Date('2026-06-10T10:00:00.000Z');
      const create = {
        catalogEntityRef: 'component:default/service-a',
        collectorId: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
        collectorInputHash: EMPTY_INPUT_HASH,
        originalDeploymentId: 'dep-1',
        commitSha: 'sha-1',
        environment: 'production',
        createdAt,
      };

      expect(toDoraDeploymentRow(create)).toEqual({
        catalog_entity_ref: 'component:default/service-a',
        collector_id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
        collector_input_hash: EMPTY_INPUT_HASH,
        original_deployment_id: 'dep-1',
        commit_sha: 'sha-1',
        environment: 'production',
        created_at: createdAt,
      });
    });

    it('defaults missing environment to null', () => {
      expect(
        toDoraDeploymentRow({
          catalogEntityRef: 'component:default/service-a',
          collectorId: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          collectorInputHash: EMPTY_INPUT_HASH,
          originalDeploymentId: 'dep-1',
          commitSha: 'sha-1',
          createdAt: new Date('2026-06-10T10:00:00.000Z'),
        }).environment,
      ).toBeNull();
    });

    it('maps database row to camelCase including id', () => {
      expect(
        fromDoraDeploymentRow({
          id: 'dep-row-1',
          catalog_entity_ref: 'component:default/service-a',
          collector_id: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
          collector_input_hash: EMPTY_INPUT_HASH,
          original_deployment_id: 'dep-1',
          commit_sha: 'sha-1',
          environment: null,
          created_at: '2026-06-10T10:00:00.000Z',
        }),
      ).toEqual({
        id: 'dep-row-1',
        catalogEntityRef: 'component:default/service-a',
        collectorId: DORA_DEFAULT_DEPLOYMENTS_COLLECTOR_ID,
        collectorInputHash: EMPTY_INPUT_HASH,
        originalDeploymentId: 'dep-1',
        commitSha: 'sha-1',
        environment: null,
        createdAt: new Date('2026-06-10T10:00:00.000Z'),
      });
    });
  });

  describe('incidents', () => {
    it('maps create model to snake_case row fields', () => {
      const createdAt = new Date('2026-06-11T10:00:00.000Z');
      const updatedAt = new Date('2026-06-11T12:00:00.000Z');
      const resolutionAt = new Date('2026-06-11T12:00:00.000Z');
      const create = {
        catalogEntityRef: 'component:default/service-a',
        collectorId: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
        collectorInputHash: EMPTY_INPUT_HASH,
        originalIncidentId: 'INC-1',
        createdAt,
        updatedAt,
        resolutionAt,
      };

      expect(toDoraIncidentRow(create)).toEqual({
        catalog_entity_ref: 'component:default/service-a',
        collector_id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
        collector_input_hash: EMPTY_INPUT_HASH,
        original_incident_id: 'INC-1',
        created_at: createdAt,
        updated_at: updatedAt,
        resolution_at: resolutionAt,
      });
    });

    it('defaults missing resolutionAt to null', () => {
      expect(
        toDoraIncidentRow({
          catalogEntityRef: 'component:default/service-a',
          collectorId: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          collectorInputHash: EMPTY_INPUT_HASH,
          originalIncidentId: 'INC-1',
          createdAt: new Date('2026-06-11T10:00:00.000Z'),
          updatedAt: new Date('2026-06-11T10:00:00.000Z'),
        }).resolution_at,
      ).toBeNull();
    });

    it('maps null resolution_at and parses string timestamps', () => {
      expect(
        fromDoraIncidentRow({
          id: 'inc-row-1',
          catalog_entity_ref: 'component:default/service-a',
          collector_id: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
          collector_input_hash: EMPTY_INPUT_HASH,
          original_incident_id: 'INC-1',
          created_at: '2026-06-11T10:00:00.000Z',
          updated_at: '2026-06-11T12:00:00.000Z',
          resolution_at: null,
        }),
      ).toEqual({
        id: 'inc-row-1',
        catalogEntityRef: 'component:default/service-a',
        collectorId: DORA_DEFAULT_INCIDENTS_COLLECTOR_ID,
        collectorInputHash: EMPTY_INPUT_HASH,
        originalIncidentId: 'INC-1',
        createdAt: new Date('2026-06-11T10:00:00.000Z'),
        updatedAt: new Date('2026-06-11T12:00:00.000Z'),
        resolutionAt: null,
      });
    });
  });

  describe('pull requests', () => {
    it('maps create model to snake_case row fields', () => {
      const firstCommitAt = new Date('2026-06-09T10:00:00.000Z');
      const create = {
        catalogEntityRef: 'component:default/service-a',
        collectorId: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
        collectorInputHash: EMPTY_INPUT_HASH,
        originalPrId: 'pr-1',
        firstCommitAt,
        deploymentId: 'dep-row-1',
      };

      expect(toDoraPullRequestRow(create)).toEqual({
        catalog_entity_ref: 'component:default/service-a',
        collector_id: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
        collector_input_hash: EMPTY_INPUT_HASH,
        original_pr_id: 'pr-1',
        first_commit_at: firstCommitAt,
        deployment_id: 'dep-row-1',
      });
    });

    it('maps database row to camelCase including id', () => {
      expect(
        fromDoraPullRequestRow({
          id: 'pr-row-1',
          catalog_entity_ref: 'component:default/service-a',
          collector_id: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
          collector_input_hash: EMPTY_INPUT_HASH,
          original_pr_id: 'pr-1',
          first_commit_at: '2026-06-09T10:00:00.000Z',
          deployment_id: 'dep-row-1',
        }),
      ).toEqual({
        id: 'pr-row-1',
        catalogEntityRef: 'component:default/service-a',
        collectorId: DORA_DEFAULT_DEPLOYMENT_PULL_REQUESTS_COLLECTOR_ID,
        collectorInputHash: EMPTY_INPUT_HASH,
        originalPrId: 'pr-1',
        firstCommitAt: new Date('2026-06-09T10:00:00.000Z'),
        deploymentId: 'dep-row-1',
      });
    });
  });
});
