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
  ScorecardCollectorsService,
  Collector,
} from '@red-hat-developer-hub/backstage-plugin-scorecard-node';

export function buildMockCollectorsService(options: {
  collectors: Collector[];
}): { collectorsService: ScorecardCollectorsService; collect: jest.Mock } {
  const { collectors } = options;
  const collectorsById = new Map(
    collectors.map(collector => [collector.getCollectorId(), collector]),
  );

  const collect = jest.fn(async ({ collectorId, entity, input, contract }) => {
    const collector = collectorsById.get(collectorId);
    if (!collector) {
      throw new Error(`Unexpected collector id "${collectorId}"`);
    }

    const output = await collector.collect({ entity, input });
    return contract.outputSchema.parse(output);
  });

  const collectorsService = {
    init: () => undefined,
    hasCollector: (collectorId: string) => collectorsById.has(collectorId),
    getCollectorMetadata: (collectorId: string) => {
      const collector = collectorsById.get(collectorId);
      if (!collector) {
        throw new Error(`Unexpected collector id "${collectorId}"`);
      }
      return {
        id: collector.getCollectorId(),
        description: collector.getCollectorDescription(),
      };
    },
    collect,
  } as ScorecardCollectorsService;

  return {
    collectorsService,
    collect,
  };
}
