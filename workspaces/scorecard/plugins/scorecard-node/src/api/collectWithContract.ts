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
 * Provider-side collector contract expected by a metric provider.
 * @public
 */
export type ProviderCollectorContract<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny,
> = {
  inputSchema: TInputSchema;
  outputSchema: TOutputSchema;
};

/**
 * Resolve collector by id and execute collect with bidirectional schema checks:
 * - provider input schema
 * - collector input schema
 * - collector output schema
 * - provider output schema
 * @public
 */
export const collectWithContract = async <
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny,
>(options: {
  collectorRegistry: CollectorRegistry;
  collectorId: string;
  contract: ProviderCollectorContract<TInputSchema, TOutputSchema>;
  entity: Entity;
  input: unknown;
}): Promise<z.infer<TOutputSchema>> => {
  const collector = options.collectorRegistry.getCollector(options.collectorId);

  const providerInput = options.contract.inputSchema.safeParse(options.input);
  if (!providerInput.success) {
    throw new InputError(
      `Invalid input for collector "${
        options.collectorId
      }" expected by provider: ${providerInput.error.issues
        .map(issue => issue.message)
        .join('; ')}`,
    );
  }

  const collectorInput = collector
    .getInputSchema()
    .safeParse(providerInput.data);
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

  const providerOutput = options.contract.outputSchema.safeParse(
    collectorOutput.data,
  );
  if (!providerOutput.success) {
    throw new InputError(
      `Collector "${
        options.collectorId
      }" output does not satisfy provider expected schema: ${providerOutput.error.issues
        .map(issue => issue.message)
        .join('; ')}`,
    );
  }

  return providerOutput.data;
};
