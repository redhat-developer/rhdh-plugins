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

import type { Entity } from '@backstage/catalog-model';
import { z } from 'zod';
import type { Collector, CollectorRegistry } from './Collector';
import { collectWithContract } from './collectWithContract';

const entity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: { name: 'service-a', namespace: 'default' },
};

describe('collectWithContract', () => {
  const collectorId = 'test.collector';

  const inputSchema = z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  });
  const outputSchema = z.object({
    deployments: z.array(z.object({ sha: z.string() })),
  });

  const collector: Collector = {
    getCollectorId: () => collectorId,
    getCollectorDescription: () => 'test collector',
    getInputSchema: () => inputSchema,
    getOutputSchema: () => outputSchema,
    collect: jest.fn(async () => ({
      deployments: [{ sha: 'abc123' }],
    })),
  };

  const collectorRegistry: CollectorRegistry = {
    getCollector: () => collector,
    hasCollector: () => true,
  };

  it('collects successfully when provider and collector contracts are compatible', async () => {
    const result = await collectWithContract({
      collectorRegistry,
      collectorId,
      contract: {
        inputSchema,
        outputSchema,
      },
      entity,
      input: {
        from: '2026-06-01T00:00:00.000Z',
        to: '2026-06-08T00:00:00.000Z',
      },
    });

    expect(result).toEqual({
      deployments: [{ sha: 'abc123' }],
    });
  });

  it('fails when provider input schema does not pass', async () => {
    await expect(
      collectWithContract({
        collectorRegistry,
        collectorId,
        contract: {
          inputSchema,
          outputSchema,
        },
        entity,
        input: { from: 'invalid', to: 'still-invalid' },
      }),
    ).rejects.toThrow('Invalid input for collector');
  });

  it('fails when collector output does not satisfy provider expected output', async () => {
    const outputMismatchCollector: Collector = {
      ...collector,
      getOutputSchema: () =>
        z.object({
          deployments: z.array(z.object({ sha: z.string(), id: z.number() })),
        }),
      collect: jest.fn(async () => ({
        deployments: [{ sha: 'abc123', id: 1 }],
      })),
    };

    const outputMismatchCollectorRegistry: CollectorRegistry = {
      getCollector: () => outputMismatchCollector,
      hasCollector: () => true,
    };

    await expect(
      collectWithContract({
        collectorRegistry: outputMismatchCollectorRegistry,
        collectorId,
        contract: {
          inputSchema,
          outputSchema: z.object({
            deployments: z.array(
              z.object({
                sha: z.string(),
                mergedAt: z.string(),
              }),
            ),
          }),
        },
        entity,
        input: {
          from: '2026-06-01T00:00:00.000Z',
          to: '2026-06-08T00:00:00.000Z',
        },
      }),
    ).rejects.toThrow('does not satisfy provider expected schema');
  });
});
