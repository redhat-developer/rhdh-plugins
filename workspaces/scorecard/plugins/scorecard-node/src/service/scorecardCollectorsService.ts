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
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import type { Entity } from '@backstage/catalog-model';
import type { z } from 'zod';
import type { Collector, CollectorContract } from '../api';
import { DefaultScorecardCollectorsService } from './DefaultScorecardCollectorsService';

/**
 * Service interface for scorecard collectors.
 * @public
 */
export interface ScorecardCollectorsService {
  init(options: { collectors: Array<Collector> }): void;
  hasCollector(collectorId: string): boolean;
  collect<
    TInputSchema extends z.ZodTypeAny,
    TOutputSchema extends z.ZodTypeAny,
  >(options: {
    collectorId: string;
    contract: CollectorContract<TInputSchema, TOutputSchema>;
    entity: Entity;
    input: unknown;
  }): Promise<z.infer<TOutputSchema>>;
}

/**
 * Service reference for adding and consuming collectors in the scorecard plugin.
 * @public
 */
export const scorecardCollectorsServiceRef =
  createServiceRef<ScorecardCollectorsService>({
    id: 'scorecard.collectors.service',
    defaultFactory: async service =>
      createServiceFactory({
        service,
        deps: {},
        factory: async () => new DefaultScorecardCollectorsService(),
      }),
  });
