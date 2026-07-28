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
import { getCategoryMeta } from '../../../utils/categoryMeta';
import { getSpecField } from '../../../utils/entityHelpers';

function getLifecycleColor(lifecycle: string): string {
  switch (lifecycle.toLowerCase()) {
    case 'production':
      return '#4ade80';
    case 'experimental':
      return '#fbbf24';
    default:
      return '#9ca3af';
  }
}

export const SummaryCard = () => {
  const { entity } = useEntity();
  const { t } = useTranslation();

  const description = entity.metadata.description ?? '';
  const rationale = getSpecField(entity, 'rationale');
  const specType = getSpecField(entity, 'type');
  const lifecycle = getSpecField(entity, 'lifecycle');
  const version =
    entity.metadata.annotations?.['rhdh.io/ai-asset-version'] ?? '';
  const source = entity.metadata.annotations?.['rhdh.io/ai-asset-source'] ?? '';

  const categoryMeta = getCategoryMeta(specType);
  const hasMetadata = !!(specType || version || source || lifecycle);

  if (!description && !rationale && !hasMetadata) return null;

  const CategoryIcon = categoryMeta.icon;

  return (
    <Card>
      <CardHeader>
        <Text variant="title-small">{t('catalog.card.summaryTitle')}</Text>
      </CardHeader>
      <CardBody>
        <Flex direction="column" gap="3">
          {hasMetadata && (
            <Flex align="center" gap="2" wrap="wrap">
              {specType && (
                <Badge
                  style={{ backgroundColor: categoryMeta.color }}
                  aria-label={`${t('catalog.card.summaryCategory')}: ${categoryMeta.label}`}
                >
                  <Flex align="center" gap="1">
                    <CategoryIcon size={14} />
                    {categoryMeta.label}
                  </Flex>
                </Badge>
              )}
              {version && <Badge size="small">{version}</Badge>}
              {lifecycle && (
                <Badge
                  size="small"
                  style={{ backgroundColor: getLifecycleColor(lifecycle) }}
                  aria-label={`${t('catalog.card.summaryLifecycle')}: ${lifecycle}`}
                >
                  {lifecycle}
                </Badge>
              )}
            </Flex>
          )}
          {source && (
            <Text variant="body-x-small" color="secondary">
              {t('catalog.card.summarySource')}: {source}
            </Text>
          )}
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
