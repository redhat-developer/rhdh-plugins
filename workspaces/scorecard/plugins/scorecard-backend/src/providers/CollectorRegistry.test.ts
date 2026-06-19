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

import { ConflictError, NotFoundError } from '@backstage/errors';
import type { Collector } from '@red-hat-developer-hub/backstage-plugin-scorecard-node';
import { z } from 'zod';
import { CollectorRegistry } from './CollectorRegistry';

describe('CollectorRegistry', () => {
  const collector: Collector = {
    getCollectorId: () => 'github:deployments',
    getCollectorDescription: () => 'Collect github deployments',
    getInputSchema: () =>
      z.object({
        from: z.string().datetime(),
        to: z.string().datetime(),
      }),
    getOutputSchema: () =>
      z.object({
        deployments: z.array(z.object({ sha: z.string() })),
      }),
    collect: jest.fn(),
  };

  it('registers and resolves collector by id', () => {
    const registry = new CollectorRegistry();
    registry.register(collector);

    expect(registry.hasCollector(collector.getCollectorId())).toBe(true);
    expect(registry.getCollector(collector.getCollectorId())).toBe(collector);
  });

  it('throws on duplicate collector id', () => {
    const registry = new CollectorRegistry();
    registry.register(collector);

    expect(() => registry.register(collector)).toThrow(
      new ConflictError(
        "Collector with ID 'github:deployments' has already been registered",
      ),
    );
  });

  it('throws on missing collector', () => {
    const registry = new CollectorRegistry();
    expect(() => registry.getCollector('missing.collector')).toThrow(
      new NotFoundError(
        "No collector registered for collector ID 'missing.collector'.",
      ),
    );
  });
});
