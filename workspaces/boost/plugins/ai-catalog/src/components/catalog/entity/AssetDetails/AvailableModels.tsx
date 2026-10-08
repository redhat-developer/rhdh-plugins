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

import { Flex, Text } from '@backstage/ui';

import { AvailableModelsDialog } from './AvailableModelsDialog';

const INLINE_MODEL_LIMIT = 5;

interface AvailableModelsProps {
  readonly models: string[];
}

export const AvailableModels = ({ models }: AvailableModelsProps) => {
  const visibleModels = models.slice(0, INLINE_MODEL_LIMIT);

  return (
    <Flex direction="column" align="start" gap="1">
      {visibleModels.map((model, index) => (
        <Text key={`${model}-${index}`} variant="body-medium">
          {model}
        </Text>
      ))}
      {models.length > INLINE_MODEL_LIMIT && (
        <AvailableModelsDialog models={models} />
      )}
    </Flex>
  );
};
