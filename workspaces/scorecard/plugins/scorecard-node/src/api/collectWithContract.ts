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
import { InputError } from '@backstage/errors';
import type { z } from 'zod';
import type { CollectorRegistry } from './Collector';

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

/**
 * Resolve collector by id and execute collect with bidirectional schema checks:
 * - contract input schema
 * - collector input schema
 * - collector output schema
 * - contract output schema
 * @public
 */
export const collectWithContract = async <
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny,
>(options: {
  collectorRegistry: CollectorRegistry;
  collectorId: string;
  contract: CollectorContract<TInputSchema, TOutputSchema>;
  entity: Entity;
  input: unknown;
}): Promise<z.infer<TOutputSchema>> => {
  const collector = options.collectorRegistry.getCollector(options.collectorId);

  const contractInput = options.contract.inputSchema.safeParse(options.input);
  if (!contractInput.success) {
    throw new InputError(
      `Invalid input for collector "${
        options.collectorId
      }": input does not satisfy contract input schema: ${contractInput.error.issues
        .map(issue => issue.message)
        .join('; ')}`,
    );
  }

  const collectorInput = collector
    .getInputSchema()
    .safeParse(contractInput.data);
  if (!collectorInput.success) {
    throw new InputError(
      `Input does not satisfy collector "${
        options.collectorId
      }" input schema: ${collectorInput.error.issues
        .map(issue => issue.message)
        .join('; ')}`,
    );
  }

  const rawOutput = await collector.collect({
    entity: options.entity,
    input: collectorInput.data,
  });

  const collectorOutput = collector.getOutputSchema().safeParse(rawOutput);
  if (!collectorOutput.success) {
    throw new InputError(
      `Collector "${
        options.collectorId
      }" returned output that does not satisfy collector schema: ${collectorOutput.error.issues
        .map(issue => issue.message)
        .join('; ')}`,
    );
  }

  const contractOutput = options.contract.outputSchema.safeParse(
    collectorOutput.data,
  );
  if (!contractOutput.success) {
    throw new InputError(
      `Collector "${
        options.collectorId
      }" output does not satisfy contract output schema: ${contractOutput.error.issues
        .map(issue => issue.message)
        .join('; ')}`,
    );
  }

  return contractOutput.data;
};
