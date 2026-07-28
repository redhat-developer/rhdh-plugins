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
import type { z } from 'zod';

/**
 * Collector used by metric providers to gather datasource-specific data.
 * @public
 */
export interface Collector<
  TInputSchema extends z.ZodTypeAny = z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny = z.ZodTypeAny,
> {
  /**
   * Get the collector unique ID.
   * @public
   */
  getCollectorId(): string;
  /**
   * Human-readable collector description.
   * @public
   */
  getCollectorDescription(): string;
  /**
   * Input schema accepted by collect().
   * @public
   */
  getInputSchema(): TInputSchema;
  /**
   * Output schema returned by collect().
   * @public
   */
  getOutputSchema(): TOutputSchema;
  /**
   * Collect data for an entity and a collector-specific input payload.
   * @public
   */
  collect(options: {
    entity: Entity;
    input: z.infer<TInputSchema>;
  }): Promise<z.infer<TOutputSchema>>;
}

/**
 * Collector contract expected by caller.
 * @public
 */
export type CollectorContract<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny,
> = {
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
};
