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
import { Badge, Card, CardBody, CardHeader, Flex, Text } from '@backstage/ui';

import { useTranslation } from '../../../hooks/useTranslation';

export const VersionListCard = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();

  const version =
    entity.metadata.annotations?.['rhdh.io/ai-asset-version'] ?? '';

  if (!version) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small">{t('catalog.card.versionTitle')}</Text>
      </CardHeader>
      <CardBody>
        <Flex direction="column" gap="2">
          <Flex align="center" gap="2">
            <Badge size="small">{version}</Badge>
            <Text variant="body-x-small" color="secondary">
              {t('catalog.card.versionCurrent')}
            </Text>
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
};
