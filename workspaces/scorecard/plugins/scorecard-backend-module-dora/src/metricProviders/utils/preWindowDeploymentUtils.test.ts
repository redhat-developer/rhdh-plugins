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
  DORA_PREDECESSOR_COLLECT_FROM,
  DORA_PRE_WINDOW_DEPLOYMENT_FETCH_CAP,
} from '../../constants';
import type { Deployment } from '../schemas/deploymentSchemas';
import {
  getChangeFailureRateIncidentFrom,
  getPredecessorCollectorRange,
  mergeSuccessfulProductionDeploymentsWithPredecessor,
} from './preWindowDeploymentUtils';

const productionEnvironments = ['production'];
const windowFrom = new Date('2026-08-01T00:00:00.000Z');

function deployment(
  overrides: Partial<Deployment> & Pick<Deployment, 'id' | 'createdAt'>,
): Deployment {
  return {
    commitSha: `sha-${overrides.id}`,
    environment: 'production',
    result: 'success',
    ...overrides,
  };
}

describe('getPredecessorCollectorRange', () => {
  it('uses epoch from, 1ms exclusive to, and the fetch cap', () => {
    expect(getPredecessorCollectorRange(windowFrom)).toEqual({
      from: DORA_PREDECESSOR_COLLECT_FROM,
      to: '2026-07-31T23:59:59.999Z',
      fetchItemsLimit: DORA_PRE_WINDOW_DEPLOYMENT_FETCH_CAP,
    });
  });
});

describe('getChangeFailureRateIncidentFrom', () => {
  it('starts at predecessor createdAt when present', () => {
    const predecessor = deployment({
      id: 'pre',
      createdAt: '2026-07-20T12:00:00.000Z',
    });

    expect(getChangeFailureRateIncidentFrom(windowFrom, predecessor)).toBe(
      '2026-07-20T12:00:00.000Z',
    );
  });

  it('falls back to windowFrom when there is no predecessor', () => {
    expect(getChangeFailureRateIncidentFrom(windowFrom, undefined)).toBe(
      windowFrom.toISOString(),
    );
  });
});

describe('mergeSuccessfulProductionDeploymentsWithPredecessor', () => {
  const inWindowFirst = deployment({
    id: 'in-1',
    createdAt: '2026-08-05T00:00:00.000Z',
  });
  const inWindowSecond = deployment({
    id: 'in-2',
    createdAt: '2026-08-10T00:00:00.000Z',
  });

  it('returns only filtered in-window deployments when there is no predecessor', () => {
    const result = mergeSuccessfulProductionDeploymentsWithPredecessor({
      inWindowDeployments: [
        inWindowFirst,
        deployment({
          id: 'failed',
          createdAt: '2026-08-06T00:00:00.000Z',
          result: 'failure',
        }),
      ],
      preWindowDeployments: [],
      windowFrom,
      productionEnvironments,
    });

    expect(result.inWindow).toEqual([inWindowFirst]);
    expect(result.predecessor).toBeUndefined();
    expect(result.deployments).toEqual([inWindowFirst]);
  });

  it('prepends the latest successful production deploy before windowFrom', () => {
    const older = deployment({
      id: 'pre-older',
      createdAt: '2026-07-01T00:00:00.000Z',
    });
    const latest = deployment({
      id: 'pre-latest',
      createdAt: '2026-07-20T00:00:00.000Z',
    });

    const result = mergeSuccessfulProductionDeploymentsWithPredecessor({
      inWindowDeployments: [inWindowFirst, inWindowSecond],
      preWindowDeployments: [older, latest],
      windowFrom,
      productionEnvironments,
    });

    expect(result.predecessor).toEqual(latest);
    expect(result.deployments).toEqual([latest, inWindowFirst, inWindowSecond]);
  });

  it('skips failed and non-production pre-window deploys', () => {
    const failed = deployment({
      id: 'pre-failed',
      createdAt: '2026-07-25T00:00:00.000Z',
      result: 'failure',
    });
    const staging = deployment({
      id: 'pre-staging',
      createdAt: '2026-07-24T00:00:00.000Z',
      environment: 'staging',
    });
    const production = deployment({
      id: 'pre-prod',
      createdAt: '2026-07-10T00:00:00.000Z',
    });

    const result = mergeSuccessfulProductionDeploymentsWithPredecessor({
      inWindowDeployments: [inWindowFirst],
      preWindowDeployments: [production, staging, failed],
      windowFrom,
      productionEnvironments,
    });

    expect(result.predecessor).toEqual(production);
  });

  it('ignores pre-window rows that are still on or after windowFrom', () => {
    const atBoundary = deployment({
      id: 'at-from',
      createdAt: windowFrom.toISOString(),
    });
    const after = deployment({
      id: 'after-from',
      createdAt: '2026-08-02T00:00:00.000Z',
    });
    const before = deployment({
      id: 'before-from',
      createdAt: '2026-07-31T23:59:59.000Z',
    });

    const result = mergeSuccessfulProductionDeploymentsWithPredecessor({
      inWindowDeployments: [inWindowFirst],
      preWindowDeployments: [before, atBoundary, after],
      windowFrom,
      productionEnvironments,
    });

    expect(result.predecessor).toEqual(before);
  });

  it('does not prepend a deploy that is already in the in-window list', () => {
    const result = mergeSuccessfulProductionDeploymentsWithPredecessor({
      inWindowDeployments: [inWindowFirst],
      preWindowDeployments: [inWindowFirst],
      windowFrom,
      productionEnvironments,
    });

    expect(result.predecessor).toBeUndefined();
    expect(result.deployments).toEqual([inWindowFirst]);
  });

  it('returns empty in-window without inventing a scored deploy from predecessor only', () => {
    const predecessor = deployment({
      id: 'pre-only',
      createdAt: '2026-07-20T00:00:00.000Z',
    });

    const result = mergeSuccessfulProductionDeploymentsWithPredecessor({
      inWindowDeployments: [],
      preWindowDeployments: [predecessor],
      windowFrom,
      productionEnvironments,
    });

    expect(result.inWindow).toEqual([]);
    expect(result.predecessor).toEqual(predecessor);
    expect(result.deployments).toEqual([predecessor]);
  });
});
