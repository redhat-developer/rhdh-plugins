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

export const SummaryCard = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();

  const description = entity.metadata.description ?? '';
  const rationale = getSpecField(entity, 'rationale');

  if (!description && !rationale) return null;

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
        </Flex>
      </CardBody>
    </Card>
  );
};
