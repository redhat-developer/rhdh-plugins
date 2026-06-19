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

export class CollectorRegistry {
  private readonly collectors = new Map<string, Collector>();

  register(collector: Collector): void {
    const collectorId = collector.getCollectorId();
    if (this.collectors.has(collectorId)) {
      throw new ConflictError(
        `Collector with ID '${collectorId}' has already been registered`,
      );
    }
    this.collectors.set(collectorId, collector);
  }

  getCollector(collectorId: string): Collector {
    const collector = this.collectors.get(collectorId);
    if (!collector) {
      throw new NotFoundError(
        `No collector registered for collector ID '${collectorId}'.`,
      );
    }
    return collector;
  }

  hasCollector(collectorId: string): boolean {
    return this.collectors.has(collectorId);
  }
}
