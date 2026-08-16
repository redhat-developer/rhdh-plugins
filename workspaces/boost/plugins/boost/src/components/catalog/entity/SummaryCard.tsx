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

import { useEntity } from '@backstage/plugin-catalog-react';
import { Card, CardBody, CardHeader, Flex, Text } from '@backstage/ui';

import { useTranslation } from '../../../hooks/useTranslation';
import { getSpecField } from '../../../utils/entityHelpers';

function getModelsAvailable(entity: { spec?: unknown }): string[] {
  const spec = entity.spec as Record<string, unknown> | undefined;
  const models = spec?.models as Record<string, unknown> | undefined;
  const available = models?.available;
  return Array.isArray(available) ? (available as string[]) : [];
}

function getBooleanSpecField(
  entity: { spec?: unknown },
  field: string,
): boolean | undefined {
  const spec = entity.spec as Record<string, unknown> | undefined;
  const value = spec?.[field];
  return typeof value === 'boolean' ? value : undefined;
}

export const SummaryCard = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();

  const description = entity.metadata.description ?? '';
  const rationale = getSpecField(entity, 'rationale');
  const modelsAvailable = getModelsAvailable(entity);

  const isAgent = getSpecField(entity, 'type') === 'agent';
  const instructions = isAgent
    ? getSpecField(entity, 'instructions')
    : undefined;
  const handoffDescription = isAgent
    ? getSpecField(entity, 'handoffDescription')
    : undefined;
  const enableRAG = isAgent
    ? getBooleanSpecField(entity, 'enableRAG')
    : undefined;

  if (
    !description &&
    !rationale &&
    modelsAvailable.length === 0 &&
    !instructions &&
    !handoffDescription &&
    enableRAG === undefined
  )
    return null;

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small">{t('catalog.card.summaryTitle')}</Text>
      </CardHeader>
      <CardBody>
        <Flex direction="column" gap="3">
          {description && <Text variant="body-medium">{description}</Text>}
          {rationale && (
            <Text variant="body-medium" color="secondary">
              {rationale}
            </Text>
          )}
          {modelsAvailable.length > 0 && (
            <Flex direction="column" gap="2">
              <Text variant="title-small">
                {`${t('catalog.card.modelsAvailableTitle')} (${modelsAvailable.length})`}
              </Text>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <Flex direction="column" gap="1">
                  {modelsAvailable.map(model => (
                    <Text key={model} variant="body-medium">
                      {model}
                    </Text>
                  ))}
                </Flex>
              </div>
            </Flex>
          )}
          {instructions && (
            <Flex direction="column" gap="1">
              <Text variant="title-small">
                {t('catalog.card.instructionsTitle')}
              </Text>
              <Text variant="body-medium" style={{ whiteSpace: 'pre-wrap' }}>
                {instructions}
              </Text>
            </Flex>
          )}
          {handoffDescription && (
            <Flex direction="column" gap="1">
              <Text variant="title-small">
                {t('catalog.card.handoffDescriptionTitle')}
              </Text>
              <Text variant="body-medium">{handoffDescription}</Text>
            </Flex>
          )}
          {enableRAG !== undefined && (
            <Flex direction="column" gap="1">
              <Text variant="title-small">
                {t('catalog.card.ragEnabledLabel')}
              </Text>
              <Text variant="body-medium">{enableRAG ? 'Yes' : 'No'}</Text>
            </Flex>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};
