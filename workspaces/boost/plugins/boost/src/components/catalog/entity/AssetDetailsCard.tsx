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

import { useMemo } from 'react';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Badge, Card, CardBody, CardHeader, Flex, Text } from '@backstage/ui';

import { useTranslation } from '../../../hooks/useTranslation';
import {
  getDistinctSpecField,
  getHandoffRefs,
} from '../../../utils/entityHelpers';
import {
  AssetTypeDetails,
  getAssetTypeDetails,
  hasAssetTypeDetails,
  DetailField,
} from './AssetTypeDetails';

export const AssetDetailsCard = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();

  const handoffRefs = useMemo(() => getHandoffRefs(entity), [entity]);
  const typeDetails = getAssetTypeDetails(entity, handoffRefs);
  const description = entity.metadata.description?.trim() || undefined;
  const rationale = getDistinctSpecField(entity, 'rationale');
  const version =
    entity.metadata.annotations?.['rhdh.io/ai-asset-version'] ?? undefined;

  if (
    !description &&
    !rationale &&
    !version &&
    !hasAssetTypeDetails(typeDetails)
  ) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small">{t('catalog.card.assetDetailsTitle')}</Text>
      </CardHeader>
      <CardBody>
        <Flex direction="column" gap="3">
          {description && (
            <DetailField label={t('catalog.card.descriptionLabel')}>
              <Text variant="body-medium">{description}</Text>
            </DetailField>
          )}
          {rationale && (
            <DetailField label={t('catalog.card.rationaleLabel')}>
              <Text variant="body-medium">{rationale}</Text>
            </DetailField>
          )}
          <AssetTypeDetails details={typeDetails} />
          {version && (
            <DetailField label={t('catalog.card.versionLabel')}>
              <Flex align="center">
                <Badge size="small">{version}</Badge>
              </Flex>
            </DetailField>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};
