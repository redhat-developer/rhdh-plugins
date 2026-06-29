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

import { z } from 'zod';
import { DefaultScorecardCollectorsService } from './DefaultScorecardCollectorsService';

describe('DefaultScorecardCollectorsService', () => {
  const entity = {
    apiVersion: 'backstage.io/v1alpha1',
    kind: 'Component',
    metadata: { name: 'service-a', namespace: 'default' },
  };

  const collectorId = 'test:collector';

  const contractInputSchema = z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  });
  const collectorInputSchema = z.object({
    from: z.string().datetime(),
    to: z.string().datetime(),
  });
  const collectorOutputSchema = z.object({
    deployments: z.array(z.object({ sha: z.string() })),
  });
  const contractOutputSchema = z.object({
    deployments: z.array(z.object({ sha: z.string() })),
  });

  const makeCollector = (overrides = {}) => ({
    getCollectorId: () => collectorId,
    getCollectorDescription: () => 'Test collector',
    getInputSchema: () => collectorInputSchema,
    getOutputSchema: () => collectorOutputSchema,
    collect: jest.fn(async () => ({
      deployments: [{ sha: 'abc123' }],
    })),
    ...overrides,
  });

  describe('init', () => {
    it('registers and resolves collectors by id', () => {
      const collector = makeCollector();
      const service = new DefaultScorecardCollectorsService();

      expect(service.hasCollector(collectorId)).toBe(false);
      service.init({ collectors: [collector] });
      expect(service.hasCollector(collectorId)).toBe(true);
    });

    it('throws on duplicate init call', () => {
      const collector = makeCollector();
      const service = new DefaultScorecardCollectorsService();

      service.init({ collectors: [collector] });
      expect(() => service.init({ collectors: [] })).toThrow(
        `Scorecard collectors service is already initialized`,
      );
    });

    it('throws on duplicate collector ids', () => {
      const collector = makeCollector();
      const service = new DefaultScorecardCollectorsService();

      expect(() =>
        service.init({ collectors: [collector, collector] }),
      ).toThrow(
        `Collector with ID '${collectorId}' has already been registered`,
      );
    });
  });

  describe('collect', () => {
    it('propagates lookup errors', async () => {
      const service = new DefaultScorecardCollectorsService();
      service.init({ collectors: [] });

      await expect(
        service.collect({
          collectorId,
          contract: {
            inputSchema: contractInputSchema,
            outputSchema: contractOutputSchema,
          },
          entity,
          input: {
            from: '2026-06-01T00:00:00.000Z',
            to: '2026-06-08T00:00:00.000Z',
          },
        }),
      ).rejects.toThrow(
        `No collector registered for collector ID '${collectorId}'`,
      );
    });

    it('collects successfully when collector and provider schemas are compatible', async () => {
      const collector = makeCollector();
      const service = new DefaultScorecardCollectorsService();
      service.init({ collectors: [collector] });

      const result = await service.collect({
        collectorId,
        contract: {
          inputSchema: contractInputSchema,
          outputSchema: contractOutputSchema,
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

    it('forwards input and entity to collector.collect', async () => {
      const collect = jest.fn(async () => ({
        deployments: [{ sha: 'abc123' }],
      }));
      const collector = makeCollector({ collect });
      const service = new DefaultScorecardCollectorsService();
      service.init({ collectors: [collector] });

      await service.collect({
        collectorId,
        contract: {
          inputSchema: contractInputSchema,
          outputSchema: contractOutputSchema,
        },
        entity,
        input: {
          from: '2026-06-01T00:00:00.000Z',
          to: '2026-06-08T00:00:00.000Z',
        },
      });

      expect(collect).toHaveBeenCalledWith({
        entity,
        input: {
          from: '2026-06-01T00:00:00.000Z',
          to: '2026-06-08T00:00:00.000Z',
        },
      });
    });

    it('fails when input does not satisfy contract input schema', async () => {
      const collector = makeCollector();
      const service = new DefaultScorecardCollectorsService();
      service.init({ collectors: [collector] });

      await expect(
        service.collect({
          collectorId,
          contract: {
            inputSchema: contractInputSchema,
            outputSchema: contractOutputSchema,
          },
          entity,
          input: {
            from: 'invalid',
            to: 5,
          },
        }),
      ).rejects.toThrow('input does not satisfy contract input schema');
    });

    it('fails when contract input does not satisfy collector input schema', async () => {
      const collector = makeCollector({
        getInputSchema: () =>
          z.object({
            from: z.string().datetime(),
            to: z.string().datetime(),
            environment: z.string().min(1),
          }),
      });
      const service = new DefaultScorecardCollectorsService();
      service.init({ collectors: [collector] });

      await expect(
        service.collect({
          collectorId,
          contract: {
            inputSchema: contractInputSchema,
            outputSchema: contractOutputSchema,
          },
          entity,
          input: {
            from: '2026-06-01T00:00:00.000Z',
            to: '2026-06-08T00:00:00.000Z',
          },
        }),
      ).rejects.toThrow('Input does not satisfy collector');
    });

    it('fails when collector output does not satisfy collector output schema', async () => {
      const collector = makeCollector({
        getOutputSchema: () =>
          z.object({
            deployments: z.array(
              z.object({
                sha: z.string(),
                id: z.number(),
              }),
            ),
          }),
        collect: jest.fn(async () => ({
          deployments: [{ sha: 'abc123' }],
        })),
      });
      const service = new DefaultScorecardCollectorsService();
      service.init({ collectors: [collector] });

      await expect(
        service.collect({
          collectorId,
          contract: {
            inputSchema: contractInputSchema,
            outputSchema: contractOutputSchema,
          },
          entity,
          input: {
            from: '2026-06-01T00:00:00.000Z',
            to: '2026-06-08T00:00:00.000Z',
          },
        }),
      ).rejects.toThrow(
        'returned output that does not satisfy collector schema',
      );
    });

    it('fails when collector output does not satisfy contract output schema', async () => {
      const collector = makeCollector({
        getOutputSchema: () =>
          z.object({
            deployments: z.array(z.object({ id: z.number() })),
          }),
        collect: jest.fn(async () => ({
          deployments: [{ id: 1 }],
        })),
      });
      const service = new DefaultScorecardCollectorsService();
      service.init({ collectors: [collector] });

      await expect(
        service.collect({
          collectorId,
          contract: {
            inputSchema: contractInputSchema,
            outputSchema: contractOutputSchema,
          },
          entity,
          input: {
            from: '2026-06-01T00:00:00.000Z',
            to: '2026-06-08T00:00:00.000Z',
          },
        }),
      ).rejects.toThrow('output does not satisfy contract output schema');
    });

    it('accepts collector params present in raw input but omitted by contract schema', async () => {
      const collector = makeCollector({
        getInputSchema: () =>
          z.object({
            from: z.string().datetime(),
            to: z.string().datetime(),
            environment: z.string().min(1),
          }),
      });
      const service = new DefaultScorecardCollectorsService();
      service.init({ collectors: [collector] });

      const result = await service.collect({
        collectorId,
        contract: {
          inputSchema: contractInputSchema,
          outputSchema: contractOutputSchema,
        },
        entity,
        input: {
          from: '2026-06-01T00:00:00.000Z',
          to: '2026-06-08T00:00:00.000Z',
          environment: 'prod',
        },
      });

      expect(result).toEqual({
        deployments: [{ sha: 'abc123' }],
      });
    });

    it('formats parse errors', async () => {
      const collector = makeCollector({
        getOutputSchema: () =>
          z.object({
            deployments: z.array(
              z.object({
                sha: z.string(),
                id: z.number(),
              }),
            ),
          }),
        collect: jest.fn(async () => ({
          deployments: [{ sha: 4 }],
        })),
      });
      const service = new DefaultScorecardCollectorsService();
      service.init({ collectors: [collector] });

      await expect(
        service.collect({
          collectorId,
          contract: {
            inputSchema: contractInputSchema,
            outputSchema: contractOutputSchema,
          },
          entity,
          input: {
            from: '2026-06-01T00:00:00.000Z',
            to: '2026-06-08T00:00:00.000Z',
          },
        }),
      ).rejects.toThrow(
        "Expected string, received number at 'deployments.0.sha'; Missing required value at 'deployments.0.id'",
      );
    });
  });
});
